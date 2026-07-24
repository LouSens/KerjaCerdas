"""Consolidated public + admin /jobs surface."""

from __future__ import annotations

import time

from backend.app.db.postgres_store import get_repositories
from fastapi import APIRouter

router = APIRouter(prefix="/jobs", tags=["jobs"])

# ── In-memory job cache (TTL = 5 minutes) ─────────────────────────────────────
# Avoids re-querying all jobs from DB on every /agent/invoke and /jobs request.
# Cache is invalidated when a new job is created via POST /employer/jobs.
_jobs_cache: list | None = None
_jobs_cache_ts: float = 0.0
_JOBS_CACHE_TTL = 300  # seconds


async def _get_jobs(repos) -> list:
    """Return cached job list, refreshing if stale."""
    global _jobs_cache, _jobs_cache_ts
    if _jobs_cache is None or time.time() - _jobs_cache_ts > _JOBS_CACHE_TTL:
        _jobs_cache = await repos.jobs.list()
        _jobs_cache_ts = time.time()
    return _jobs_cache


def invalidate_jobs_cache() -> None:
    """Call this whenever a job is created or updated."""
    global _jobs_cache
    _jobs_cache = None


def _is_employer_verified(employer) -> bool:
    """Return True if the employer has completed verification."""
    if employer is None:
        return False
    from backend.app.db.schemas import VerificationStatus

    status = getattr(employer, "verified", None)
    return status == VerificationStatus.VERIFIED


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
    """Return paginated, optionally filtered job listings with verified flag."""
    repos = get_repositories()
    jobs = await _get_jobs(repos)

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
        jobs = [j for j in jobs if q_lower in j.title.lower() or q_lower in j.description.lower()]

    _BPS_REGIONS = {
        "3171": "Jakarta Pusat",
        "3172": "Jakarta Utara",
        "3173": "Jakarta Barat",
        "3174": "Jakarta Selatan",
        "3175": "Jakarta Timur",
        "3273": "Bandung",
        "3578": "Surabaya",
        "3471": "Yogyakarta",
        "5171": "Denpasar",
        "1275": "Medan",
        "7371": "Makassar",
        "6371": "Balikpapan",
    }

    # Enrich with verified flag and location (batch employer lookup)
    employer_cache: dict[str, bool] = {}
    result_items = []
    for j in jobs[offset : offset + limit]:
        emp_id = j.employer_id
        if emp_id not in employer_cache:
            emp = await repos.employers.get(emp_id)
            employer_cache[emp_id] = _is_employer_verified(emp)
        item = j.model_dump() if hasattr(j, "model_dump") else dict(j)
        item["verified"] = employer_cache[emp_id]
        
        location_str = _BPS_REGIONS.get(j.region_code, j.region_code)
        if j.remote_allowed:
            location_str += " · Remote OK"
        item["location"] = location_str
        
        result_items.append(item)

    return {"total": len(jobs), "offset": offset, "limit": limit, "items": result_items}


@router.get("/{job_id}")
async def get_job(job_id: str):
    repos = get_repositories()
    j = await repos.jobs.get(job_id)
    if not j:
        return {"error": "not_found"}
    employer = await repos.employers.get(j.employer_id)
    
    _BPS_REGIONS = {
        "3171": "Jakarta Pusat",
        "3172": "Jakarta Utara",
        "3173": "Jakarta Barat",
        "3174": "Jakarta Selatan",
        "3175": "Jakarta Timur",
        "3273": "Bandung",
        "3578": "Surabaya",
        "3471": "Yogyakarta",
        "5171": "Denpasar",
        "1275": "Medan",
        "7371": "Makassar",
        "6371": "Balikpapan",
    }
    location_str = _BPS_REGIONS.get(j.region_code, j.region_code)
    if j.remote_allowed:
        location_str += " · Remote OK"
        
    return j.model_dump() | {
        "verified": _is_employer_verified(employer),
        "location": location_str
    }
