"""Skill-taxonomy resolver — free-text skill string -> canonical skill_id."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import TaxonomySkill
from backend.app.services.taxonomy.resolver import resolve_skill, resolve_skills_bulk


async def _seed_skill(name: str, aliases: list[str] | None = None) -> str:
    repos = get_repositories()
    saved = await repos.skills.upsert(TaxonomySkill(canonical_name=name, aliases=aliases or []))
    return saved.id


@pytest.mark.asyncio
async def test_exact_canonical_name_match_is_confidence_one(client: TestClient) -> None:
    skill_id = await _seed_skill("Python")

    matches = await resolve_skill("Python")

    assert len(matches) == 1
    assert matches[0].skill_id == skill_id
    assert matches[0].confidence == 1.0


@pytest.mark.asyncio
async def test_match_is_case_insensitive(client: TestClient) -> None:
    skill_id = await _seed_skill("PostgreSQL")

    matches = await resolve_skill("postgresql")

    assert len(matches) == 1
    assert matches[0].skill_id == skill_id


@pytest.mark.asyncio
async def test_alias_matches_exactly(client: TestClient) -> None:
    skill_id = await _seed_skill("React", aliases=["react.js", "reactjs"])

    matches = await resolve_skill("ReactJS")

    assert len(matches) == 1
    assert matches[0].skill_id == skill_id
    assert matches[0].confidence == 1.0


@pytest.mark.asyncio
async def test_fuzzy_typo_returns_ranked_suggestion_not_auto_accepted(client: TestClient) -> None:
    skill_id = await _seed_skill("Kubernetes")

    matches = await resolve_skill("Kubernets")  # one missing letter

    assert len(matches) >= 1
    assert matches[0].skill_id == skill_id
    assert matches[0].confidence < 1.0  # never silently upgraded to an exact match


@pytest.mark.asyncio
async def test_unresolvable_text_returns_empty_not_a_wrong_guess(client: TestClient) -> None:
    await _seed_skill("Python")

    matches = await resolve_skill("Underwater Basket Weaving")

    assert matches == []


@pytest.mark.asyncio
async def test_empty_taxonomy_returns_empty(client: TestClient) -> None:
    matches = await resolve_skill("Python")

    assert matches == []


@pytest.mark.asyncio
async def test_resolve_bulk_does_one_db_read_for_many_strings(client: TestClient) -> None:
    py_id = await _seed_skill("Python")
    sql_id = await _seed_skill("SQL")

    results = await resolve_skills_bulk(["Python", "SQL", "Nonexistent Skill"])

    assert results["Python"][0].skill_id == py_id
    assert results["SQL"][0].skill_id == sql_id
    assert results["Nonexistent Skill"] == []
