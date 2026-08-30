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


# Legal route from `applied` to each stage — the pipeline only moves forward,
# so a test that wants an application in a later stage has to walk it there.
PREREQ: dict[str, list[str]] = {
    "applied": [],
    "reviewed": [],
    "interview": ["reviewed"],
    "offered": ["reviewed", "interview"],
    "hired": ["reviewed", "interview", "offered"],
    "rejected": [],
}


def _set_status(client, employer, app_id, status, note=None):
    body: dict = {"status": status}
    if note is not None:
        body["note"] = note
    return client.patch(
        f"/api/v1/employer/applications/{app_id}/status",
        json=body,
        headers=employer["headers"],
    )


def _walk_to(client, employer, app_id, target):
    """Move an application from `applied` to `target` along legal transitions."""
    for stage in PREREQ[target]:
        resp = _set_status(client, employer, app_id, stage)
        assert resp.status_code == 200, f"prerequisite '{stage}' rejected: {resp.text}"
    return _set_status(client, employer, app_id, target)


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

    def test_apply_without_job_id_is_422(
        self, client: TestClient, seeker_account: dict, seeker_profile: dict
    ) -> None:
        """`job_id` is a required field on the request model, so a body
        missing it never reaches the handler."""
        resp = client.post(
            "/api/v1/seeker/apply", json={}, headers=seeker_account["headers"]
        )
        assert resp.status_code == 422
        assert "job_id" in resp.text

    def test_applying_to_a_bookmarked_job_promotes_the_bookmark(
        self,
        client: TestClient,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
    ) -> None:
        """`saved -> applied` is the first legal move in the pipeline.

        A bookmark used to make the job impossible to apply for: the handler
        found the saved record and reported `already_applied`.
        """
        saved = client.post(
            "/api/v1/seeker/bookmarks",
            json={"job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        )
        assert saved.status_code == 201, saved.text

        resp = client.post(
            "/api/v1/seeker/apply",
            json={"job_id": seeded_job["job_id"], "cover_letter": "Saya tertarik."},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["status"] == "applied"
        assert resp.json()["already_applied"] is False


class TestPipelineTransitions:
    @pytest.mark.parametrize("target", PIPELINE)
    def test_each_stage_is_reachable_by_a_legal_walk(
        self, client: TestClient, employer_account: dict, application: dict, target: str
    ) -> None:
        resp = _walk_to(client, employer_account, application["application_id"], target)
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
        app_id = application["application_id"]
        for stage in PREREQ[expected]:
            assert _set_status(client, employer_account, app_id, stage).status_code == 200
        resp = _set_status(client, employer_account, app_id, alias)
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


class TestPipelineStateMachine:
    """The pipeline only moves forward; hired/rejected/withdrawn are terminal."""

    def test_hired_cannot_be_walked_backwards(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        app_id = application["application_id"]
        assert _walk_to(client, employer_account, app_id, "hired").status_code == 200

        back = _set_status(client, employer_account, app_id, "reviewed")
        assert back.status_code == 409, back.text

        current = _set_status(client, employer_account, app_id, "hired")
        assert current.json()["status"] == "hired", "the hire was overwritten"

    def test_employer_cannot_reset_an_application_to_applied(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        """`applied` is the seeker's act of applying, not an employer stage."""
        app_id = application["application_id"]
        assert _set_status(client, employer_account, app_id, "reviewed").status_code == 200
        assert _set_status(client, employer_account, app_id, "applied").status_code == 403

    def test_rejected_cannot_be_flipped_to_hired(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        app_id = application["application_id"]
        assert _set_status(client, employer_account, app_id, "rejected").status_code == 200
        assert _set_status(client, employer_account, app_id, "hired").status_code == 409

    def test_a_stage_cannot_be_skipped(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        """`applied -> hired` skips the whole pipeline, so it is refused."""
        resp = _set_status(client, employer_account, application["application_id"], "hired")
        assert resp.status_code == 409, resp.text
        assert "offered" not in resp.json()["detail"] or "applied" in resp.json()["detail"]

    def test_rejection_is_reachable_from_every_live_stage(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        app_id = application["application_id"]
        for stage in ("reviewed", "interview", "offered"):
            assert _set_status(client, employer_account, app_id, stage).status_code == 200
        assert _set_status(client, employer_account, app_id, "rejected").status_code == 200

    def test_resending_the_current_status_is_a_no_op(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        """A retried request must not 409 just because it already landed."""
        app_id = application["application_id"]
        assert _set_status(client, employer_account, app_id, "reviewed").status_code == 200
        again = _set_status(client, employer_account, app_id, "reviewed")
        assert again.status_code == 200
        assert again.json()["status"] == "reviewed"

    def test_employer_cannot_hide_an_application_by_setting_saved(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        """`saved` is the seeker's private bookmark state. The employer list
        filters it out, so writing it would make the application disappear."""
        resp = _set_status(client, employer_account, application["application_id"], "saved")
        assert resp.status_code == 403, resp.text

        items = client.get(
            "/api/v1/employer/applications", headers=employer_account["headers"]
        ).json()["items"]
        assert any(r["application_id"] == application["application_id"] for r in items)

    def test_employer_cannot_withdraw_on_the_seekers_behalf(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        resp = _set_status(client, employer_account, application["application_id"], "withdrawn")
        assert resp.status_code == 403, resp.text

    def test_note_length_is_capped(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        resp = _set_status(
            client, employer_account, application["application_id"], "interview", note="x" * 20_000
        )
        assert resp.status_code == 422, resp.text

    def test_a_note_within_the_cap_is_accepted(
        self, client: TestClient, employer_account: dict, application: dict
    ) -> None:
        resp = _set_status(
            client, employer_account, application["application_id"], "interview", note="x" * 5_000
        )
        assert resp.status_code == 200, resp.text
        assert len(resp.json()["note"]) == 5_000

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
