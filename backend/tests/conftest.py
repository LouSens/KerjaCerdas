"""Shared pytest fixtures for the KerjaCerdas backend test-suite.

Gives every test an isolated on-disk SQLite database, a fully started app
(the lifespan runs, so the JWT secret and the engine are configured), and
stubbed AI dependencies so nothing reaches the network.
"""

from __future__ import annotations

import os
import tempfile
import uuid
from collections.abc import Iterator
from pathlib import Path

# Environment must be set BEFORE backend.app.config.settings is imported,
# because Settings() is instantiated at module import time.
_TMP_DB_DIR = tempfile.mkdtemp(prefix="kerjacerdas-tests-")
_TEST_DB_PATH = Path(_TMP_DB_DIR) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TEST_DB_PATH}"
os.environ.pop("PROD_DATABASE_URL", None)
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-unit-tests-only-32b"
os.environ["APP_ENV"] = "development"
os.environ.setdefault("GEMINI_API_KEY", "")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.app.config.settings import settings  # noqa: E402

settings.database_url = os.environ["DATABASE_URL"]
settings.prod_database_url = ""
settings.jwt_secret_key = os.environ["JWT_SECRET_KEY"]
# A developer's local .env can freely override CORS_ALLOW_ORIGINS (e.g. to a
# single narrowed-down origin while debugging) — Settings() already picked
# that up before this module could intervene. Pin it back to the code's own
# default set so CORS tests exercise the application's real defaults instead
# of whatever happens to be in one machine's .env file.
settings.cors_allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


# ── Deterministic stand-ins for the AI layer ─────────────────────────────────


