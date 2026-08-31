"""Skill-gap analysis and course-recommendation tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.agents.graph.nodes import (
    _COURSE_CATALOG,
    _catalog_courses,
    _recommend_courses,
)


class TestCatalogFallback:
    def test_known_skill_resolves_to_a_course(self) -> None:
        courses = _catalog_courses(["Python"])
        assert len(courses) == 1
        assert courses[0].name == _COURSE_CATALOG["python"][0]

    def test_lookup_is_case_insensitive(self) -> None:
        assert _catalog_courses(["PYTHON"])[0].name == _catalog_courses(["python"])[0].name

    def test_unknown_skill_still_yields_a_recommendation(self) -> None:
        courses = _catalog_courses(["Quantum Widget Wrangling"])
        assert len(courses) == 1
        assert "Quantum Widget Wrangling" in courses[0].name

    def test_empty_input_yields_a_generic_fallback(self) -> None:
        courses = _catalog_courses([])
        assert len(courses) == 1
        assert courses[0].provider

    def test_result_count_is_capped_at_five(self) -> None:
        assert len(_catalog_courses([f"skill-{i}" for i in range(20)])) == 5

    def test_every_course_has_the_fields_the_ui_renders(self) -> None:
        for c in _catalog_courses(["python", "sql", "docker"]):
            assert c.name and c.provider and c.duration
            assert c.url and c.url.startswith("https://")
            assert c.price and c.description

    @pytest.mark.parametrize("skill", ["kubernetes", "docker", "figma", "akuntansi"])
    def test_the_catalogued_provider_is_preserved(self, skill: str) -> None:
        """Regression: the provider used to be overwritten with 'Dicoding',
        misattributing every curated course."""
        assert _catalog_courses([skill])[0].provider == _COURSE_CATALOG[skill][1]

    def test_unverified_facts_are_labelled(self) -> None:
        """guardrails.md requires uncertain course facts to be flagged."""
        for c in _catalog_courses(["python", "figma", "akuntansi"]):
            assert "belum terverifikasi" in (c.price or "")
            assert "belum terverifikasi" in (c.description or "")

    def test_no_rating_is_invented(self) -> None:
        assert all(c.rating is None for c in _catalog_courses(["python", "sql"]))

    def test_search_urls_are_scoped_to_the_real_course_and_provider(self) -> None:
        c = _catalog_courses(["kubernetes"])[0]
        assert "google.com/search" in c.url
        assert "Coursera" in c.url


class TestRecommendCourses:
    async def test_no_missing_skills_returns_nothing(self) -> None:
        assert await _recommend_courses([], None) == []

    async def test_falls_back_to_catalog_without_an_api_key(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        courses = await _recommend_courses(["Docker"], None)
        assert courses and courses[0].provider

    async def test_llm_failure_degrades_to_catalog(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "fake-key")

        class BrokenLLM:
            async def ainvoke(self, *a, **k):
                raise RuntimeError("gemini down")

        monkeypatch.setattr(
            "backend.app.services.llm_factory.build_chat_llm", lambda *a, **k: BrokenLLM()
        )
        courses = await _recommend_courses(["Docker"], None)
        assert courses, "no degradation path when the model fails"

    async def test_malformed_llm_json_degrades_to_catalog(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "fake-key")

        class GarbageLLM:
            async def ainvoke(self, *a, **k):
                from langchain_core.messages import AIMessage

                return AIMessage(content="tentu saja! ini rekomendasinya: bukan json")

        monkeypatch.setattr(
            "backend.app.services.llm_factory.build_chat_llm", lambda *a, **k: GarbageLLM()
        )
        courses = await _recommend_courses(["Docker"], None)
        assert courses

    async def test_llm_output_is_accepted_without_url_validation(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Model-supplied course URLs are passed to the UI unchecked."""
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "fake-key")

        class InjectingLLM:
            async def ainvoke(self, *a, **k):
                from langchain_core.messages import AIMessage

                return AIMessage(
                    content=(
                        '{"recommended_courses": [{"name": "Kursus Palsu", '
                        '"provider": "Penipu", "duration": "1 bulan", '
                        '"url": "javascript:alert(document.cookie)"}]}'
                    )
                )

        monkeypatch.setattr(
            "backend.app.services.llm_factory.build_chat_llm", lambda *a, **k: InjectingLLM()
        )
        courses = await _recommend_courses(["Docker"], None)
        assert courses[0].url == "javascript:alert(document.cookie)", (
            "URLs are now validated — update this test"
        )


