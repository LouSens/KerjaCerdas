"""Input-validation tests for the seeker and employer request bodies.

These endpoints used to take an untyped `dict`, so every field arrived
unvalidated and a malformed value could reach the handler and 500. They now
declare Pydantic request models: a wrong type is a 422 naming the field, and
the leniency that was deliberate (a bare string where a list is expected, a
numeric string, an unparseable graduation year) is preserved by the models
rather than by hand-written coercion in the handlers.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

BASE_JOB = {
    "title": "Data Analyst",
    "description": "Analisis data.",
    "region_code": "3171",
}


class TestJobCreationValidation:
    @pytest.mark.parametrize(
        "override",
        [
            {"salary_min": "banyak"},
            {"salary_max": "sepuluh juta"},
            {"experience_years_min": "dua"},
            {"salary_min": [1, 2]},
            {"salary_min": {"nested": 1}},
        ],
    )
    def test_non_numeric_numbers_return_422(
        self, client: TestClient, employer_account: dict, stub_embedder, override: dict
    ) -> None:
        resp = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, **override},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 422, resp.text
        assert next(iter(override)) in resp.text, "the 422 does not name the bad field"

    def test_a_bare_string_skill_is_accepted_as_a_single_entry(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        resp = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "required_skills": "Python"},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 201, resp.text
        jobs = client.get(
            "/api/v1/employer/jobs", headers=employer_account["headers"]
        ).json()["items"]
        assert jobs[0]["required_skills"] == ["Python"]

    @pytest.mark.parametrize("skills", [[1, 2, 3], {"a": "b"}, 42])
    def test_non_text_skill_lists_return_422(
        self, client: TestClient, employer_account: dict, stub_embedder, skills
    ) -> None:
        resp = client.post(
            "/api/v1/employer/jobs",
            json={**BASE_JOB, "required_skills": skills},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 422, resp.text

    @pytest.mark.parametrize(
        ("title", "expected"),
        [
            ("", 400),  # present and a string, but empty once trimmed
            ("   ", 400),
            (None, 422),  # wrong type — rejected by the model
        ],
    )
    def test_a_job_cannot_be_created_without_a_title(
        self, client: TestClient, employer_account: dict, stub_embedder, title, expected
    ) -> None:
        payload = {**BASE_JOB, "title": title}
        resp = client.post(
            "/api/v1/employer/jobs", json=payload, headers=employer_account["headers"]
        )
        assert resp.status_code == expected, resp.text

    def test_a_job_cannot_be_created_with_no_title_field(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        payload = {k: v for k, v in BASE_JOB.items() if k != "title"}
        resp = client.post(
            "/api/v1/employer/jobs", json=payload, headers=employer_account["headers"]
        )
        assert resp.status_code == 422, resp.text
        assert "title" in resp.text

    def test_an_unconstrained_company_size_is_rejected(
        self, client: TestClient, employer_account: dict
    ) -> None:
        """`size` is a Literal on the stored model, but the handler wrote it
        through `setattr`, which skips Pydantic validation entirely."""
        resp = client.post(
            "/api/v1/employer/profile",
            json={"size": "raksasa"},
            headers=employer_account["headers"],
        )
        assert resp.status_code == 422, resp.text

    def test_a_valid_job_still_succeeds(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        resp = client.post(
            "/api/v1/employer/jobs",
            json={
                **BASE_JOB,
                "required_skills": ["Python", "SQL"],
                "salary_min": 8_000_000,
                "salary_max": "14000000",  # numeric strings stay acceptable
                "experience_years_min": 1,
            },
            headers=employer_account["headers"],
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["title"] == "Data Analyst"


class TestProfileValidation:
    @pytest.mark.parametrize("year", ["dua ribu", None, "", {"y": 2020}, []])
    def test_a_malformed_graduation_year_does_not_crash(
        self, client: TestClient, seeker_account: dict, stub_embedder, year
    ) -> None:
        resp = client.post(
            "/api/v1/seeker/profile",
            json={
                "full_name": "Budi",
                "region_code": "3171",
                "education": [{"institution": "UI", "major": "TI", "graduation_year": year}],
            },
            headers=seeker_account["headers"],
        )
        assert resp.status_code in (200, 201, 400, 422), resp.text

    def test_a_numeric_string_year_is_still_parsed(
        self, client: TestClient, seeker_account: dict, stub_embedder
    ) -> None:
        client.post(
            "/api/v1/seeker/profile",
            json={
                "full_name": "Budi",
                "region_code": "3171",
                "education": [
                    {"institution": "UI", "major": "TI", "graduation_year": "2021"}
                ],
            },
            headers=seeker_account["headers"],
        )
        profile = client.get(
            "/api/v1/seeker/profile", headers=seeker_account["headers"]
        ).json()
        assert profile["education"][0]["graduation_year"] == 2021

    @pytest.mark.parametrize(
        "skills", [[123], [None], [{"name": "Python"}], ["Python"], []]
    )
    def test_assorted_skill_shapes_do_not_crash(
        self, client: TestClient, seeker_account: dict, stub_embedder, skills
    ) -> None:
        resp = client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Budi", "region_code": "3171", "skills": skills},
            headers=seeker_account["headers"],
        )
        assert resp.status_code in (200, 201, 400, 422), resp.text


class TestNoEndpointReturnsFiveHundred:
    """Broad sweep: junk bodies must never reach the 500 handler."""

    JUNK = [{}, {"unexpected": "field"}, {"status": None}, {"note": 12345}]

    @pytest.mark.parametrize("body", JUNK)
    def test_apply(
        self, client: TestClient, seeker_account: dict, seeker_profile: dict, body: dict
    ) -> None:
        resp = client.post(
            "/api/v1/seeker/apply", json=body, headers=seeker_account["headers"]
        )
        assert resp.status_code < 500, resp.text

    @pytest.mark.parametrize("body", JUNK)
    def test_employer_profile(
        self, client: TestClient, employer_account: dict, body: dict
    ) -> None:
        resp = client.post(
            "/api/v1/employer/profile", json=body, headers=employer_account["headers"]
        )
        assert resp.status_code < 500, resp.text

    @pytest.mark.parametrize("body", JUNK)
    def test_application_status(
        self, client: TestClient, employer_account: dict, body: dict
    ) -> None:
        resp = client.patch(
            "/api/v1/employer/applications/unknown-id/status",
            json=body,
            headers=employer_account["headers"],
        )
        assert resp.status_code < 500, resp.text
