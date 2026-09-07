"""SemanticMatcher._job_candidates / _seeker_candidates branch selection.

The ANN prefilter orders candidates by cosine similarity alone, while the
hybrid score it approximates weighs skill/experience/education/recency too
(55% combined) — a candidate with a weak embedding match but strong
skill/experience fit can score well on the real formula yet never reach it
if their row falls outside the ANN's cosine-only top-K. Below
`settings.matching_full_scan_safe_limit` active rows, the matcher scores
every row directly instead, which is cheap at that scale and closes that
gap entirely. These tests pin the branch-selection logic itself, not the
scoring math (see test_matching_bands.py / test_matching_parity.py for
that).
"""

from __future__ import annotations

import pytest

from backend.app.config.settings import settings
from backend.app.services.matching.matcher import SemanticMatcher


class _FakeJobsRepo:
    def __init__(self, jobs: list) -> None:
        self._jobs = jobs

    async def list(self):
        return self._jobs


class _FakeSeekersRepo:
    def __init__(self, seekers: list) -> None:
        self._seekers = seekers

    async def list(self):
        return self._seekers


class _FakeRepos:
    def __init__(self, jobs: list | None = None, seekers: list | None = None) -> None:
        self.jobs = _FakeJobsRepo(jobs or [])
        self.seekers = _FakeSeekersRepo(seekers or [])


@pytest.fixture(autouse=True)
def _restore_limit(monkeypatch: pytest.MonkeyPatch):
    """Isolate each test's override of the module-level settings singleton."""
    monkeypatch.setattr(settings, "matching_full_scan_safe_limit", 500)


class TestJobCandidatesBranchSelection:
    async def test_small_active_count_takes_full_scan_not_ann(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(settings, "matching_full_scan_safe_limit", 500)
        sentinel_jobs = [object(), object()]

        async def fake_count():
            return 3  # well under the limit

        ann_called = False

        async def fake_ann(*a, **k):
            nonlocal ann_called
            ann_called = True
            return []

        monkeypatch.setattr(
            "backend.app.db.postgres_store.count_active_jobs", fake_count
        )
        monkeypatch.setattr(
            "backend.app.db.postgres_store.semantic_search_jobs", fake_ann
        )
        monkeypatch.setattr(
            "backend.app.db.postgres_store.get_repositories",
            lambda: _FakeRepos(jobs=sentinel_jobs),
        )

        matcher = SemanticMatcher()
        result = await matcher._job_candidates(query_vec=[1.0], top_k=10)

        assert not ann_called, "small dataset must skip the ANN path entirely"
        assert [j for j, cos in result] == sentinel_jobs
        assert all(cos is None for _, cos in result), "full scan yields cos=None (scored in Python)"

    async def test_large_active_count_uses_ann_path(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(settings, "matching_full_scan_safe_limit", 500)

        async def fake_count():
            return 10_000  # well over the limit

        ann_called = False

        async def fake_ann(query_vec, limit, model):
            nonlocal ann_called
            ann_called = True
            return []

        async def fake_missing(model):
            return []

        monkeypatch.setattr(
            "backend.app.db.postgres_store.count_active_jobs", fake_count
        )
        monkeypatch.setattr(
            "backend.app.db.postgres_store.semantic_search_jobs", fake_ann
        )
        monkeypatch.setattr(
            "backend.app.db.postgres_store.list_jobs_missing_embedding", fake_missing
        )

        matcher = SemanticMatcher()
        await matcher._job_candidates(query_vec=[1.0], top_k=10)

        assert ann_called, "large dataset must use the ANN-prefiltered path"

    async def test_count_failure_treated_as_large_not_small(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A COUNT query error must never be silently treated as 'safe to
        full-scan' — that would turn a transient DB hiccup into an
        unbounded full-table scan under load."""
        monkeypatch.setattr(settings, "matching_full_scan_safe_limit", 500)

        async def fake_count():
            return None  # count query failed

        ann_called = False

        async def fake_ann(query_vec, limit, model):
            nonlocal ann_called
            ann_called = True
            return []

        async def fake_missing(model):
            return []

        monkeypatch.setattr(
            "backend.app.db.postgres_store.count_active_jobs", fake_count
        )
        monkeypatch.setattr(
            "backend.app.db.postgres_store.semantic_search_jobs", fake_ann
        )
        monkeypatch.setattr(
            "backend.app.db.postgres_store.list_jobs_missing_embedding", fake_missing
        )

        matcher = SemanticMatcher()
        await matcher._job_candidates(query_vec=[1.0], top_k=10)

        assert ann_called, "an unknown count must not be treated as small"


class TestSeekerCandidatesBranchSelection:
    async def test_small_active_count_takes_full_scan_not_ann(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(settings, "matching_full_scan_safe_limit", 500)
        sentinel_seekers = [object()]

        async def fake_count():
            return 1

        ann_called = False

        async def fake_ann(*a, **k):
            nonlocal ann_called
            ann_called = True
            return []

        monkeypatch.setattr("backend.app.db.postgres_store.count_seekers", fake_count)
        monkeypatch.setattr(
            "backend.app.db.postgres_store.semantic_search_seekers", fake_ann
        )
        monkeypatch.setattr(
            "backend.app.db.postgres_store.get_repositories",
            lambda: _FakeRepos(seekers=sentinel_seekers),
        )

        matcher = SemanticMatcher()
        result = await matcher._seeker_candidates(query_vec=[1.0], top_k=10)

        assert not ann_called
        assert [s for s, cos in result] == sentinel_seekers
