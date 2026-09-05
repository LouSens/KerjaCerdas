"""
KerjaCerdas — Rate Limiting Middleware
======================================
Sliding-window in-memory rate limiter using asyncio.

Rules (see ``_ROUTE_LIMITS``):
  - Default:    300 requests / 60 s per IP, shared across every unlisted route
  - Auth routes (login/register): 10 requests / 60 s per IP  ← brute-force guard
  - Agent invoke: 20 requests / 60 s per IP               ← LLM cost guard
  - OTP send: 5 requests / 60 s per IP                    ← SMS cost guard

COUNTER KEYS
  Counters are keyed by ``(ip, bucket)`` where *bucket* is the matched rule
  prefix, or ``__default__`` for everything else — **not** by the raw request
  path.  This matters for two reasons:

    1. Keying by raw path made the default limit meaningless: every distinct
       URL got its own 60/60 allowance, so an attacker walking
       ``/api/v1/jobs/<uuid>`` was never throttled in aggregate.
    2. It made the tracking map attacker-growable.  With one key per rule the
       number of counters an IP can create is bounded by
       ``len(_ROUTE_LIMITS) + 1``, so no request pattern can flood the map.

EVICTION
  The map is capped at ``_MAX_TRACKED_KEYS`` and evicts least-recently-used
  entries (``OrderedDict`` + ``move_to_end`` on every touch).  Eviction prefers
  keys whose window has fully expired and refuses to drop a counter that is
  currently at its limit, so an attacker cannot clear their own throttle by
  pushing other entries into the map.

SCALE-OUT:
  In a multi-instance deployment (Replit autoscale, Docker swarm, k8s) the
  in-process counters below are per-instance, so the effective per-IP limit
  silently becomes (N_instances × per-instance limit).
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from collections import OrderedDict, deque

from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
#  Route-specific limits: (max_requests, window_seconds)
# ──────────────────────────────────────────────────────────────────────────────
_ROUTE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/v1/auth/login": (10, 60),
    "/api/v1/auth/register": (10, 60),
    "/api/v1/agent/invoke": (20, 60),
    "/api/v1/uploads/cv": (10, 60),
    "/api/v1/uploads/job-pack": (10, 60),
    # OTP dispatch costs real money per message — keep it well below the
    # default so a stolen token cannot be used to SMS-bomb a phone number.
    "/api/v1/verify/otp/send": (5, 60),
    # Brute-force guard on top of the per-record attempt counter.
    "/api/v1/verify/otp/verify": (10, 60),
    # e-KYC lookups are billed per call once a real provider is wired in.
    "/api/v1/verify/identity": (10, 60),
    # Calls Gemini for course recommendations — same cost class as the agent.
    "/api/v1/seeker/skill-gap": (20, 60),
}

# Bucket name for every route without a specific rule.  All such routes share
# one counter per IP, so this is a true per-client ceiling on general browsing
# rather than a per-URL allowance.  Sized for a SPA that fans out several calls
# per screen; tighten it if the frontend's request volume drops.
_DEFAULT_BUCKET = "__default__"
_DEFAULT_LIMIT = (300, 60)  # 300 req / 60 s across all unlisted routes

# Maximum number of (ip, bucket) tracking entries before LRU eviction.
# Each IP can hold at most len(_ROUTE_LIMITS) + 1 entries, so this caps the
# number of distinct client IPs tracked, not the request pattern.
_MAX_TRACKED_KEYS = 10_000

# Prune stale entries every N requests handled (amortised O(1) cleanup).
_PRUNE_INTERVAL = 500

# Windows idle for longer than this are dropped by the periodic prune.
_STALE_AFTER_SECONDS = 3600


def _get_client_ip(request: Request) -> str:
    """Extract the client IP.

    X-Forwarded-For is intentionally never trusted here: it is a request
    header that any client can set to an arbitrary value, which would allow
    trivial rate-limit bypass (rotating the header on each request makes
    every request appear to come from a distinct IP). The real peer address
    reported by the TCP stack is the only trustworthy source.
    """
    return request.client.host if request.client else "unknown"


def _get_bucket(path: str) -> tuple[str, int, int]:
    """Return ``(bucket, max_requests, window_seconds)`` for a request path."""
    for prefix, (max_req, window) in _ROUTE_LIMITS.items():
        if path.startswith(prefix):
            return prefix, max_req, window
    return _DEFAULT_BUCKET, _DEFAULT_LIMIT[0], _DEFAULT_LIMIT[1]


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter that tracks requests per (IP, rule bucket) pair.

    Thread-safety: uses an asyncio.Lock per key — safe for async workers.
    Memory: bounded by _MAX_TRACKED_KEYS; LRU eviction prevents leak.
    Scale: process-local.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        # {(ip, bucket): deque[timestamp]} in least-recently-used-first order
        self._windows: OrderedDict[tuple[str, str], deque] = OrderedDict()
        # Separate global lock for key creation/eviction to avoid races
        self._map_lock = asyncio.Lock()
        # Per-key locks, created under _map_lock and evicted alongside windows
        self._locks: OrderedDict[tuple[str, str], asyncio.Lock] = OrderedDict()
        self._request_counter = 0

    def _get_limit(self, path: str) -> tuple[int, int]:
        """Return (max_requests, window_seconds) for the given path."""
        _, max_req, window = _get_bucket(path)
        return max_req, window

    def _is_throttled(self, key: tuple[str, str], now: float) -> bool:
        """True if this key is currently at or over its limit.

        Called under ``_map_lock`` during eviction: dropping a throttled
        counter would hand the caller a fresh allowance, which is exactly the
        bypass eviction must not enable.
        """
        dq = self._windows.get(key)
        if not dq:
            return False
        _, max_req, window = _get_bucket(key[1])
        window_start = now - window
        live = sum(1 for ts in dq if ts >= window_start)
        return live >= max_req

    def _evict_one(self, now: float) -> None:
        """Drop a single entry, preferring ones that cost nothing to lose.

        Order of preference:
          1. A key whose window is empty or entirely expired.
          2. The least-recently-used key that is *not* currently throttled.
          3. The least-recently-used key (all tracked keys are throttled).

        Must be called while holding ``_map_lock``.
        """
        for key, dq in self._windows.items():  # LRU-first iteration
            _, _, window = _get_bucket(key[1])
            if not dq or dq[-1] < now - window:
                self._drop(key)
                return

        for key in self._windows:
            if not self._is_throttled(key, now):
                self._drop(key)
                return

        logger.warning(
            "Rate limiter map full (%d keys) and every counter is throttled; "
            "evicting the least-recently-used entry",
            len(self._windows),
        )
        self._drop(next(iter(self._windows)))

    def _drop(self, key: tuple[str, str]) -> None:
        """Remove a key from both maps. Must be called while holding _map_lock."""
        self._windows.pop(key, None)
        self._locks.pop(key, None)

    async def _get_or_create_key(self, key: tuple[str, str]) -> asyncio.Lock:
        """Return the per-key lock, creating it (and evicting if over cap) under the global lock.

        Touching a key marks it most-recently-used, which is what makes the
        eviction policy LRU rather than insertion-ordered (FIFO).
        """
        async with self._map_lock:
            if key in self._locks:
                self._locks.move_to_end(key)
                self._windows.move_to_end(key)
                return self._locks[key]

            if len(self._locks) >= _MAX_TRACKED_KEYS:
                self._evict_one(time.monotonic())
            self._locks[key] = asyncio.Lock()
            self._windows[key] = deque()
            return self._locks[key]

    async def _prune_stale_keys(self) -> None:
        """Remove keys whose windows are empty or long idle."""
        now = time.monotonic()
        async with self._map_lock:
            stale = [
                k
                for k, dq in self._windows.items()
                if not dq or dq[-1] < now - _STALE_AFTER_SECONDS
            ]
            for k in stale:
                self._drop(k)

    async def dispatch(self, request: Request, call_next) -> Response:
        ip = _get_client_ip(request)
        path = request.url.path
        bucket, max_req, window = _get_bucket(path)
        key = (ip, bucket)

        key_lock = await self._get_or_create_key(key)

        async with key_lock:
            now = time.monotonic()
            window_start = now - window
            dq = self._windows[key]

            # Evict timestamps outside the sliding window
            while dq and dq[0] < window_start:
                dq.popleft()

            if len(dq) >= max_req:
                retry_after = int(window - (now - dq[0])) + 1
                logger.warning(
                    "Rate limit exceeded: ip=%s bucket=%s path=%s count=%d limit=%d",
                    ip,
                    bucket,
                    path,
                    len(dq),
                    max_req,
                )
                return Response(
                    content='{"detail":"Too many requests. Please slow down."}',
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    media_type="application/json",
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(max_req),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Window": str(window),
                    },
                )

            dq.append(now)
            remaining = max_req - len(dq)

        # Amortised cleanup every N requests (no lock needed for counter)
        self._request_counter += 1
        if self._request_counter % _PRUNE_INTERVAL == 0:
            asyncio.ensure_future(self._prune_stale_keys())

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_req)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Window"] = str(window)
        return response
