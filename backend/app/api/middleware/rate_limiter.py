"""
KerjaCerdas — Rate Limiting Middleware
======================================
Sliding-window in-memory rate limiter using asyncio.

Rules (configurable via env):
  - Default:    60 requests / 60 s per IP
  - Auth routes (login/register): 10 requests / 60 s per IP  ← brute-force guard
  - Agent invoke: 20 requests / 60 s per IP               ← LLM cost guard

SCALE-OUT NOTE:
  This implementation is process-local. In a multi-instance deployment
  (Replit autoscale, Docker swarm, k8s) each instance maintains its own
  counters, so the effective per-IP limit is (N_instances × per-instance limit).
  Migrate to a Redis-backed sliding-window limiter before scaling beyond
  a single instance. The settings.redis_url config key is already prepared.

  Redis implementation sketch:
    key = f"rl:{ip}:{path_prefix}"
    now_ms = int(time.time() * 1000)
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now_ms - window_ms)
    pipe.zadd(key, {str(now_ms): now_ms})
    pipe.zcard(key)
    pipe.expire(key, window_seconds + 1)
    _, _, count, _ = await pipe.execute()

ANTIGRAVITY PROTOCOL: RULE-SECURITY-01 — All mutating endpoints are rate-limited.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections import deque

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
}
_DEFAULT_LIMIT = (60, 60)  # 60 req / 60 s

# Maximum number of (ip, path) tracking entries before LRU eviction.
# Prevents unbounded memory growth when scanners rotate IPs.
_MAX_TRACKED_KEYS = 10_000

# Prune stale entries every N requests handled (amortised O(1) cleanup).
_PRUNE_INTERVAL = 500


def _get_client_ip(request: Request) -> str:
    """Extract the client IP from the transport layer.

    X-Forwarded-For is intentionally ignored: it is a request header that any
    client can set to an arbitrary value, which would allow trivial rate-limit
    bypass (rotating the header on each request makes every request appear to
    come from a distinct IP).  In a direct-to-internet deployment the real
    peer address reported by the TCP stack is the only trustworthy source.

    If this service is ever placed behind a trusted reverse proxy (nginx,
    Caddy, AWS ALB, …), configure the proxy to *overwrite* (not append)
    a custom trusted header and read only that header here — do not blindly
    trust the client-supplied X-Forwarded-For.
    """
    return request.client.host if request.client else "unknown"


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter that tracks requests per (IP, route) pair.

    Thread-safety: uses asyncio.Lock per key — safe for async workers.
    Memory: bounded by _MAX_TRACKED_KEYS; LRU eviction prevents leak.
    Scale: process-local — see module docstring for Redis migration guide.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        # {(ip, path): deque[timestamp]}
        self._windows: dict[tuple[str, str], deque] = {}
        # Separate global lock for key creation/eviction to avoid races
        self._map_lock = asyncio.Lock()
        # Per-key locks stored in a plain dict (created under _map_lock)
        self._locks: dict[tuple[str, str], asyncio.Lock] = {}
        self._request_counter = 0

    def _get_limit(self, path: str) -> tuple[int, int]:
        """Return (max_requests, window_seconds) for the given path."""
        for prefix, limit in _ROUTE_LIMITS.items():
            if path.startswith(prefix):
                return limit
        return _DEFAULT_LIMIT

    async def _get_or_create_key(self, key: tuple[str, str]) -> asyncio.Lock:
        """Return the per-key lock, creating it (and evicting if over cap) under the global lock."""
        async with self._map_lock:
            if key not in self._locks:
                # Evict oldest entry if at capacity
                if len(self._locks) >= _MAX_TRACKED_KEYS:
                    oldest = next(iter(self._locks))
                    del self._locks[oldest]
                    self._windows.pop(oldest, None)
                self._locks[key] = asyncio.Lock()
                self._windows[key] = deque()
            return self._locks[key]

    async def _prune_stale_keys(self) -> None:
        """Remove keys whose windows are completely empty (all timestamps expired)."""
        now = time.monotonic()
        async with self._map_lock:
            stale = [
                k for k, dq in self._windows.items()
                if not dq or dq[-1] < now - 3600  # last request > 1h ago
            ]
            for k in stale:
                self._windows.pop(k, None)
                self._locks.pop(k, None)

    async def dispatch(self, request: Request, call_next) -> Response:
        ip = _get_client_ip(request)
        path = request.url.path
        max_req, window = self._get_limit(path)

        key = (ip, path)
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
                    "Rate limit exceeded: ip=%s path=%s count=%d limit=%d",
                    ip,
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
