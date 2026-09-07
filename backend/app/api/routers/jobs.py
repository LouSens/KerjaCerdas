"""Consolidated public + admin /jobs surface."""

from __future__ import annotations

import time

from backend.app.db.postgres_store import get_repositories
from backend.app.services.regions import get_region_name
from fastapi import APIRouter, HTTPException, Query, status

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


def _industry_label(employer) -> str:
    """Employer's industry, falling back to "Lainnya" when unset.

    /jobs/industries groups jobs under this exact label so an unset
    industry still shows up as a selectable category — and the `industry`
    filter below has to use this SAME label, not the raw (often empty)
    `employer.industry`, or selecting the "Lainnya" category that's
    displayed with a real count would silently match nothing.
    """
    return (employer.industry if employer is not None else "") or "Lainnya"


@router.get("")
async def list_jobs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    region: str | None = None,
    q: str | None = None,
    job_type: str | None = None,
    experience_min: int | None = None,
    remote_allowed: bool | None = None,
    salary_min: int | None = None,
    industry: str | None = None,
):
    """Return paginated, optionally filtered job listings with verified flag."""
    repos = get_repositories()
    jobs = await _get_jobs(repos)

    jobs = [j for j in jobs if j.is_active]
    if region:
        jobs = [j for j in jobs if j.region_code == region]
    if job_type:
        # JobPosting has no `work_type` field — only `remote_allowed`.
        jt = job_type.lower()
        if jt in ("remote", "hybrid"):
            jobs = [j for j in jobs if j.remote_allowed]
        elif jt == "onsite":
            jobs = [j for j in jobs if not j.remote_allowed]
    if remote_allowed is not None:
        jobs = [j for j in jobs if j.remote_allowed == remote_allowed]
    if experience_min is not None:
        jobs = [j for j in jobs if (j.experience_years_min or 0) <= experience_min]
    if salary_min is not None:
        jobs = [j for j in jobs if (j.salary_min or 0) >= salary_min]
    if q:
        q_lower = q.lower()
        jobs = [j for j in jobs if q_lower in j.title.lower() or q_lower in j.description.lower()]

    # Batch employer lookup — needed for `verified`/`industry`/`location` on
    # every matched job. `industry` filters on the employer's industry, so
    # unlike the other filters it can't be applied before this lookup runs.
    employer_cache: dict[str, object] = {}

    async def _employer(emp_id: str):
        if emp_id not in employer_cache:
            employer_cache[emp_id] = await repos.employers.get(emp_id)
        return employer_cache[emp_id]

    if industry:
        kept = []
        for j in jobs:
            emp = await _employer(j.employer_id)
            if _industry_label(emp) == industry:
                kept.append(j)
        jobs = kept

    result_items = []
    for j in jobs[offset : offset + limit]:
        emp = await _employer(j.employer_id)
        item = j.model_dump() if hasattr(j, "model_dump") else dict(j)
        item.pop("embedding", None)
        item.pop("embedding_model", None)
        item["verified"] = _is_employer_verified(emp)
        item["industry"] = _industry_label(emp)

        location_str = get_region_name(j.region_code)
        if j.remote_allowed:
            location_str += " · Remote OK"
        item["location"] = location_str

        result_items.append(item)

    return {"total": len(jobs), "offset": offset, "limit": limit, "items": result_items}


@router.get("/regions")
async def list_regions():
    """Distinct region codes actually present among active jobs, with a
    display name where one is known and a live count — so the frontend's
    location filter always reflects real data instead of a hardcoded guess
    at which cities happen to have postings."""
    repos = get_repositories()
    jobs = await _get_jobs(repos)
    counts: dict[str, int] = {}
    for j in jobs:
        if j.is_active and j.region_code:
            counts[j.region_code] = counts.get(j.region_code, 0) + 1

    regions = [
        {"code": code, "name": get_region_name(code), "job_count": count}
        for code, count in counts.items()
    ]
    regions.sort(key=lambda r: r["job_count"], reverse=True)
    return {"items": regions}


@router.get("/industries")
async def list_industries():
    """Distinct employer industries actually present among active jobs, with
    a live count — powers the frontend's category/division filter from real
    employer data instead of a fixed list that skews toward whichever
    industry happens to be top-of-mind (e.g. tech)."""
    repos = get_repositories()
    jobs = await _get_jobs(repos)
    employer_cache: dict[str, object] = {}
    counts: dict[str, int] = {}
    for j in jobs:
        if not (j.is_active and j.employer_id):
            continue
        if j.employer_id not in employer_cache:
            employer_cache[j.employer_id] = await repos.employers.get(j.employer_id)
        emp = employer_cache[j.employer_id]
        name = _industry_label(emp)
        counts[name] = counts.get(name, 0) + 1

    industries = [{"name": name, "job_count": count} for name, count in counts.items()]
    industries.sort(key=lambda i: i["job_count"], reverse=True)
    return {"items": industries}


@router.get("/{job_id}")
async def get_job(job_id: str):
    repos = get_repositories()
    j = await repos.jobs.get(job_id)
    if not j:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")
    employer = await repos.employers.get(j.employer_id)

    location_str = get_region_name(j.region_code)
    if j.remote_allowed:
        location_str += " · Remote OK"

    item = j.model_dump()
    item.pop("embedding", None)
    item.pop("embedding_model", None)
    return item | {
        "verified": _is_employer_verified(employer),
        "location": location_str,
        "industry": _industry_label(employer),
    }
