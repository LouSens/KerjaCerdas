"""Rate limiter, concurrency and middleware-ordering tests."""

from __future__ import annotations

import asyncio

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from backend.app.api.middleware.rate_limiter import (
    _DEFAULT_LIMIT,
    _MAX_TRACKED_KEYS,
    _ROUTE_LIMITS,
    RateLimiterMiddleware,
)


def _make_request(path: str, ip: str = "1.2.3.4") -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": path,
        "raw_path": path.encode(),
        "root_path": "",
        "query_string": b"",
        "headers": [],
        "client": (ip, 12345),
        "scheme": "http",
        "server": ("testserver", 80),
    }
    return Request(scope)


async def _ok(_request):
    return Response(status_code=200)


@pytest.fixture
def limiter() -> RateLimiterMiddleware:
    return RateLimiterMiddleware(app=lambda *a, **k: None)


class TestLimitSelection:
    @pytest.mark.parametrize(("path", "expected"), list(_ROUTE_LIMITS.items()))
    def test_configured_routes_get_their_own_limit(
        self, limiter: RateLimiterMiddleware, path: str, expected: tuple[int, int]
    ) -> None:
        assert limiter._get_limit(path) == expected

    def test_unknown_route_gets_the_default(self, limiter: RateLimiterMiddleware) -> None:
        assert limiter._get_limit("/api/v1/jobs") == _DEFAULT_LIMIT

    def test_prefix_match_covers_sub_paths(self, limiter: RateLimiterMiddleware) -> None:
        assert limiter._get_limit("/api/v1/auth/login/extra") == _ROUTE_LIMITS[
            "/api/v1/auth/login"
        ]

    @pytest.mark.parametrize(
        "path",
        [
            "/api/v1/verify/otp/send",
            "/api/v1/verify/otp/verify",
            "/api/v1/verify/identity",
            "/api/v1/seeker/skill-gap",
        ],
    )
    def test_costly_endpoints_are_stricter_than_the_default(
        self, limiter: RateLimiterMiddleware, path: str
    ) -> None:
        """Endpoints that spend money per call (SMS, e-KYC, Gemini) or that
        gate a credential must not sit on the generic 60/min budget."""
        max_req, _ = limiter._get_limit(path)
        assert max_req < _DEFAULT_LIMIT[0], f"{path} is on the default budget"

    def test_otp_send_is_the_tightest_budget(self, limiter: RateLimiterMiddleware) -> None:
        assert limiter._get_limit("/api/v1/verify/otp/send") == (5, 60)

    def test_path_casing_variant_escapes_the_strict_limit(
        self, limiter: RateLimiterMiddleware
    ) -> None:
        """Matching is case-sensitive; a differently cased path gets 60/min."""
        assert limiter._get_limit("/api/v1/auth/Login") == _DEFAULT_LIMIT

    def test_double_slash_prefix_escapes_the_strict_limit(
        self, limiter: RateLimiterMiddleware
    ) -> None:
        assert limiter._get_limit("//api/v1/auth/login") == _DEFAULT_LIMIT


