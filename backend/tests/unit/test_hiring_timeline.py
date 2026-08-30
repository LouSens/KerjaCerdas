"""Hiring-pipeline tests — apply → reviewed → interview → offered → hired.

Covers what the seeker sees on their timeline, what the employer is allowed
to change, and who is allowed to change it.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

PIPELINE = ["reviewed", "interview", "offered", "hired"]


@pytest.fixture
def application(
    client: TestClient, seeker_account: dict, seeker_profile: dict, seeded_job: dict
) -> dict:
    resp = client.post(
        "/api/v1/seeker/apply",
        json={"job_id": seeded_job["job_id"], "cover_letter": "Saya tertarik."},
        headers=seeker_account["headers"],
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def _set_status(client, employer, app_id, status, note=None):
    body: dict = {"status": status}
    if note is not None:
        body["note"] = note
    return client.patch(
        f"/api/v1/employer/applications/{app_id}/status",
        json=body,
        headers=employer["headers"],
    )


class TestApply:
    def test_apply_creates_an_applied_record(self, application: dict) -> None:
        assert application["status"] == "applied"
        assert application["already_applied"] is False

    def test_apply_is_idempotent(
        self, client: TestClient, seeker_account: dict, seeded_job: dict, application: dict
    ) -> None:
        again = client.post(
            "/api/v1/seeker/apply",
            json={"job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        )
        assert again.status_code == 201
        assert again.json()["already_applied"] is True
        assert again.json()["application_id"] == application["application_id"]

    def test_apply_to_unknown_job_is_404(
        self, client: TestClient, seeker_account: dict, seeker_profile: dict
    ) -> None:
        resp = client.post(
            "/api/v1/seeker/apply",
            json={"job_id": "does-not-exist"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 404

    def test_apply_without_job_id_is_400(
        self, client: TestClient, seeker_account: dict, seeker_profile: dict
    ) -> None:
        resp = client.post(
            "/api/v1/seeker/apply", json={}, headers=seeker_account["headers"]
        )
        assert resp.status_code == 400


class TestPipelineTransitions:
    @pytest.mark.parametrize("target", PIPELINE)
    def test_each_stage_can_be_set(
        self, client: TestClient, employer_account: dict, application: dict, target: str
    ) -> None:
        resp = _set_status(client, employer_account, application["application_id"], target)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == target

    def test_full_pipeline_walk_is_visible_to_the_seeker(
        self,
        client: TestClient,
        employer_account: dict,
        seeker_account: dict,
        application: dict,
    ) -> None:
        app_id = application["application_id"]
        for stage in PIPELINE:
            assert _set_status(client, employer_account, app_id, stage).status_code == 200
            timeline = client.get(
                "/api/v1/seeker/applications", headers=seeker_account["headers"]
            ).json()
            row = next(r for r in timeline if r["application_id"] == app_id)
            assert row["status"] == stage, f"seeker timeline out of sync at '{stage}'"
            assert row["note"], "timeline row has no explanatory note"
            assert row["title"] and row["title"] != "—"
            assert row["company"] and row["company"] != "—"

    @pytest.mark.parametrize(
        ("alias", "expected"),
        [
            ("wawancara", "interview"),
            ("ditinjau", "reviewed"),
            ("diterima", "hired"),
            ("ditolak", "rejected"),
            ("terkirim", "applied"),
            ("INTERVIEW", "interview"),
            ("  Interview  ", "interview"),
        ],
    )
    def test_indonesian_and_untrimmed_aliases_resolve(
        self, client: TestClient, employer_account: dict, application: dict, alias, expected
    ) -> None:
        resp = _set_status(client, employer_account, application["application_id"], alias)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == expected

    def test_unknown_status_is_rejected(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        resp = _set_status(client, employer_account, application["application_id"], "promoted")
        assert resp.status_code == 400

    def test_note_is_persisted_and_surfaced(
        self,
        client: TestClient,
        employer_account: dict,
        seeker_account: dict,
        application: dict,
    ) -> None:
        note = "Interview teknis Selasa 10:00 WIB via Google Meet."
        resp = _set_status(
            client, employer_account, application["application_id"], "interview", note=note
        )
        assert resp.json()["note"] == note
        timeline = client.get(
            "/api/v1/seeker/applications", headers=seeker_account["headers"]
        ).json()
        assert any(r["note"] == note for r in timeline)

    def test_updated_at_advances(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        first = _set_status(
            client, employer_account, application["application_id"], "reviewed"
        ).json()["updated_at"]
        second = _set_status(
            client, employer_account, application["application_id"], "interview"
        ).json()["updated_at"]
        assert second >= first


class TestPipelineAuthorization:
    def test_unauthenticated_cannot_change_status(
        self, client: TestClient, application: dict
    ) -> None:
        resp = client.patch(
            f"/api/v1/employer/applications/{application['application_id']}/status",
            json={"status": "hired"},
        )
        assert resp.status_code == 401

    def test_a_seeker_cannot_change_their_own_status(
        self, client: TestClient, seeker_account: dict, application: dict
    ) -> None:
        resp = _set_status(client, seeker_account, application["application_id"], "hired")
        assert resp.status_code == 403

    def test_another_employer_cannot_change_status(
        self, client: TestClient, register, application: dict
    ) -> None:
        intruder = register(client, "employer")
        resp = _set_status(client, intruder, application["application_id"], "hired")
        assert resp.status_code == 403

    def test_unknown_application_is_404(
        self, client: TestClient, employer_account: dict
    ) -> None:
        assert _set_status(client, employer_account, "nope", "hired").status_code == 404

    def test_seeker_only_sees_their_own_applications(
        self,
        client: TestClient,
        other_seeker_account: dict,
        application: dict,
    ) -> None:
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Orang Lain", "region_code": "3171", "skills": []},
            headers=other_seeker_account["headers"],
        )
        rows = client.get(
            "/api/v1/seeker/applications", headers=other_seeker_account["headers"]
        ).json()
        assert all(r["application_id"] != application["application_id"] for r in rows)


class TestEmployerCandidateView:
    def test_employer_sees_the_application(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        resp = client.get(
            "/api/v1/employer/applications", headers=employer_account["headers"]
        )
        assert resp.status_code == 200, resp.text
        ids = [r["application_id"] for r in resp.json()["items"]]
        assert application["application_id"] in ids

    def test_job_application_count_reflects_reality(
        self, client: TestClient, employer_account: dict, seeded_job: dict, application: dict
    ) -> None:
        jobs = client.get(
            "/api/v1/employer/jobs", headers=employer_account["headers"]
        ).json()["items"]
        job = next(j for j in jobs if j["id"] == seeded_job["job_id"])
        assert job["application_count"] == 1


class TestPipelineIntegrityGaps:
    """Transitions the API currently permits that a real ATS would refuse.

    These pin today's behaviour so adding a state machine is a visible change.
    """

    def test_hired_can_be_walked_backwards(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        app_id = application["application_id"]
        _set_status(client, employer_account, app_id, "hired")
        back = _set_status(client, employer_account, app_id, "applied")
        assert back.status_code == 200, "a transition guard now exists — update this test"
        assert back.json()["status"] == "applied"

    def test_rejected_can_be_flipped_to_hired(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        app_id = application["application_id"]
        _set_status(client, employer_account, app_id, "rejected")
        assert _set_status(client, employer_account, app_id, "hired").status_code == 200

    def test_employer_can_hide_an_application_by_setting_saved(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        """`saved` is the seeker's private bookmark state; the employer list
        filters it out, so setting it makes the application disappear."""
        _set_status(client, employer_account, application["application_id"], "saved")
        items = client.get(
            "/api/v1/employer/applications", headers=employer_account["headers"]
        ).json()["items"]
        assert all(r["application_id"] != application["application_id"] for r in items)

    def test_note_length_is_unbounded(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        resp = _set_status(
            client, employer_account, application["application_id"], "interview", note="x" * 20_000
        )
        assert resp.status_code == 200
        assert len(resp.json()["note"]) == 20_000, "a length cap now exists — update this test"

    def test_note_is_stored_without_sanitization(
        self,
        client: TestClient,
        employer_account: dict,
        seeker_account: dict,
        application: dict,
    ) -> None:
        """Employer-authored HTML reaches the seeker's timeline verbatim.

        Safe only as long as the frontend never renders it as raw HTML.
        """
        payload = "<img src=x onerror=alert(1)>"
        _set_status(
            client, employer_account, application["application_id"], "interview", note=payload
        )
        rows = client.get(
            "/api/v1/seeker/applications", headers=seeker_account["headers"]
        ).json()
        assert any(payload in r["note"] for r in rows), "notes are now sanitized — update this test"