class TestSkillGapEndpoint:
    def test_requires_authentication(self, client: TestClient) -> None:
        assert client.post("/api/v1/seeker/skill-gap", json={}).status_code == 401

    def test_requires_a_profile(self, client: TestClient, seeker_account: dict) -> None:
        resp = client.post("/api/v1/seeker/skill-gap", json={}, headers=seeker_account["headers"])
        assert resp.status_code == 404

    def test_gap_is_computed_against_the_target_job(
        self,
        client: TestClient,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)

        resp = client.post(
            "/api/v1/seeker/skill-gap",
            json={"target_job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        # Profile has Python + Excel; the job needs Python, SQL, Tableau.
        assert "Python" in body["matching_skills"]
        assert set(body["missing_skills"]) == {"SQL", "Tableau"}
        assert body["target_job_title"] == "Data Analyst"
        assert body["gap_severity"] in {"low", "medium", "high"}
        assert body["recommended_courses"]

    def test_severity_tracks_the_gap_ratio(
        self,
        client: TestClient,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        body = client.post(
            "/api/v1/seeker/skill-gap",
            json={"target_job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        ).json()
        # 2 of 3 required skills missing → ratio 0.67 → high
        assert body["gap_severity"] == "high"

    def test_estimated_hours_scale_and_cap(
        self,
        client: TestClient,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        body = client.post(
            "/api/v1/seeker/skill-gap",
            json={"target_job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        ).json()
        assert body["estimated_hours"] == 20  # 2 missing skills × 10h
        assert body["estimated_hours"] <= 120

    def test_result_is_persisted_and_retrievable(
        self,
        client: TestClient,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        client.post(
            "/api/v1/seeker/skill-gap",
            json={"target_job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        )
        latest = client.get("/api/v1/seeker/skill-gap/latest", headers=seeker_account["headers"])
        assert latest.status_code == 200
        body = latest.json()
        assert body is not None
        assert set(body["missing_skills"]) == {"SQL", "Tableau"}
        assert body["target_job_title"] == "Data Analyst"

    def test_latest_is_scoped_to_the_caller(
        self,
        client: TestClient,
        seeker_account: dict,
        other_seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        client.post(
            "/api/v1/seeker/skill-gap",
            json={"target_job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        )
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Orang Lain", "region_code": "3171", "skills": []},
            headers=other_seeker_account["headers"],
        )
        other = client.get(
            "/api/v1/seeker/skill-gap/latest", headers=other_seeker_account["headers"]
        )
        assert other.json() is None

    def test_unknown_target_job_falls_back_to_top_match(
        self,
        client: TestClient,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        resp = client.post(
            "/api/v1/seeker/skill-gap",
            json={"target_job_id": "no-such-job"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 200
        assert resp.json()["target_job_id"] == seeded_job["job_id"]

    def test_gap_for_another_users_job_target_is_allowed(
        self,
        client: TestClient,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Any active job is a legitimate target — this is by design, not a leak.
        Assert no employer-private field leaks through."""
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        body = client.post(
            "/api/v1/seeker/skill-gap",
            json={"target_job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        ).json()
        assert "employer_id" not in body
        assert "embedding" not in body

    def test_latest_match_after_is_a_flat_offset(
        self,
        client: TestClient,
        seeker_account: dict,
        seeker_profile: dict,
        seeded_job: dict,
        stub_embedder,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """POST computes match_after from the gap; GET /latest just adds 9.0."""
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "gemini_api_key", "")
        posted = client.post(
            "/api/v1/seeker/skill-gap",
            json={"target_job_id": seeded_job["job_id"]},
            headers=seeker_account["headers"],
        ).json()
        latest = client.get(
            "/api/v1/seeker/skill-gap/latest", headers=seeker_account["headers"]
        ).json()
        assert latest["match_after"] == min(latest["match_before"] + 9.0, 99.0)
        assert latest["match_after"] != posted["match_after"], (
            "the two endpoints now agree — update this test"
        )