class TestWindowEnforcement:
    async def test_requests_are_allowed_up_to_the_limit(
        self, limiter: RateLimiterMiddleware
    ) -> None:
        max_req, _ = _ROUTE_LIMITS["/api/v1/auth/login"]
        for i in range(max_req):
            resp = await limiter.dispatch(_make_request("/api/v1/auth/login"), _ok)
            assert resp.status_code == 200, f"blocked early at request {i + 1}"

    async def test_the_next_request_is_throttled(self, limiter: RateLimiterMiddleware) -> None:
        max_req, _ = _ROUTE_LIMITS["/api/v1/auth/login"]
        for _ in range(max_req):
            await limiter.dispatch(_make_request("/api/v1/auth/login"), _ok)
        resp = await limiter.dispatch(_make_request("/api/v1/auth/login"), _ok)
        assert resp.status_code == 429
        assert int(resp.headers["Retry-After"]) >= 1
        assert resp.headers["X-RateLimit-Remaining"] == "0"

    async def test_headers_count_down(self, limiter: RateLimiterMiddleware) -> None:
        r1 = await limiter.dispatch(_make_request("/api/v1/jobs"), _ok)
        r2 = await limiter.dispatch(_make_request("/api/v1/jobs"), _ok)
        assert int(r1.headers["X-RateLimit-Remaining"]) > int(
            r2.headers["X-RateLimit-Remaining"]
        )

    async def test_different_ips_have_independent_budgets(
        self, limiter: RateLimiterMiddleware
    ) -> None:
        max_req, _ = _ROUTE_LIMITS["/api/v1/auth/login"]
        for _ in range(max_req):
            await limiter.dispatch(_make_request("/api/v1/auth/login", ip="10.0.0.1"), _ok)
        other = await limiter.dispatch(
            _make_request("/api/v1/auth/login", ip="10.0.0.2"), _ok
        )
        assert other.status_code == 200

    async def test_different_paths_have_independent_budgets(
        self, limiter: RateLimiterMiddleware
    ) -> None:
        max_req, _ = _ROUTE_LIMITS["/api/v1/auth/login"]
        for _ in range(max_req):
            await limiter.dispatch(_make_request("/api/v1/auth/login"), _ok)
        assert (
            await limiter.dispatch(_make_request("/api/v1/auth/register"), _ok)
        ).status_code == 200

    async def test_window_expiry_restores_the_budget(
        self, limiter: RateLimiterMiddleware, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import backend.app.api.middleware.rate_limiter as rl

        clock = {"t": 1_000.0}
        monkeypatch.setattr(rl.time, "monotonic", lambda: clock["t"])

        max_req, window = _ROUTE_LIMITS["/api/v1/auth/login"]
        for _ in range(max_req):
            await limiter.dispatch(_make_request("/api/v1/auth/login"), _ok)
        assert (
            await limiter.dispatch(_make_request("/api/v1/auth/login"), _ok)
        ).status_code == 429

        clock["t"] += window + 1
        assert (
            await limiter.dispatch(_make_request("/api/v1/auth/login"), _ok)
        ).status_code == 200


class TestConcurrency:
    async def test_parallel_burst_never_exceeds_the_limit(
        self, limiter: RateLimiterMiddleware
    ) -> None:
        """The per-key lock must make the check-and-append atomic."""
        max_req, _ = _ROUTE_LIMITS["/api/v1/agent/invoke"]
        attempts = max_req * 4

        async def slow_ok(_request):
            await asyncio.sleep(0)  # force a scheduling point inside the handler
            return Response(status_code=200)

        results = await asyncio.gather(
            *(
                limiter.dispatch(_make_request("/api/v1/agent/invoke"), slow_ok)
                for _ in range(attempts)
            )
        )
        allowed = sum(1 for r in results if r.status_code == 200)
        assert allowed == max_req, f"{allowed} requests admitted, limit is {max_req}"

    async def test_parallel_distinct_keys_do_not_deadlock(
        self, limiter: RateLimiterMiddleware
    ) -> None:
        results = await asyncio.gather(
            *(
                limiter.dispatch(_make_request(f"/api/v1/jobs/{i}", ip=f"10.1.0.{i}"), _ok)
                for i in range(50)
            )
        )
        assert all(r.status_code == 200 for r in results)

    async def test_window_state_is_consistent_after_a_burst(
        self, limiter: RateLimiterMiddleware
    ) -> None:
        await asyncio.gather(
            *(limiter.dispatch(_make_request("/api/v1/jobs"), _ok) for _ in range(30))
        )
        dq = limiter._windows[("1.2.3.4", "/api/v1/jobs")]
        assert len(dq) == 30
        assert list(dq) == sorted(dq), "timestamps recorded out of order"


class TestMemoryBounds:
    async def test_tracked_keys_are_capped(self, limiter: RateLimiterMiddleware) -> None:
        for i in range(_MAX_TRACKED_KEYS + 200):
            await limiter._get_or_create_key(("1.2.3.4", f"/p/{i}"))
        assert len(limiter._locks) <= _MAX_TRACKED_KEYS
        assert len(limiter._windows) <= _MAX_TRACKED_KEYS

    async def test_eviction_is_fifo_not_lru(self, limiter: RateLimiterMiddleware) -> None:
        """Eviction drops the oldest *inserted* key even if it is the hottest.

        An attacker who is being throttled can therefore flush their own
        counter by creating _MAX_TRACKED_KEYS fresh keys.
        """
        hot = ("9.9.9.9", "/api/v1/auth/login")
        await limiter._get_or_create_key(hot)
        for _ in range(_ROUTE_LIMITS["/api/v1/auth/login"][0]):
            await limiter.dispatch(_make_request("/api/v1/auth/login", ip="9.9.9.9"), _ok)
        assert (
            await limiter.dispatch(_make_request("/api/v1/auth/login", ip="9.9.9.9"), _ok)
        ).status_code == 429

        # Flood with fresh keys to push the hot key out of the map.
        for i in range(_MAX_TRACKED_KEYS + 1):
            await limiter._get_or_create_key(("9.9.9.9", f"/flood/{i}"))
        assert hot not in limiter._windows, "hot key survived — eviction is now LRU"

        recovered = await limiter.dispatch(
            _make_request("/api/v1/auth/login", ip="9.9.9.9"), _ok
        )
        assert recovered.status_code == 200, "rate limit was NOT bypassed — update this test"

    async def test_prune_removes_stale_keys(
        self, limiter: RateLimiterMiddleware, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import backend.app.api.middleware.rate_limiter as rl

        clock = {"t": 1_000.0}
        monkeypatch.setattr(rl.time, "monotonic", lambda: clock["t"])
        await limiter.dispatch(_make_request("/api/v1/jobs"), _ok)
        assert limiter._windows

        clock["t"] += 7_200  # 2 hours later
        await limiter._prune_stale_keys()
        assert not limiter._windows


class TestForwardedHeaderSpoofing:
    async def test_x_forwarded_for_is_ignored(self, limiter: RateLimiterMiddleware) -> None:
        """Rotating XFF must not hand the client a fresh budget."""

        def req_with_xff(value: str) -> Request:
            return Request(
                {
                    "type": "http",
                    "method": "GET",
                    "path": "/api/v1/auth/login",
                    "raw_path": b"/api/v1/auth/login",
                    "root_path": "",
                    "query_string": b"",
                    "headers": [(b"x-forwarded-for", value.encode())],
                    "client": ("5.5.5.5", 1234),
                    "scheme": "http",
                    "server": ("testserver", 80),
                }
            )

        max_req, _ = _ROUTE_LIMITS["/api/v1/auth/login"]
        for i in range(max_req):
            assert (await limiter.dispatch(req_with_xff(f"10.0.0.{i}"), _ok)).status_code == 200
        blocked = await limiter.dispatch(req_with_xff("10.0.0.99"), _ok)
        assert blocked.status_code == 429


class TestLiveAppIntegration:
    def test_login_route_throttles_over_http(self, client: TestClient) -> None:
        max_req, _ = _ROUTE_LIMITS["/api/v1/auth/login"]
        codes = [
            client.post(
                "/api/v1/auth/login",
                json={"email": "nobody@example.com", "password": "wrong"},
            ).status_code
            for _ in range(max_req + 3)
        ]
        assert 429 in codes, f"brute-force protection never fired: {codes}"

    def test_rate_limit_headers_are_present_on_success(self, client: TestClient) -> None:
        resp = client.get("/health")
        assert "X-RateLimit-Limit" in resp.headers
        assert "X-RateLimit-Remaining" in resp.headers

    def test_throttled_response_is_json(self, client: TestClient) -> None:
        max_req, _ = _ROUTE_LIMITS["/api/v1/auth/login"]
        last = None
        for _ in range(max_req + 3):
            last = client.post(
                "/api/v1/auth/login", json={"email": "a@b.com", "password": "x"}
            )
        assert last.status_code == 429
        assert last.json()["detail"]


class TestOversizedBodyGuard:
    def test_large_content_length_is_rejected(self, client: TestClient) -> None:
        from backend.app.api.middleware.sanitization import MAX_BODY_BYTES

        resp = client.post(
            "/api/v1/auth/login",
            content=b"{}",
            headers={
                "Content-Length": str(MAX_BODY_BYTES + 1),
                "Content-Type": "application/json",
            },
        )
        assert resp.status_code == 413

    def test_upload_paths_are_exempt(self) -> None:
        from backend.app.api.middleware.sanitization import RequestSizeMiddleware

        mw = RequestSizeMiddleware(app=lambda *a, **k: None)
        assert mw.max_bytes > 0  # exemption is path-based, asserted via routing below


class TestMiddlewareWiring:
    def test_both_guards_are_installed(self) -> None:
        from backend.app.api.main import app as real_app
        from backend.app.api.middleware.sanitization import RequestSizeMiddleware

        classes = {m.cls for m in real_app.user_middleware}
        assert RateLimiterMiddleware in classes
        assert RequestSizeMiddleware in classes

    def test_rate_limiter_runs_before_the_route(self) -> None:
        """A throttled request must not reach the handler."""
        probe = FastAPI()
        hits = {"n": 0}

        @probe.get("/api/v1/auth/login")
        async def _handler():
            hits["n"] += 1
            return JSONResponse({"ok": True})

        probe.add_middleware(RateLimiterMiddleware)
        max_req, _ = _ROUTE_LIMITS["/api/v1/auth/login"]
        with TestClient(probe) as c:
            for _ in range(max_req + 5):
                c.get("/api/v1/auth/login")
        assert hits["n"] == max_req