class StubEmbedder:
    """Deterministic embedder: no network, stable vectors for equal text."""

    model = "stub-embed-model"

    def __init__(self) -> None:
        self.calls: list[str] = []

    async def embed(self, text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
        self.calls.append(text)
        # Cheap deterministic hash-based vector; direction depends on content.
        import hashlib

        digest = hashlib.sha256(text.encode("utf-8")).digest()
        base_vec = [(b - 128) / 128.0 for b in digest[:16]]
        # Pad to 768 dimensions to satisfy pgvector Vector(768) type coercion
        return (base_vec * (768 // 16))[:768]


class StubLLM:
    """Records prompts and replays canned responses without calling Gemini."""

    def __init__(self, reply: str = "Ini jawaban demo dari asisten KerjaCerdas.") -> None:
        self.reply = reply
        self.prompts: list[list] = []

    async def ainvoke(self, messages, config=None):
        from langchain_core.messages import AIMessage

        self.prompts.append(list(messages))
        return AIMessage(content=self.reply)

    def invoke(self, messages, config=None):
        from langchain_core.messages import AIMessage

        self.prompts.append(list(messages))
        return AIMessage(content=self.reply)


@pytest.fixture
def stub_llm(monkeypatch: pytest.MonkeyPatch) -> StubLLM:
    """Replace every build_chat_llm() call site with a recording stub."""
    llm = StubLLM()

    def _factory(*args, **kwargs):
        return llm

    monkeypatch.setattr("backend.app.services.llm_factory.build_chat_llm", _factory)
    monkeypatch.setattr("backend.app.agents.graph.builder.build_chat_llm", _factory, raising=False)
    # The compiled graph is a module-level singleton; drop it so the next
    # get_graph() rebuilds against the stub.
    monkeypatch.setattr("backend.app.agents.graph.builder._graph_v2", None, raising=False)
    return llm


@pytest.fixture
def stub_embedder(monkeypatch: pytest.MonkeyPatch) -> StubEmbedder:
    """Replace the Gemini embedder and clear the process-wide query cache."""
    from backend.app.services.matching import matcher as matcher_mod

    emb = StubEmbedder()
    monkeypatch.setattr(matcher_mod, "get_embedder", lambda: emb)
    matcher_mod._query_cache.clear()
    return emb


# ── App / database fixtures ──────────────────────────────────────────────────


@pytest.fixture(scope="session")
def _app():
    from backend.app.api.main import app

    return app


@pytest.fixture
def client(_app) -> Iterator[TestClient]:
    """Started app (lifespan runs) backed by the isolated SQLite file."""
    with TestClient(_app) as c:
        yield c


@pytest.fixture(autouse=True)
def _clean_database():
    """Wipe every table after each test so the shared SQLite file stays isolated."""
    yield

    import asyncio

    from backend.app.api import database as db_mod
    from backend.app.db.models import Base as ModelsBase

    async def _wipe() -> None:
        async with db_mod.engine.begin() as conn:
            for table in reversed(ModelsBase.metadata.sorted_tables):
                try:
                    await conn.execute(table.delete())
                except Exception:  # table not created yet
                    pass

    asyncio.run(_wipe())

    # Process-wide caches that would otherwise carry rows across tests.
    from backend.app.services.matching import matcher as matcher_mod

    matcher_mod._query_cache.clear()

    from backend.app.agents.graph import builder as builder_mod

    builder_mod._graph_v2 = None

    from backend.app.api.routers import jobs as jobs_mod

    jobs_mod.invalidate_jobs_cache()


@pytest.fixture(autouse=True)
def _reset_rate_limiter(_app):
    """Rate-limit windows are process-global; wipe them between tests."""
    from backend.app.api.middleware.rate_limiter import RateLimiterMiddleware

    yield
    stack = getattr(_app, "middleware_stack", None)
    seen = set()
    while stack is not None and id(stack) not in seen:
        seen.add(id(stack))
        if isinstance(stack, RateLimiterMiddleware):
            stack._windows.clear()
            stack._locks.clear()
            break
        stack = getattr(stack, "app", None)


# ── Account helpers ──────────────────────────────────────────────────────────


def _register(client: TestClient, role: str, password: str = "SecurePass1") -> dict:
    email = f"{role}-{uuid.uuid4().hex[:10]}@example.com"
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "name": f"Test {role.title()}",
            "role": role,
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    return {
        "email": email,
        "password": password,
        "token": body["access_token"],
        "user": body["user"],
        "headers": {"Authorization": f"Bearer {body['access_token']}"},
    }


@pytest.fixture
def seeker_account(client: TestClient) -> dict:
    return _register(client, "seeker")


@pytest.fixture
def other_seeker_account(client: TestClient) -> dict:
    return _register(client, "seeker")


@pytest.fixture
def employer_account(client: TestClient) -> dict:
    return _register(client, "employer")


@pytest.fixture
def register() -> callable:
    """Expose the registration helper for tests that need extra accounts."""
    return _register


# ── Domain seeding helpers ───────────────────────────────────────────────────


@pytest.fixture
def seeded_job(client: TestClient, employer_account: dict, stub_embedder) -> dict:
    """One active job owned by `employer_account`."""
    payload = {
        "title": "Data Analyst",
        "description": "Menganalisis data penjualan dan membuat dashboard.",
        "required_skills": ["Python", "SQL", "Tableau"],
        "nice_to_have_skills": ["Excel"],
        "education_min": "S1",
        "experience_years_min": 1,
        "region_code": "3171",
        "salary_min": 8_000_000,
        "salary_max": 14_000_000,
        "work_type": "onsite",
    }
    resp = client.post("/api/v1/employer/jobs", json=payload, headers=employer_account["headers"])
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.fixture
def seeker_profile(client: TestClient, seeker_account: dict, stub_embedder) -> dict:
    """A seeker profile with a partial skill overlap against `seeded_job`."""
    payload = {
        "full_name": "Budi Santoso",
        "region_code": "3171",
        "education_level": "S1",
        "salary_expectation": 10_000_000,
        "skills": [{"name": "Python"}, {"name": "Excel"}],
    }
    resp = client.post("/api/v1/seeker/profile", json=payload, headers=seeker_account["headers"])
    assert resp.status_code in (200, 201), resp.text
    return client.get("/api/v1/seeker/profile", headers=seeker_account["headers"]).json()
