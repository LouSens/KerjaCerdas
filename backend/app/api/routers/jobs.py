"""Consolidated public + admin /jobs surface."""
from __future__ import annotations

from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import Employer, VerificationStatus
from fastapi import APIRouter

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _is_verified(employer: Employer | None) -> bool:
    """A listing is trusted when its posting employer passed verification."""
    return employer is not None and employer.verified == VerificationStatus.VERIFIED


@router.get("")
async def list_jobs(
    limit: int = 20,
    offset: int = 0,
    region: str | None = None,
    q: str | None = None,
    job_type: str | None = None,
    experience_min: int | None = None,
    remote_allowed: bool | None = None,
    salary_min: int | None = None,
):
    """Return paginated, optionally filtered job listings."""
    repos = get_repositories()
    jobs = await repos.jobs.list()
    if region:
        jobs = [j for j in jobs if j.region_code == region]
    if job_type:
        jobs = [j for j in jobs if getattr(j, "work_type", "").lower() == job_type.lower()]
    if remote_allowed is not None:
        jobs = [j for j in jobs if j.remote_allowed == remote_allowed]
    if experience_min is not None:
        jobs = [j for j in jobs if (j.experience_years_min or 0) <= experience_min]
    if salary_min is not None:
        jobs = [j for j in jobs if (j.salary_min or 0) >= salary_min]
    if q:
        q_lower = q.lower()
        jobs = [
            j for j in jobs
            if q_lower in j.title.lower() or q_lower in j.description.lower()
        ]
    total = len(jobs)
    page = jobs[offset: offset + limit]
    unique_employer_ids = {j.employer_id for j in page}
    employers = {eid: await repos.employers.get(eid) for eid in unique_employer_ids}
    items = [j.model_dump() | {"verified": _is_verified(employers.get(j.employer_id))} for j in page]
    return {"total": total, "offset": offset, "limit": limit, "items": items}


@router.get("/{job_id}")
async def get_job(job_id: str):
    repos = get_repositories()
    j = await repos.jobs.get(job_id)
    if not j:
        return {"error": "not_found"}
    employer = await repos.employers.get(j.employer_id)
    return j.model_dump() | {"verified": _is_verified(employer)}
