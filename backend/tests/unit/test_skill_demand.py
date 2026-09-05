"""Skill supply/demand snapshot aggregation (the labor-market-intelligence
read path) — computed from job_skill_requirements + seeker_skills, never at
request time.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.app.db.postgres_store import (
    get_repositories,
    list_skill_demand,
    set_job_skill_requirements,
    upsert_seeker_skill,
)
from backend.app.db.schemas import (
    Employer,
    JobPosting,
    JobSkillRequirementLink,
    SeekerProfile,
    TaxonomySkill,
)
from backend.app.db.schemas import User as UserSchema
from backend.app.services.taxonomy.demand import compute_skill_demand_snapshot


async def _seed_scenario():
    repos = get_repositories()
    skill = await repos.skills.upsert(TaxonomySkill(canonical_name="Go"))

    # Employer/SeekerProfile.user_id is a real FK to users.id, so the owning
    # User row has to exist first even in this direct-repo (non-HTTP) seed path.
    employer_user = await repos.users.upsert(
        UserSchema(email="employer1@example.com", password_hash="x", role="employer")
    )
    seeker_user = await repos.users.upsert(
        UserSchema(email="seeker1@example.com", password_hash="x", role="seeker")
    )

    employer = await repos.employers.upsert(
        Employer(user_id=employer_user.id, company_name="Acme", region_code="3171")
    )
    job = await repos.jobs.upsert(
        JobPosting(
            employer_id=employer.id,
            title="Backend Engineer",
            description="...",
            region_code="3171",
            salary_min=20_000_000,
            salary_max=30_000_000,
            is_active=True,
        )
    )
    await set_job_skill_requirements(
        job.id, [JobSkillRequirementLink(job_id=job.id, skill_id=skill.id, is_required=True)]
    )

    seeker = await repos.seekers.upsert(
        SeekerProfile(user_id=seeker_user.id, full_name="Budi", region_code="3171")
    )
    await upsert_seeker_skill(seeker.id, skill.id, level="intermediate", years=2.0)

    return skill.id


@pytest.mark.asyncio
async def test_compute_snapshot_counts_demand_and_supply(client: TestClient) -> None:
    skill_id = await _seed_scenario()

    written = await compute_skill_demand_snapshot(period="2026-09")
    assert written == 1

    snapshots = await list_skill_demand(region_code="3171", period="2026-09")
    assert len(snapshots) == 1
    row = snapshots[0]
    assert row.skill_id == skill_id
    assert row.demand_count == 1
    assert row.supply_count == 1
    assert row.avg_salary_offered == 25_000_000


@pytest.mark.asyncio
async def test_recompute_updates_existing_row_instead_of_duplicating(client: TestClient) -> None:
    await _seed_scenario()

    await compute_skill_demand_snapshot(period="2026-09")
    await compute_skill_demand_snapshot(period="2026-09")  # same period, run again

    snapshots = await list_skill_demand(region_code="3171", period="2026-09")
    assert len(snapshots) == 1  # not 2 — upsert by natural key, not a fresh row per run


@pytest.mark.asyncio
async def test_no_data_yields_no_snapshots(client: TestClient) -> None:
    written = await compute_skill_demand_snapshot(period="2026-09")
    assert written == 0
    assert await list_skill_demand(period="2026-09") == []
