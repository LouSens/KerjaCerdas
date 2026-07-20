"""
KerjaCerdas — Rate Limiting Middleware
======================================
Sliding-window in-memory rate limiter using asyncio.

Rules (configurable via env):
  - Default:    60 requests / 60 s per IP
  - Auth routes (login/register): 10 requests / 60 s per IP  ← brute-force guard
  - Agent invoke: 20 requests / 60 s per IP               ← LLM cost guard

In production, replace the in-memory store with Redis (see redis_rate_limiter.py).

ANTIGRAVITY PROTOCOL: RULE-SECURITY-01 — All mutating endpoints are rate-limited.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict, deque

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
    Memory: deques auto-expire old timestamps so memory stays bounded.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        # {(ip, path): deque[timestamp]}
        self._windows: dict[tuple[str, str], deque] = defaultdict(deque)
        self._locks: dict[tuple[str, str], asyncio.Lock] = defaultdict(asyncio.Lock)

    def _get_limit(self, path: str) -> tuple[int, int]:
        """Return (max_requests, window_seconds) for the given path."""
        for prefix, limit in _ROUTE_LIMITS.items():
            if path.startswith(prefix):
                return limit
        return _DEFAULT_LIMIT

    async def dispatch(self, request: Request, call_next) -> Response:
        ip = _get_client_ip(request)
        path = request.url.path
        max_req, window = self._get_limit(path)

        key = (ip, path)
        async with self._locks[key]:
            now = time.monotonic()
            window_start = now - window
            dq = self._windows[key]

            # Evict timestamps outside the sliding window
            while dq and dq[0] < window_start:
                dq.popleft()

            if len(dq) >= max_req:
                retry_after = int(window - (now - dq[0])) + 1
                logger.warning(
                    "Rate limit exceeded: path=%s count=%d limit=%d",
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

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_req)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Window"] = str(window)
        return response
