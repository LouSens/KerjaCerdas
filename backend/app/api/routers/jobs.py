"""Consolidated public + admin /jobs surface."""
from __future__ import annotations

from fastapi import APIRouter

from backend.app.db.json_store import get_repositories

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(limit: int = 20, region: str | None = None):
    repos = get_repositories()
    jobs = await repos.jobs.list()
    if region:
        jobs = [j for j in jobs if j.region_code == region]
    return {"total": len(jobs), "items": jobs[:limit]}


@router.get("/{job_id}")
async def get_job(job_id: str):
    repos = get_repositories()
    j = await repos.jobs.get(job_id)
    return j or {"error": "not_found"}
