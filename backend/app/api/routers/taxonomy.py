"""Skill/occupation taxonomy — reference data, resolution, and the
skill-demand insights read path.

Public (no auth): this is reference data and precomputed aggregates, not a
seeker's or employer's own records. Skill-verification actions (assessments)
live on the seeker router instead, since those ARE user-scoped.
"""

from __future__ import annotations

from backend.app.api.schemas.taxonomy import ResolveSkillRequest
from backend.app.db.postgres_store import (
    get_repositories,
    list_occupation_skills,
    list_skill_demand,
)
from backend.app.services.taxonomy.resolver import resolve_skill
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/taxonomy", tags=["Taxonomy"])


@router.get("/skills")
async def search_skills(q: str = "", limit: int = 20):
    """Autocomplete against the canonical skill list, for profile/job-post
    forms. Empty `q` returns the first `limit` skills alphabetically."""
    repos = get_repositories()
    all_skills = await repos.skills.list()
    if q:
        needle = q.strip().lower()
        matches = [s for s in all_skills if needle in s.canonical_name.lower()]
    else:
        matches = all_skills
    matches.sort(key=lambda s: s.canonical_name)
    return {"total": len(matches), "items": matches[:limit]}


@router.get("/occupations")
async def search_occupations(q: str = "", limit: int = 20):
    """Browse/search KBJI occupations."""
    repos = get_repositories()
    all_occupations = await repos.occupations.list()
    if q:
        needle = q.strip().lower()
        matches = [
            o for o in all_occupations if needle in o.title.lower() or needle in o.kbji_code.lower()
        ]
    else:
        matches = all_occupations
    matches.sort(key=lambda o: o.title)
    return {"total": len(matches), "items": matches[:limit]}


@router.get("/occupations/{kbji_code}")
async def get_occupation(kbji_code: str):
    """Full skill+proficiency template for one occupation — an employer can
    start a job posting from this instead of a blank form."""
    repos = get_repositories()
    all_occupations = await repos.occupations.list()
    occupation = next((o for o in all_occupations if o.kbji_code == kbji_code), None)
    if not occupation:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Occupation tidak ditemukan")

    links = await list_occupation_skills(occupation.id)
    skills_by_id = {s.id: s for s in await repos.skills.list()}
    skill_template = [
        {
            "skill_id": link.skill_id,
            "canonical_name": skills_by_id[link.skill_id].canonical_name
            if link.skill_id in skills_by_id
            else None,
            "min_level": link.min_level,
            "is_core": link.is_core,
        }
        for link in links
    ]
    return {"occupation": occupation, "skills": skill_template}


@router.post("/resolve-skill")
async def resolve_skill_endpoint(payload: ResolveSkillRequest):
    """Best-effort canonical-skill match for one free-text string, for
    backfilling existing profile/job data or suggesting during data entry."""
    matches = await resolve_skill(payload.text)
    return {"query": payload.text, "matches": [m.__dict__ for m in matches]}


@router.get("/insights/skill-demand")
async def get_skill_demand(region_code: str | None = None, period: str | None = None):
    """Precomputed supply/demand/avg-salary by skill — the labor-market
    intelligence read path. Reads `skill_demand_snapshots`; never aggregates
    at request time (see services/taxonomy/demand.py for the write side)."""
    snapshots = await list_skill_demand(region_code=region_code, period=period)
    return {"total": len(snapshots), "items": snapshots}
