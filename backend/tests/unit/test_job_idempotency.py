"""client_ref idempotent-replay behavior on POST /employer/jobs.

Covers the fix for the Greptile P1 finding "Retries duplicate published
vacancies": a create request retried with the same client_ref (after the
original response was lost to a timeout/dropped connection) must return the
already-created job instead of inserting a duplicate — and the response must
say so via `created`, so a caller batching several creates (JobPackUploader)
can tell a genuine create apart from a replay.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

BASE_JOB = {
    "title": "Data Analyst",
    "description": "Analisis data.",
    "region_code": "3171",
}


class TestClientRefIdempotency:
    def test_first_create_reports_created_true(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        resp = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "client_ref": "ref-1"},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["created"] is True

    def test_replay_with_same_client_ref_returns_existing_job_and_created_false(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        first = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "client_ref": "ref-2"},
            headers=employer_account["headers"],
        )
        second = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "client_ref": "ref-2"},
            headers=employer_account["headers"],
        )
        assert second.status_code == 201, second.text
        assert second.json()["created"] is False
        assert second.json()["job_id"] == first.json()["job_id"]

        jobs = client.get(
            "/api/v1/employer/jobs", headers=employer_account["headers"]
        ).json()["items"]
        matching = [j for j in jobs if j["id"] == first.json()["job_id"]]
        assert len(matching) == 1, "replay must not create a second row"

    def test_different_client_refs_both_create(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        a = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "client_ref": "ref-3a"},
            headers=employer_account["headers"],
        )
        b = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "client_ref": "ref-3b"},
            headers=employer_account["headers"],
        )
        assert a.json()["created"] is True
        assert b.json()["created"] is True
        assert a.json()["job_id"] != b.json()["job_id"]

    def test_no_client_ref_always_creates(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        """The manual "Pasang Lowongan" form never sends client_ref — that
        path must behave exactly as before (no idempotency check at all)."""
        a = client.post(
            "/api/v1/employer/jobs", json=BASE_JOB, headers=employer_account["headers"]
        )
        b = client.post(
            "/api/v1/employer/jobs", json=BASE_JOB, headers=employer_account["headers"]
        )
        assert a.json()["created"] is True
        assert b.json()["created"] is True
        assert a.json()["job_id"] != b.json()["job_id"]

    def test_same_client_ref_from_a_different_employer_is_independent(
        self,
        client: TestClient,
        employer_account: dict,
        register,
        stub_embedder,
    ) -> None:
        other_employer = register(client, "employer")
        a = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "client_ref": "shared-ref"},
            headers=employer_account["headers"],
        )
        b = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "client_ref": "shared-ref"},
            headers=other_employer["headers"],
        )
        assert a.json()["created"] is True
        assert b.json()["created"] is True
        assert a.json()["job_id"] != b.json()["job_id"]
