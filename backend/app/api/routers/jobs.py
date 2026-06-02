"""Consolidated public + admin /jobs surface."""
from __future__ import annotations

from backend.app.db.postgres_store import get_repositories
from fastapi import APIRouter

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(
    limit: int = 20,
    offset: int = 0,
    region: str | None = None,
    q: str | None = None,
):
    """Return paginated, optionally filtered job listings.

    Parameters
    ----------
    limit   : max results per page (default 20)
    offset  : skip N results for pagination (default 0)
    region  : BPS region code filter
    q       : keyword search against job title and description (case-insensitive)
    """
    repos = get_repositories()
    jobs = await repos.jobs.list()
    if region:
        jobs = [j for j in jobs if j.region_code == region]
    if q:
        q_lower = q.lower()
        jobs = [
            j for j in jobs
            if q_lower in j.title.lower() or q_lower in j.description.lower()
        ]
    total = len(jobs)
    return {"total": total, "offset": offset, "limit": limit, "items": jobs[offset: offset + limit]}


@router.get("/{job_id}")
async def get_job(job_id: str):
    repos = get_repositories()
    j = await repos.jobs.get(job_id)
    return j or {"error": "not_found"}
