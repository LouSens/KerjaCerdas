"""Tests for embedding failure policy and cross-model ranking safety."""

from unittest.mock import patch

import pytest

from backend.app.db.schemas import JobPosting, SeekerProfile, Skill
from backend.app.services.matching.embeddings.gemini import (
    EmbeddingUnavailableError,
    GeminiEmbedder,
    _is_quota_error,
)
from backend.app.services.matching.matcher import SemanticMatcher


def test_is_quota_error_detection():
    assert _is_quota_error(Exception("429 RESOURCE_EXHAUSTED blah"))
    assert _is_quota_error(Exception("You exceeded your current quota"))
    assert not _is_quota_error(Exception("connection reset by peer"))


@pytest.mark.asyncio
async def test_non_quota_error_raises_immediately_no_retry():
    e = GeminiEmbedder()
    e._api_key = "fake-key"

    calls = {"n": 0}

    def boom(*a, **k):
        calls["n"] += 1
        raise RuntimeError("SSL handshake failed")

    with patch.object(e, "_client_or_raise", return_value=object()):
        with patch("asyncio.to_thread", side_effect=boom):
            with pytest.raises(EmbeddingUnavailableError):
                await e.embed_batch(["x"], task_type="RETRIEVAL_QUERY")
    assert calls["n"] == 1  # no retries for non-quota errors


@pytest.mark.asyncio
async def test_query_time_quota_gets_single_quick_retry():
    e = GeminiEmbedder()
    e._api_key = "fake-key"
    calls = {"n": 0}

    def boom(*a, **k):
        calls["n"] += 1
        raise RuntimeError("429 RESOURCE_EXHAUSTED")

    with patch.object(e, "_client_or_raise", return_value=object()):
        with patch("asyncio.to_thread", side_effect=boom):
            with patch("asyncio.sleep", return_value=None):
                with pytest.raises(EmbeddingUnavailableError):
                    await e.embed_batch(["x"], task_type="RETRIEVAL_QUERY")
    assert calls["n"] == 2  # exactly one retry at query time


@pytest.mark.asyncio
async def test_mixed_model_vectors_score_zero_cosine():
    """Rows embedded with a different model must not contribute cosine similarity."""
    from backend.app.config.settings import settings

    seeker = SeekerProfile(
        id="s1",
        user_id="s1",
        full_name="Tester",
        region_code="3171",
        skills=[Skill(name="python", level="advanced", years=3)],
    )
    same = [1.0] * 8
    job_current = JobPosting(
        id="j-current",
        employer_id="e1",
        title="Backend Dev",
        description="python backend",
        required_skills=["python"],
        region_code="3171",
        embedding=same,
        embedding_model=settings.gemini_embed_model,
    )
    job_stale = JobPosting(
        id="j-stale",
        employer_id="e1",
        title="Backend Dev",
        description="python backend",
        required_skills=["python"],
        region_code="3171",
        embedding=same,
        embedding_model="text-embedding-004",  # incompatible model
    )

    matcher = SemanticMatcher()

    async def fake_embed(text, task_type="RETRIEVAL_QUERY"):
        return same

    with patch.object(matcher.embedder, "embed", side_effect=fake_embed):
        results = await matcher.rank_jobs_for_seeker(seeker, [job_current, job_stale])

    by_id = {r.job_id: r for r in results}
    assert by_id["j-current"].cosine > 0.99
    assert by_id["j-stale"].cosine == 0.0  # stale-model vector ignored
