"""GET /jobs's in-memory cache must be invalidated by every job write path.

Regression test for a gap found in code review: employer.py's create_job/
update_job/delete_job called invalidate_jobs_cache(), but the job-pack bulk
upload endpoint (uploads.py::upload_job_pack) wrote jobs the same way
without invalidating — so a job created via that path was invisible on
GET /jobs for up to the 5-minute cache TTL.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

_MINIMAL_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


async def _two_postings(*_args, **_kwargs):
    return {
        "postings": [
            {"title": "First Posting (will succeed)", "description": "ok"},
            {"title": "Second Posting (will fail)", "description": "boom"},
        ]
    }


def test_job_pack_upload_is_immediately_visible_on_list_jobs(
    client: TestClient, employer_account: dict, stub_embedder
) -> None:
    # Warm the cache with the (currently empty) job list, same as a real
    # visitor hitting the public listing before any job exists.
    before = client.get("/api/v1/jobs")
    assert before.status_code == 200
    assert before.json()["total"] == 0

    upload = client.post(
        "/api/v1/uploads/job-pack",
        files={"file": ("jobs.pdf", _MINIMAL_PDF, "application/pdf")},
        headers=employer_account["headers"],
    )
    assert upload.status_code == 200, upload.text
    assert upload.json()["created_job_ids"]

    after = client.get("/api/v1/jobs")
    assert after.status_code == 200
    assert after.json()["total"] == 1, (
        "job-pack upload created a job but GET /jobs still serves the stale "
        "cached (empty) list — invalidate_jobs_cache() is missing from the "
        "job-pack write path"
    )


def test_partial_pack_failure_still_invalidates_for_the_postings_that_committed(
    client: TestClient,
    employer_account: dict,
    stub_embedder,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Regression for a second gap: invalidating once after the whole loop
    meant that if posting N of a multi-job pack raised (embedding or DB
    error), postings 1..N-1 — already committed by their own upsert calls —
    were still served from the stale pre-upload cache for the rest of the
    TTL, since the post-loop invalidate_jobs_cache() never ran."""
    from backend.app.api.routers import uploads as uploads_mod
    from backend.app.services.matching.matcher import SemanticMatcher

    monkeypatch.setattr(uploads_mod, "parse_job_pack", _two_postings)

    calls = {"n": 0}
    real_embed_job = SemanticMatcher.embed_job

    async def _embed_job_fail_on_second(self, job):
        calls["n"] += 1
        if calls["n"] == 2:
            raise RuntimeError("simulated embedding failure on the 2nd posting")
        return await real_embed_job(self, job)

    monkeypatch.setattr(SemanticMatcher, "embed_job", _embed_job_fail_on_second)

    assert client.get("/api/v1/jobs").json()["total"] == 0

    with pytest.raises(RuntimeError, match="simulated embedding failure"):
        client.post(
            "/api/v1/uploads/job-pack",
            files={"file": ("jobs.pdf", _MINIMAL_PDF, "application/pdf")},
            headers=employer_account["headers"],
        )

    after = client.get("/api/v1/jobs")
    assert after.json()["total"] == 1, (
        "the first posting committed before the second one raised, but "
        "GET /jobs still serves the stale pre-upload cache — invalidation "
        "must happen per-commit inside the loop, not once after it"
    )


def test_employer_job_crud_invalidates_the_cache(
    client: TestClient, employer_account: dict, stub_embedder
) -> None:
    """Same guarantee for the employer.py CRUD endpoints, so a future edit
    that removes one of these calls fails a test instead of shipping silently."""
    assert client.get("/api/v1/jobs").json()["total"] == 0

    create = client.post(
        "/api/v1/employer/jobs",
        json={
            "title": "Backend Engineer",
            "description": "Build things.",
            "required_skills": ["Python"],
            "region_code": "3171",
            "salary_min": 10_000_000,
            "salary_max": 15_000_000,
            "work_type": "onsite",
        },
        headers=employer_account["headers"],
    )
    assert create.status_code == 201, create.text
    job_id = create.json()["job_id"]
    assert client.get("/api/v1/jobs").json()["total"] == 1

    client.patch(
        f"/api/v1/employer/jobs/{job_id}",
        json={"title": "Senior Backend Engineer"},
        headers=employer_account["headers"],
    )
    listed = client.get("/api/v1/jobs").json()["items"]
    assert listed[0]["title"] == "Senior Backend Engineer"

    client.delete(f"/api/v1/employer/jobs/{job_id}", headers=employer_account["headers"])
    assert client.get("/api/v1/jobs").json()["total"] == 0
