"""Framing A: employer side free and uncapped, feedback flows back to the seeker.

The shipped default is `paid_plans_enabled = False`; conftest turns it on
for the dormant paid-plan suites, so every test here switches it off itself.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.config.settings import settings

JOB = {"title": "Kasir Kafe", "description": "Melayani transaksi pelanggan.",
       "required_skills": ["Kasir", "Customer Service"], "education_min": "SMA",
       "region_code": "3171", "salary_min": 3_500_000, "salary_max": 4_500_000}


@pytest.fixture
def plans_off(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "paid_plans_enabled", False)
    monkeypatch.setattr(settings, "plan_limits_enforced", True)


@pytest.fixture
def application(client: TestClient, seeker_account: dict, seeker_profile: dict, seeded_job: dict) -> dict:
    resp = client.post("/api/v1/seeker/apply", json={"job_id": seeded_job["job_id"]},
                       headers=seeker_account["headers"])
    assert resp.status_code == 201, resp.text
    return resp.json()


def _my_app(client: TestClient, seeker: dict, job_id: str) -> dict:
    items = client.get("/api/v1/seeker/applications", headers=seeker["headers"]).json()
    return next(a for a in items if a["job_id"] == job_id)


class TestEmployerPlansOff:
    def test_catalogue_sells_no_employer_plan(self, client: TestClient, plans_off) -> None:
        body = client.get("/api/v1/billing/plans").json()
        assert [p["plan"] for p in body["employer"]] == ["spark"]
        assert body["employer"][0]["price_idr"] == 0
        # Prism only existed to lift the advisor quota; with no quota it is not sold.
        assert [p["plan"] for p in body["seeker"]] == ["free"]
        assert "Advisor tanpa batas harian" in body["seeker"][0]["features"]

    def test_employer_plan_orders_are_refused(self, client, employer_account, plans_off) -> None:
        for plan in ("beacon", "lighthouse"):
            resp = client.post("/api/v1/billing/orders", headers=employer_account["headers"],
                               json={"plan": plan})
            assert resp.status_code == 400, plan

    def test_seeker_plan_orders_are_refused(self, client, seeker_account, plans_off) -> None:
        resp = client.post("/api/v1/billing/orders", headers=seeker_account["headers"], json={"plan": "prism"})
        assert resp.status_code == 400

    def test_active_jobs_are_uncapped(self, client, employer_account, stub_embedder, plans_off) -> None:
        h = employer_account["headers"]
        for title in ("Kasir Kafe", "Barista", "Admin Gudang"):
            resp = client.post("/api/v1/employer/jobs", json={**JOB, "title": title}, headers=h)
            assert resp.status_code == 201, resp.text

    def test_interview_kit_needs_no_plan(self, client, employer_account, application, plans_off) -> None:
        resp = client.get(f"/api/v1/employer/applications/{application['application_id']}/interview-kit",
                          headers=employer_account["headers"])
        assert resp.status_code == 200, resp.text


class TestFeedbackReachesTheSeeker:
    def test_applications_carry_per_skill_proof(self, client, seeker_account, seeded_job, application) -> None:
        app = _my_app(client, seeker_account, seeded_job["job_id"])
        by_skill = {p["name"]: p["status"] for p in app["skill_proof"]}
        assert by_skill == {"Python": "claimed", "SQL": "missing", "Tableau": "missing"}
        assert app["rejection_reason"] is None

    def test_rejection_reason_is_shown_to_the_seeker(self, client, seeker_account, employer_account,
                                                     seeded_job, application) -> None:
        resp = client.patch(f"/api/v1/employer/applications/{application['application_id']}/status",
                            json={"status": "rejected", "reason_code": "skill_kurang",
                                  "reason_note": "catatan internal HR"},
                            headers=employer_account["headers"])
        assert resp.status_code == 200, resp.text
        reason = _my_app(client, seeker_account, seeded_job["job_id"])["rejection_reason"]
        assert reason == {"code": "skill_kurang", "label": "Skill inti belum memadai untuk posisi ini"}

    def test_hr_private_note_is_not_exposed(self, client, seeker_account, employer_account,
                                            seeded_job, application) -> None:
        client.patch(f"/api/v1/employer/applications/{application['application_id']}/status",
                     json={"status": "rejected", "reason_code": "lainnya", "reason_note": "RAHASIA-123"},
                     headers=employer_account["headers"])
        app = _my_app(client, seeker_account, seeded_job["job_id"])
        assert "RAHASIA-123" not in str(app)

    def test_job_skill_list_includes_missing_skills(self, client, seeker_account, seeker_profile,
                                                    seeded_job) -> None:
        body = client.get(f"/api/v1/quiz/skills?job_id={seeded_job['job_id']}",
                          headers=seeker_account["headers"]).json()
        by_skill = {i["skill"]: i["proof"] for i in body["items"]}
        assert by_skill == {"Python": "claimed", "SQL": "missing", "Tableau": "missing"}

    def test_skill_added_after_applying_updates_the_view(self, client, seeker_account, seeded_job,
                                                         application) -> None:
        client.post("/api/v1/seeker/profile", headers=seeker_account["headers"],
                    json={"skills": ["Python", "Excel", "SQL"]})
        app = _my_app(client, seeker_account, seeded_job["job_id"])
        assert {p["name"]: p["status"] for p in app["skill_proof"]}["SQL"] == "claimed"


class TestCoursesPointAtTheSkill:
    def test_each_course_names_the_skill_it_closes(self) -> None:
        from backend.app.agents.graph.nodes import _catalog_courses

        assert [c.category for c in _catalog_courses(["Excel", "Kasir"])] == ["Excel", "Kasir"]

    async def test_every_missing_skill_gets_a_next_step(self, client) -> None:
        from backend.app.agents.graph.nodes import recommend_courses_offline

        missing = [f"Skill {i}" for i in range(10)] + ["Excel", "SQL"]
        courses = await recommend_courses_offline(missing)
        assert {c.category for c in courses} >= set(missing)

    def test_uncatalogued_skill_gets_a_search_not_an_invented_course(self) -> None:
        from backend.app.agents.graph.nodes import _catalog_courses

        [course] = _catalog_courses(["Kasir"])
        assert course.name == "Cari kursus Kasir"
        assert "Developer" not in course.name
        assert course.url.startswith("https://www.google.com/search?q=")


class TestMatchingIsNeverMetered:
    def test_match_button_does_not_spend_advisor_quota(self, client, seeker_account, seeker_profile,
                                                       seeded_job, stub_embedder, stub_llm, monkeypatch) -> None:
        # Ranking is free on every tier: refreshing matches past the daily
        # advisor limit (10) must still return matches, not a 429.
        monkeypatch.setattr(settings, "plan_limits_enforced", True)
        for _ in range(12):
            resp = client.post("/api/v1/agent/invoke", headers=seeker_account["headers"],
                               json={"user_message": "", "explicit_intent": "match_jobs"})
            assert resp.status_code == 200, resp.text
        assert resp.json()["matches"]

    def test_chat_messages_are_still_metered(self, client, seeker_account, seeker_profile,
                                             seeded_job, stub_embedder, stub_llm, monkeypatch) -> None:
        monkeypatch.setattr(settings, "plan_limits_enforced", True)
        codes = [client.post("/api/v1/agent/invoke", headers=seeker_account["headers"],
                             json={"user_message": "bagaimana cara belajar SQL?"}).status_code
                 for _ in range(11)]
        assert codes[-1] == 429


class TestDemoMode:
    def test_demo_mode_lifts_the_advisor_quota(self, client, seeker_account, seeker_profile,
                                               seeded_job, stub_embedder, stub_llm, monkeypatch) -> None:
        monkeypatch.setattr(settings, "plan_limits_enforced", True)
        monkeypatch.setattr(settings, "demo_mode", True)
        codes = {client.post("/api/v1/agent/invoke", headers=seeker_account["headers"],
                             json={"user_message": "bagaimana cara belajar SQL?"}).status_code
                 for _ in range(12)}
        assert codes == {200}

    @pytest.mark.parametrize(("app_env", "explicit", "expected"), [
        ("production", None, False),   # docker-compose.prod / Replit deployment: off unless asked
        ("development", None, True),
        ("production", True, True),    # DEMO_MODE=true at the booth
        ("development", False, False),
    ])
    def test_demo_mode_follows_app_env_unless_set(self, monkeypatch, app_env, explicit, expected) -> None:
        monkeypatch.setattr(settings, "app_env", app_env)
        monkeypatch.setattr(settings, "demo_mode", explicit)
        assert settings.demo_unlimited is expected

    def test_demo_mode_never_lifts_login_throttling(self) -> None:
        from backend.app.api.middleware.rate_limiter import SECURITY_BUCKETS, _get_bucket

        for path in ("/api/v1/auth/login", "/api/v1/auth/register",
                     "/api/v1/verify/email/send", "/api/v1/verify/email/verify"):
            assert _get_bucket(path)[0] in SECURITY_BUCKETS

    def test_demo_mode_keeps_the_automod_strike_limit(self, client, employer_account, stub_embedder,
                                                      monkeypatch) -> None:
        from backend.app.services.trust import policy

        monkeypatch.setattr(settings, "plan_limits_enforced", True)
        monkeypatch.setattr(settings, "paid_plans_enabled", False)
        monkeypatch.setattr(settings, "demo_mode", True)
        monkeypatch.setattr(policy, "strike_state", lambda employer, now=None: {"strikes": 2, "limited": True, "suspended": False})
        h = employer_account["headers"]
        assert client.post("/api/v1/employer/jobs", json=JOB, headers=h).status_code == 201
        resp = client.post("/api/v1/employer/jobs", json={**JOB, "title": "Barista"}, headers=h)
        assert resp.status_code == 403, resp.text

    def test_match_button_shows_company_names_not_ids(self, client, seeker_account, seeker_profile,
                                                      seeded_job, stub_embedder, stub_llm, employer_account) -> None:
        client.post("/api/v1/employer/profile", headers=employer_account["headers"],
                    json={"company_name": "Klinik Contoh"})
        body = client.post("/api/v1/agent/invoke", headers=seeker_account["headers"],
                           json={"user_message": "", "explicit_intent": "match_jobs"}).json()
        assert body["matches"] and all(m["company"] == "Klinik Contoh" for m in body["matches"])


class TestDemoLogin:
    def _make(self, client, email, role="seeker"):
        resp = client.post("/api/v1/auth/register", json={"name": "Demo", "email": email,
                                                          "password": "Demo12345!x", "role": role})
        assert resp.status_code == 201, resp.text

    def test_endpoints_do_not_exist_without_demo_mode(self, client, monkeypatch) -> None:
        monkeypatch.setattr(settings, "demo_mode", False)
        assert client.get("/api/v1/auth/demo-accounts").status_code == 404
        assert client.post("/api/v1/auth/demo-login", json={"email": "maya.sari@example.com"}).status_code == 404

    def test_lists_only_seeded_demo_accounts(self, client, monkeypatch) -> None:
        monkeypatch.setattr(settings, "demo_mode", True)
        self._make(client, "maya.sari@example.com")
        accounts = client.get("/api/v1/auth/demo-accounts").json()["accounts"]
        assert [a["email"] for a in accounts] == ["maya.sari@example.com"]

    def test_one_click_login_returns_a_working_session(self, client, monkeypatch) -> None:
        monkeypatch.setattr(settings, "demo_mode", True)
        self._make(client, "hr@kliniksehat.id", role="employer")
        body = client.post("/api/v1/auth/demo-login", json={"email": "hr@kliniksehat.id"}).json()
        assert body["user"]["role"] == "employer"
        me = client.get("/api/v1/employer/jobs", headers={"Authorization": f"Bearer {body['access_token']}"})
        assert me.status_code == 200

    def test_refuses_any_account_not_on_the_list(self, client, seeker_account, monkeypatch) -> None:
        monkeypatch.setattr(settings, "demo_mode", True)
        resp = client.post("/api/v1/auth/demo-login", json={"email": seeker_account["email"]})
        assert resp.status_code == 403
