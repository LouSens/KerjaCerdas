"""Unit 1 — employer-side match bands + within-band randomization.

Verifies that the recruiter shortlist is grouped into Strong/Possible/Stretch
instead of a finalized ranking, and that ordering inside a band is stable per
job but does not leak a false hierarchy.
"""
from __future__ import annotations

import pytest

from backend.app.config.settings import settings
from backend.app.db.schemas import JobPosting, SeekerProfile, Skill
from backend.app.services.matching.matcher import SemanticMatcher, _assign_bands


def _seeker(name: str, skills: list[str]) -> SeekerProfile:
    return SeekerProfile(
        user_id=f"u-{name}",
        full_name=name,
        region_code="3171",
        skills=[Skill(name=s) for s in skills],
    )


def test_assign_bands_buckets_by_threshold_and_orders() -> None:
    cands = [
        {"seeker_id": "a", "score": 0.90},
        {"seeker_id": "b", "score": 0.50},
        {"seeker_id": "c", "score": 0.10},
        {"seeker_id": "d", "score": 0.66},
    ]
    out = _assign_bands(cands, "job-xyz", 0.65, 0.45)

    bands = {c["seeker_id"]: c["band"] for c in out}
    assert bands == {"a": "strong", "d": "strong", "b": "possible", "c": "stretch"}
    # emitted strong -> possible -> stretch, with a contiguous 1..N rank
    assert [c["band"] for c in out] == ["strong", "strong", "possible", "stretch"]
    assert [c["rank"] for c in out] == [1, 2, 3, 4]


def test_assign_bands_shuffle_is_stable_per_job() -> None:
    def fresh() -> list[dict]:
        return [{"seeker_id": str(i), "score": 0.90} for i in range(8)]

    first = [c["seeker_id"] for c in _assign_bands(fresh(), "job-1", 0.65, 0.45)]
    again = [c["seeker_id"] for c in _assign_bands(fresh(), "job-1", 0.65, 0.45)]
    other = [c["seeker_id"] for c in _assign_bands(fresh(), "job-2", 0.65, 0.45)]

    assert first == again, "ordering must be stable for the same job id"
    # different seed -> (almost surely) a different in-band order
    assert other != first or len(set(first)) <= 1


@pytest.mark.asyncio
async def test_rank_seekers_includes_band_and_rank() -> None:
    job = JobPosting(
        employer_id="emp-1",
        title="Junior Data Analyst",
        description="Analisis data dengan Excel dan SQL.",
        required_skills=["Excel", "SQL", "Python"],
        region_code="3171",
    )
    seekers = [
        _seeker("Full", ["Excel", "SQL", "Python"]),
        _seeker("One", ["Excel"]),
        _seeker("None", ["Memasak"]),
    ]

    ranked = await SemanticMatcher().rank_seekers_for_job(job, seekers, top_k=15)

    assert ranked, "expected ranked candidates"
    assert all(c.get("band") in {"strong", "possible", "stretch"} for c in ranked)
    assert [c["rank"] for c in ranked] == list(range(1, len(ranked) + 1))
    # bands are emitted in strong -> possible -> stretch order
    order = {"strong": 0, "possible": 1, "stretch": 2}
    seq = [order[c["band"]] for c in ranked]
    assert seq == sorted(seq)
    # and each band is consistent with the configured thresholds
    for c in ranked:
        if c["band"] == "strong":
            assert c["score"] >= settings.band_strong_threshold
        elif c["band"] == "possible":
            assert settings.band_possible_threshold <= c["score"] < settings.band_strong_threshold
        else:
            assert c["score"] < settings.band_possible_threshold
