"""
Skill supply/demand aggregation — the labor-market-intelligence asset that
differentiates this from a plain point-to-point matching engine.

Computes one SkillDemandSnapshot row per (skill, region, period) from the
current `job_skill_requirements` (demand side) and `seeker_skills` (supply
side). Designed to run on a schedule (nightly/monthly), not per-request:
`GET /insights/skill-demand` reads these precomputed rows — it never
aggregates live over the full table.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime

from sqlalchemy import select

from backend.app.db.models import JobPosting, JobSkillRequirement, SeekerProfile
from backend.app.db.models import SeekerSkill as SeekerSkillModel
from backend.app.db.postgres_store import upsert_skill_demand_snapshot
from backend.app.db.session import async_session


async def compute_skill_demand_snapshot(period: str | None = None) -> int:
    """Recompute demand/supply/avg-salary for every (skill, region) pair seen
    in active jobs or seeker profiles, for `period` (defaults to the current
    "YYYY-MM"). Returns the number of snapshot rows written.
    """
    period = period or datetime.now(UTC).strftime("%Y-%m")

    # (skill_id, region_code) -> [demand_count, salary_sum]
    demand: dict[tuple[str, str], list[int]] = defaultdict(lambda: [0, 0])
    supply: dict[tuple[str, str], int] = defaultdict(int)

    async with async_session() as session:
        demand_stmt = (
            select(
                JobSkillRequirement.skill_id,
                JobPosting.region_code,
                JobPosting.salary_min,
                JobPosting.salary_max,
            )
            .join(JobPosting, JobPosting.id == JobSkillRequirement.job_id)
            .where(JobPosting.is_active.is_(True))
        )
        for skill_id, region_code, salary_min, salary_max in (
            await session.execute(demand_stmt)
        ).all():
            key = (skill_id, region_code)
            demand[key][0] += 1
            demand[key][1] += int(((salary_min or 0) + (salary_max or 0)) / 2)

        supply_stmt = select(SeekerSkillModel.skill_id, SeekerProfile.region_code).join(
            SeekerProfile, SeekerProfile.id == SeekerSkillModel.seeker_id
        )
        for skill_id, region_code in (await session.execute(supply_stmt)).all():
            supply[(skill_id, region_code)] += 1

    keys = set(demand.keys()) | set(supply.keys())
    for skill_id, region_code in keys:
        count, salary_sum = demand.get((skill_id, region_code), [0, 0])
        avg_salary = int(salary_sum / count) if count else 0
        await upsert_skill_demand_snapshot(
            skill_id=skill_id,
            region_code=region_code,
            period=period,
            demand_count=count,
            supply_count=supply.get((skill_id, region_code), 0),
            avg_salary_offered=avg_salary,
        )
    return len(keys)
