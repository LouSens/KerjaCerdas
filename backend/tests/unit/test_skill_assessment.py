"""Seeker skill micro-assessment — grading and verified_via upgrade."""

from __future__ import annotations

import asyncio

from fastapi.testclient import TestClient

from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import AssessmentQuestion, SkillAssessment, TaxonomySkill


def _seed_assessment() -> str:
    """Seed one skill with a 2-question quiz; returns the skill_id."""

    async def _do() -> str:
        repos = get_repositories()
        skill = await repos.skills.upsert(TaxonomySkill(canonical_name="SQL"))
        await repos.skill_assessments.upsert(
            SkillAssessment(
                skill_id=skill.id,
                questions=[
                    AssessmentQuestion(
                        question="Which clause filters before aggregation?",
                        options=["HAVING", "WHERE", "GROUP BY", "ORDER BY"],
                        correct_index=1,
                    ),
                    AssessmentQuestion(
                        question="Which command removes all rows without dropping the schema?",
                        options=["DROP TABLE", "DELETE", "TRUNCATE", "ALTER TABLE"],
                        correct_index=2,
                    ),
                ],
                passing_score=0.7,
            )
        )
        return skill.id

    return asyncio.run(_do())


def test_get_assessment_strips_correct_answers(client: TestClient, seeker_account: dict) -> None:
    skill_id = _seed_assessment()

    resp = client.get(
        f"/api/v1/seeker/skills/{skill_id}/assessment", headers=seeker_account["headers"]
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body["questions"]) == 2
    for q in body["questions"]:
        assert "correct_index" not in q
        assert set(q.keys()) == {"question", "options"}


def test_get_assessment_404_for_unseeded_skill(client: TestClient, seeker_account: dict) -> None:
    resp = client.get(
        "/api/v1/seeker/skills/nonexistent-skill-id/assessment", headers=seeker_account["headers"]
    )
    assert resp.status_code == 404


def test_perfect_score_passes_and_upgrades_verification(
    client: TestClient, seeker_account: dict, seeker_profile: dict
) -> None:
    skill_id = _seed_assessment()

    resp = client.post(
        f"/api/v1/seeker/skills/{skill_id}/assessment",
        json={"answers": [1, 2]},
        headers=seeker_account["headers"],
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["passed"] is True
    assert body["score"] == 1.0

    async def _get_seeker_skill():
        repos = get_repositories()
        rows = await repos.seeker_skills.find(
            lambda s: s.seeker_id == seeker_profile["id"] and s.skill_id == skill_id
        )
        return rows[0] if rows else None

    seeker_skill = asyncio.run(_get_seeker_skill())
    assert seeker_skill is not None
    assert seeker_skill.verified_via == "assessment"


def test_failing_score_does_not_verify(
    client: TestClient, seeker_account: dict, seeker_profile: dict
) -> None:
    skill_id = _seed_assessment()

    resp = client.post(
        f"/api/v1/seeker/skills/{skill_id}/assessment",
        json={"answers": [0, 0]},  # both wrong
        headers=seeker_account["headers"],
    )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["passed"] is False
    assert body["score"] == 0.0

    async def _get_seeker_skill():
        repos = get_repositories()
        rows = await repos.seeker_skills.find(
            lambda s: s.seeker_id == seeker_profile["id"] and s.skill_id == skill_id
        )
        return rows[0] if rows else None

    assert asyncio.run(_get_seeker_skill()) is None


def test_wrong_answer_count_is_400(
    client: TestClient, seeker_account: dict, seeker_profile: dict
) -> None:
    skill_id = _seed_assessment()

    resp = client.post(
        f"/api/v1/seeker/skills/{skill_id}/assessment",
        json={"answers": [1]},  # only 1 answer for a 2-question quiz
        headers=seeker_account["headers"],
    )

    assert resp.status_code == 400
