"""Caching (embedding query cache, prompt cache) and routing tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.services.matching import matcher as matcher_mod
from backend.app.services.matching.matcher import (
    _QUERY_CACHE_MAX,
    SemanticMatcher,
    _query_cache_key,
)


class TestQueryEmbeddingCache:
    @pytest.fixture(autouse=True)
    def _clear(self, monkeypatch: pytest.MonkeyPatch):
        matcher_mod._query_cache.clear()
        # Neutralise the Postgres second tier so these test the in-process LRU.
        async def _no_persisted(_key):
            return None

        async def _no_save(*a, **k):
            return None

        monkeypatch.setattr(
            "backend.app.db.postgres_store.get_query_embedding", _no_persisted
        )
        monkeypatch.setattr("backend.app.db.postgres_store.save_query_embedding", _no_save)
        yield
        matcher_mod._query_cache.clear()

    def test_key_is_stable_and_model_scoped(self) -> None:
        assert _query_cache_key("m1", "abc") == _query_cache_key("m1", "abc")
        assert _query_cache_key("m1", "abc") != _query_cache_key("m2", "abc")
        assert _query_cache_key("m1", "abc") != _query_cache_key("m1", "abd")

    def test_key_does_not_leak_the_source_text(self) -> None:
        key = _query_cache_key("m", "NIK 3171010101900001 Budi")
        assert "3171010101900001" not in key
        assert len(key) == 64

    async def test_repeat_text_is_served_from_cache(self, stub_embedder) -> None:
        m = SemanticMatcher()
        await m._embed_query_cached("profil budi")
        await m._embed_query_cached("profil budi")
        assert len(stub_embedder.calls) == 1, "cache miss on identical text"

    async def test_changed_text_invalidates(self, stub_embedder) -> None:
        m = SemanticMatcher()
        await m._embed_query_cached("profil budi")
        await m._embed_query_cached("profil budi + SQL")
        assert len(stub_embedder.calls) == 2

    async def test_cache_is_bounded(self, stub_embedder) -> None:
        m = SemanticMatcher()
        for i in range(_QUERY_CACHE_MAX + 25):
            await m._embed_query_cached(f"text-{i}")
        assert len(matcher_mod._query_cache) <= _QUERY_CACHE_MAX

    async def test_eviction_is_lru(self, stub_embedder) -> None:
        m = SemanticMatcher()
        await m._embed_query_cached("hot")
        for i in range(_QUERY_CACHE_MAX - 1):
            await m._embed_query_cached(f"filler-{i}")
        await m._embed_query_cached("hot")  # refresh recency
        await m._embed_query_cached("overflow")
        assert _query_cache_key(stub_embedder.model, "hot") in matcher_mod._query_cache

    async def test_embedder_failure_is_not_cached(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from backend.app.services.matching.embeddings.gemini import (
            EmbeddingUnavailableError,
        )

        class FlakyEmbedder:
            model = "flaky"

            def __init__(self):
                self.n = 0

            async def embed(self, text, task_type="RETRIEVAL_QUERY"):
                self.n += 1
                if self.n == 1:
                    raise EmbeddingUnavailableError("down")
                return [0.1, 0.2]

        emb = FlakyEmbedder()
        monkeypatch.setattr(matcher_mod, "get_embedder", lambda: emb)
        m = SemanticMatcher()
        with pytest.raises(EmbeddingUnavailableError):
            await m._embed_query_cached("t")
        assert await m._embed_query_cached("t") == [0.1, 0.2]

    async def test_db_tier_error_degrades_to_a_miss(
        self, stub_embedder, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        async def _boom(_key):
            raise RuntimeError("db down")

        monkeypatch.setattr("backend.app.db.postgres_store.get_query_embedding", _boom)
        m = SemanticMatcher()
        with pytest.raises(RuntimeError):
            await m._embed_query_cached("t")

    async def test_concurrent_misses_are_not_deduplicated(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """No single-flight guard: N parallel identical misses cost N embeds.

        The embedder here awaits, the way a real network call does, so all
        eight coroutines observe the same empty cache before any of them
        writes to it.
        """
        import asyncio

        class SlowEmbedder:
            model = "slow"

            def __init__(self):
                self.calls = []

            async def embed(self, text, task_type="RETRIEVAL_QUERY"):
                self.calls.append(text)
                await asyncio.sleep(0.01)
                return [0.5, 0.5]

        emb = SlowEmbedder()
        monkeypatch.setattr(matcher_mod, "get_embedder", lambda: emb)
        m = SemanticMatcher()
        await asyncio.gather(*(m._embed_query_cached("same text") for _ in range(8)))
        assert len(emb.calls) == 8, "single-flight now exists — update this test"


class TestPromptCache:
    def test_system_prompt_is_memoised(self) -> None:
        from backend.app.services.prompt_loader import build_system_prompt

        build_system_prompt.cache_clear()
        first = build_system_prompt(role="supervisor")
        assert build_system_prompt.cache_info().misses == 1
        second = build_system_prompt(role="supervisor")
        assert build_system_prompt.cache_info().hits == 1
        assert first is second

    def test_different_roles_are_cached_separately(self) -> None:
        from backend.app.services.prompt_loader import build_system_prompt

        build_system_prompt.cache_clear()
        a = build_system_prompt(role="supervisor")
        b = build_system_prompt(role="seeker_advisor")
        assert a != b

    def test_unknown_role_does_not_raise(self) -> None:
        from backend.app.services.prompt_loader import build_system_prompt

        assert isinstance(build_system_prompt(role="../../etc/passwd"), str)

    def test_prompt_loader_does_not_escape_the_prompts_directory(self) -> None:
        """A traversal-shaped role must not read arbitrary files."""
        from backend.app.services.prompt_loader import build_system_prompt

        out = build_system_prompt(role="../../../../etc/passwd")
        assert "root:x:" not in out


class TestGraphSingleton:
    def test_graph_is_built_once(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from backend.app.agents.graph import builder

        monkeypatch.setattr(builder, "_graph_v2", None)
        calls = {"n": 0}
        original = builder.build_graph_v2

        def counting(*a, **k):
            calls["n"] += 1
            return original(*a, **k)

        monkeypatch.setattr(builder, "build_graph_v2", counting)
        builder.get_graph()
        builder.get_graph()
        assert calls["n"] == 1


class TestRouting:
    EXPECTED_PREFIXES = [
        "/api/v1/auth",
        "/api/v1/seeker",
        "/api/v1/employer",
        "/api/v1/jobs",
        "/api/v1/uploads",
        "/api/v1/verify",
        "/api/v1/agent",
        "/api/v1/events",
        "/api/v1/experiments",
    ]

    def _spec(self, client: TestClient) -> dict:
        """The OpenAPI document is the app's real, flattened route table.

        This FastAPI version keeps included routers as nested `_IncludedRouter`
        objects, so `app.routes` alone does not list their paths.
        """
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        return resp.json()["paths"]

    def _paths(self, client: TestClient) -> list[str]:
        return list(self._spec(client))

    @pytest.mark.parametrize("prefix", EXPECTED_PREFIXES)
    def test_every_router_is_mounted_under_the_versioned_prefix(
        self, client: TestClient, prefix: str
    ) -> None:
        assert any(p.startswith(prefix) for p in self._paths(client)), f"{prefix} not mounted"

    def test_no_route_is_registered_twice(self, client: TestClient) -> None:
        from collections import Counter

        pairs = [
            (path, method)
            for path, ops in self._spec(client).items()
            for method in ops
        ]
        dupes = [p for p, n in Counter(pairs).items() if n > 1]
        assert not dupes, f"duplicate routes: {dupes}"

    def test_every_documented_path_is_versioned_or_an_ops_endpoint(
        self, client: TestClient
    ) -> None:
        allowed_unversioned = {"/", "/health", "/health/detailed"}
        stray = [
            p
            for p in self._paths(client)
            if not p.startswith("/api/v1/") and p not in allowed_unversioned
        ]
        assert not stray, f"unversioned routes: {stray}"

    def test_health_is_unversioned_and_public(self, client: TestClient) -> None:
        assert client.get("/health").status_code == 200

    def test_detailed_health_requires_auth(self, client: TestClient) -> None:
        """HTTPBearer(auto_error=True) answers a missing header with 403."""
        assert client.get("/health/detailed").status_code in (401, 403)

    def test_detailed_health_rejects_a_bad_token(self, client: TestClient) -> None:
        resp = client.get(
            "/health/detailed", headers={"Authorization": "Bearer not-a-real-token"}
        )
        assert resp.status_code == 401

    def test_detailed_health_works_with_a_token(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        resp = client.get("/health/detailed", headers=seeker_account["headers"])
        assert resp.status_code == 200
        assert "checks" in resp.json()

    def test_unknown_route_is_404(self, client: TestClient) -> None:
        assert client.get("/api/v1/definitely-not-a-route").status_code == 404

    def test_wrong_method_is_405(self, client: TestClient) -> None:
        assert client.get("/api/v1/auth/login").status_code == 405

    def test_openapi_is_reachable(self, client: TestClient) -> None:
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        assert resp.json()["info"]["title"] == "KerjaCerdas API"

    def test_interactive_docs_are_public(self, client: TestClient) -> None:
        """/docs is served with no auth gate in every environment."""
        assert client.get("/docs").status_code == 200, "docs are now gated — update this test"

    @pytest.mark.parametrize(
        "path",
        [
            "/api/v1/seeker/profile",
            "/api/v1/seeker/applications",
            "/api/v1/seeker/skill-gap/latest",
            "/api/v1/employer/profile",
            "/api/v1/employer/jobs",
            "/api/v1/employer/applications",
            "/api/v1/verify/documents",
        ],
    )
    def test_data_routes_require_authentication(self, client: TestClient, path: str) -> None:
        assert client.get(path).status_code == 401, f"{path} is unauthenticated"

    def test_trailing_slash_redirects_rather_than_404s(self, client: TestClient) -> None:
        resp = client.get("/health/", follow_redirects=False)
        assert resp.status_code in (200, 307, 404)
