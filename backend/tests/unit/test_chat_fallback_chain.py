"""Tests for the Gemini chat fallback chain under quota exhaustion (429s).

Covers:
1. build_chat_llm fails over in chain order when models are throttled.
2. When the WHOLE chain is exhausted, the agent endpoint still returns
   matches + a friendly fallback message (GraphRecursionError safety net),
   never a 500.
"""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from langchain_core.messages import AIMessage
from langchain_core.runnables import Runnable

from backend.app.services import llm_factory
from backend.app.services.llm_factory import build_chat_llm, chat_model_chain


class _ThrottledError(Exception):
    """Simulated 429 from the Gemini API."""

    def __init__(self, model: str):
        super().__init__(f"429 RESOURCE_EXHAUSTED quota exceeded for {model}")


class _FakeGeminiLLM(Runnable):
    """Stands in for ChatGoogleGenerativeAI; raises 429 for throttled models."""

    call_log: list[str] = []  # shared per-test via reset()
    throttled: set[str] = set()

    def __init__(self, model: str, **kwargs):
        self.model = model
        self.kwargs = kwargs

    @classmethod
    def reset(cls, throttled: set[str]):
        cls.call_log = []
        cls.throttled = throttled

    def _run(self):
        type(self).call_log.append(self.model)
        if self.model in type(self).throttled:
            raise _ThrottledError(self.model)
        return AIMessage(content=f"answer-from-{self.model}")

    def invoke(self, input, config=None, **kwargs):
        return self._run()

    async def ainvoke(self, input, config=None, **kwargs):
        return self._run()


@pytest.fixture
def fake_gemini():
    llm_factory.reset_breaker()
    with patch.object(llm_factory, "ChatGoogleGenerativeAI", _FakeGeminiLLM):
        yield _FakeGeminiLLM
    llm_factory.reset_breaker()


CHAIN = chat_model_chain()


def test_chain_has_three_models_in_expected_order():
    assert CHAIN == [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
    ]


@pytest.mark.asyncio
async def test_primary_healthy_no_fallback_used(fake_gemini):
    fake_gemini.reset(throttled=set())
    llm = build_chat_llm()
    out = await llm.ainvoke("hi")
    assert out.content == f"answer-from-{CHAIN[0]}"
    assert fake_gemini.call_log == [CHAIN[0]]


@pytest.mark.asyncio
async def test_primary_throttled_fails_over_to_second(fake_gemini):
    fake_gemini.reset(throttled={CHAIN[0]})
    llm = build_chat_llm()
    out = await llm.ainvoke("hi")
    assert out.content == f"answer-from-{CHAIN[1]}"
    assert fake_gemini.call_log == [CHAIN[0], CHAIN[1]]


@pytest.mark.asyncio
async def test_first_two_throttled_last_resort_answers(fake_gemini):
    fake_gemini.reset(throttled={CHAIN[0], CHAIN[1]})
    llm = build_chat_llm()
    out = await llm.ainvoke("hi")
    assert out.content == f"answer-from-{CHAIN[2]}"
    assert fake_gemini.call_log == CHAIN


@pytest.mark.asyncio
async def test_all_three_throttled_raises_llm_busy(fake_gemini):
    from backend.app.services.llm_factory import LLMBusyError

    fake_gemini.reset(throttled=set(CHAIN))
    llm = build_chat_llm()
    with pytest.raises(LLMBusyError):
        await llm.ainvoke("hi")
    # Every model in the chain was attempted, in order, before giving up.
    assert fake_gemini.call_log == CHAIN


@pytest.mark.asyncio
async def test_circuit_breaker_fails_fast_after_total_failure(fake_gemini):
    """Second call while the breaker is open must NOT hit any model."""
    from backend.app.services.llm_factory import LLMBusyError

    fake_gemini.reset(throttled=set(CHAIN))
    llm = build_chat_llm()
    with pytest.raises(LLMBusyError):
        await llm.ainvoke("hi")
    assert fake_gemini.call_log == CHAIN  # first call burned the whole chain

    fake_gemini.reset(throttled=set())  # models healthy again, but breaker open
    with pytest.raises(LLMBusyError):
        await llm.ainvoke("hi")
    assert fake_gemini.call_log == []  # zero network calls while breaker open

    llm_factory.reset_breaker()
    out = await llm.ainvoke("hi")  # cooldown over → normal service resumes
    assert out.content == f"answer-from-{CHAIN[0]}"


# ---------------------------------------------------------------------------
# Endpoint safety net: whole chain exhausted → matches + friendly text, not 500
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agent_endpoint_survives_total_quota_exhaustion():
    """GraphRecursionError (agent starved by throttling) must degrade gracefully."""
    from langgraph.errors import GraphRecursionError

    from backend.app.api.dependencies import get_current_user
    from backend.app.api.main import app
    from backend.app.api.routers import agent as agent_router
    from backend.app.db.schemas import JobPosting, MatchResult, SeekerProfile, Skill

    user = SimpleNamespace(id="u1", email="t@t.t", role="seeker", is_active=True)
    seeker = SeekerProfile(
        id="s1",
        user_id="u1",
        full_name="Tester",
        region_code="3171",
        skills=[Skill(name="python", level="advanced", years=3)],
    )
    job = JobPosting(
        id="j1",
        employer_id="e1",
        title="Backend Dev",
        description="python backend",
        required_skills=["python"],
        region_code="3171",
    )
    match = MatchResult(
        job_id="j1",
        seeker_id="s1",
        score=0.85,
        cosine=0.9,
        skill_overlap=1.0,
        region_match=True,
        salary_in_range=True,
        rank=1,
        band="strong",
    )

    repos = SimpleNamespace(
        seekers=SimpleNamespace(get=AsyncMock(return_value=seeker), find=AsyncMock(return_value=[seeker])),
        jobs=SimpleNamespace(get_many=AsyncMock(return_value=[job])),
        employers=SimpleNamespace(
            get=AsyncMock(return_value=SimpleNamespace(company_name="PT Test"))
        ),
    )

    starved_graph = SimpleNamespace(
        ainvoke=AsyncMock(side_effect=GraphRecursionError("recursion limit hit"))
    )

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with (
            patch.object(agent_router, "get_repositories", return_value=repos),
            patch(
                "backend.app.services.matching.matcher.SemanticMatcher.rank_jobs_for_seeker",
                new=AsyncMock(return_value=[match]),
            ),
            patch(
                "backend.app.agents.graph.builder.get_graph",
                return_value=starved_graph,
            ),
        ):
            from fastapi.testclient import TestClient

            client = TestClient(app)
            resp = client.post(
                "/api/v1/agent/invoke",
                json={"user_message": "cari kerja python", "seeker_id": "s1"},
            )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert resp.status_code == 200  # never a 500
    data = resp.json()
    # Deterministic matches survive even though the LLM chain is dead.
    assert len(data["matches"]) == 1
    assert data["matches"][0]["job_id"] == "j1"
    assert data["matches"][0]["company"] == "PT Test"
    # Friendly fallback text, in Bahasa, explaining the AI is busy.
    assert "Asisten AI sedang sibuk" in data["final_response"]
