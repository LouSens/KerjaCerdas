"""Pay-to-Unlock must not charge for a candidate who already applied.

Pay-to-Unlock exists for the AI-sourced talent pool: a candidate the
employer found by searching the wider seeker DB, who never chose to share
their contact with this specific employer. A candidate who applied DIRECTLY
to the job already handed their contact over voluntarily — GET
/employer/applications returns it unconditionally — so both the reverse-
matching candidate list and the unlock endpoint must treat them as already
accessible for free instead of charging (or redacting their name) twice for
the same access.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


def _apply(client: TestClient, headers: dict, job_id: str) -> None:
    resp = client.post(
        "/api/v1/seeker/apply", json={"job_id": job_id}, headers=headers
    )
    assert resp.status_code in (200, 201), resp.text


class TestUnlockFreeForApplicants:
    def test_unlock_is_free_when_seeker_already_applied(
        self,
        client: TestClient,
        employer_account: dict,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
    ) -> None:
        _apply(client, seeker_account["headers"], seeded_job["job_id"])

        resp = client.post(
            f"/api/v1/employer/jobs/{seeded_job['job_id']}/unlock/{seeker_profile['id']}",
            json={"payment_token": "demo"},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["unlock_cost_idr"] == 0
        assert "gratis" in body["note"].lower()

    def test_unlock_still_costs_for_a_non_applicant(
        self,
        client: TestClient,
        employer_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
    ) -> None:
        # seeker_profile never applied to seeded_job here.
        resp = client.post(
            f"/api/v1/employer/jobs/{seeded_job['job_id']}/unlock/{seeker_profile['id']}",
            json={"payment_token": "demo"},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["unlock_cost_idr"] == 50000


class TestCandidatesAlreadyAppliedFlag:
    def test_candidate_who_applied_is_flagged_and_not_redacted(
        self,
        client: TestClient,
        employer_account: dict,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
    ) -> None:
        _apply(client, seeker_account["headers"], seeded_job["job_id"])

        resp = client.post(
            f"/api/v1/employer/jobs/{seeded_job['job_id']}/candidates",
            json={"top_k": 15},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 200, resp.text
        candidates = resp.json()["candidates"]
        mine = next((c for c in candidates if c["seeker_id"] == seeker_profile["id"]), None)
        assert mine is not None, candidates
        assert mine["already_applied"] is True
        assert mine["full_name"] == "Budi Santoso"

    def test_candidate_who_never_applied_is_redacted(
        self,
        client: TestClient,
        employer_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
    ) -> None:
        resp = client.post(
            f"/api/v1/employer/jobs/{seeded_job['job_id']}/candidates",
            json={"top_k": 15},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 200, resp.text
        candidates = resp.json()["candidates"]
        mine = next((c for c in candidates if c["seeker_id"] == seeker_profile["id"]), None)
        assert mine is not None, candidates
        assert mine["already_applied"] is False
        assert mine["full_name"] != "Budi Santoso"
