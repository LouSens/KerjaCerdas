"""LangGraph-powered job-matching agent endpoint.

POST /api/v1/agent/invoke
  { "user_message": "...", "seeker_id": "...", "target_job_id": null }

Degradation strategy:
  1. seeker_id provided and found  -> use it.
  2. seeker_id provided but STALE  -> fall through to inline seeker (never 400).
  3. seeker object provided inline -> use it directly.
  4. Neither                       -> create a minimal anonymous seeker so the
                                      agent always returns job recommendations.

MatchResult enrichment:
  After the graph runs we enrich each MatchResult with the full JobPosting
  metadata (title, company, salary, location) so the frontend can render
  complete job cards from a single API call.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.app.agents.graph.builder import get_graph
from backend.app.db.json_store import get_repositories
from backend.app.db.schemas import (
    CourseRecommendation,
    MatchResult,
    SeekerProfile,
)

router = APIRouter(prefix="/agent", tags=["agent"])
logger = logging.getLogger(__name__)

_ANONYMOUS_SEEKER = SeekerProfile(
    user_id="anonymous",
    full_name="Pengguna",
    region_code="3171",
)


class AgentInvokeRequest(BaseModel):
    """Request body for the unified agent endpoint."""

    user_message: str = ""
    seeker_id: str | None = None
    seeker: SeekerProfile | None = None
    target_job_id: str | None = None
    session_id: str | None = Field(default=None, description="thread id for memory")


class EnrichedMatch(BaseModel):
    """MatchResult extended with human-readable job metadata for the frontend."""

    # Core match scores (from MatchResult)
    job_id: str
    seeker_id: str
    score: float
    cosine: float
    skill_overlap: float
    region_match: bool
    salary_in_range: bool
    rank: int
    explanation: str = ""
    # Enriched job metadata
    title: str = ""
    company: str = ""
    location: str = ""
    salary_range: str = ""
    salary_min: int = 0
    salary_max: int = 0
    remote_allowed: bool = False
    required_skills: list[str] = []
    matching_skills: list[str] = []
    missing_skills: list[str] = []
    experience_years_min: int = 0


class AgentInvokeResponse(BaseModel):
    """Response from the unified agent endpoint."""

    intent: str
    final_response: str
    matches: list[EnrichedMatch] = []
    missing_skills: list[str] = []
    matching_skills: list[str] = []
    recommended_courses: list[CourseRecommendation] = []
    seeker_id: str | None = None   # echo back so frontend can cache it


async def _enrich_matches(
    raw_matches: list[MatchResult],
    candidate_jobs: list,
    seeker_skills: list[str],
) -> list[EnrichedMatch]:
    """Join MatchResult objects with their JobPosting to add human-readable fields."""
    job_index = {j.id: j for j in candidate_jobs}
    enriched: list[EnrichedMatch] = []

    for m in raw_matches:
        job = job_index.get(m.job_id)
        if job is None:
            # Job was deleted between match and enrich — skip gracefully
            continue

        seeker_lower = {s.lower() for s in seeker_skills}
        matching = [s for s in job.required_skills if s.lower() in seeker_lower]
        missing = [s for s in job.required_skills if s.lower() not in seeker_lower]

        # Build human-readable salary string
        if job.salary_min and job.salary_max:
            lo = round(job.salary_min / 1_000_000, 1)
            hi = round(job.salary_max / 1_000_000, 1)
            salary_str = f"Rp {lo:.0f}–{hi:.0f}jt"
        elif job.salary_min:
            salary_str = f"Rp {job.salary_min / 1_000_000:.0f}jt+"
        else:
            salary_str = "Competitive"

        location = job.region_code
        if job.remote_allowed:
            location += " · Remote OK"

        enriched.append(EnrichedMatch(
            # scores
            job_id=m.job_id,
            seeker_id=m.seeker_id,
            score=m.score,
            cosine=m.cosine,
            skill_overlap=m.skill_overlap,
            region_match=m.region_match,
            salary_in_range=m.salary_in_range,
            rank=m.rank,
            explanation=m.explanation,
            # metadata
            title=job.title,
            company=str(job.employer_id),  # employer_id as placeholder; enriched further if needed
            location=location,
            salary_range=salary_str,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            remote_allowed=job.remote_allowed,
            required_skills=list(job.required_skills),
            matching_skills=matching,
            missing_skills=missing,
            experience_years_min=job.experience_years_min,
        ))

    return enriched


@router.post("/invoke", response_model=AgentInvokeResponse)
async def invoke_agent(req: AgentInvokeRequest) -> AgentInvokeResponse:
    """Unified entry point: routes to matcher / skill-gap / advisor based on message intent."""
    repos = get_repositories()

    # --- Resolve seeker (graceful cascade, never 400) ---------------------
    seeker: SeekerProfile | None = req.seeker

    if seeker is None and req.seeker_id:
        seeker = await repos.seekers.get(req.seeker_id)
        if seeker is None:
            logger.warning("seeker_id %s not found (stale?), using inline/anon.", req.seeker_id)

    if seeker is None:
        seeker = _ANONYMOUS_SEEKER

    # --- Load jobs -------------------------------------------------------
    jobs = await repos.jobs.list()

    # --- Run agent --------------------------------------------------------
    state_in = {
        "user_message": req.user_message,
        "seeker": seeker,
        "candidate_jobs": jobs,
        "target_job_id": req.target_job_id,
    }
    config = {"configurable": {"thread_id": req.session_id or seeker.id}}
    graph = get_graph()
    out = await graph.ainvoke(state_in, config=config)

    # --- Enrich matches with job metadata --------------------------------
    raw_matches: list[MatchResult] = out.get("matches", [])
    seeker_skill_names = [s.name for s in (seeker.skills or [])]
    enriched = await _enrich_matches(raw_matches, jobs, seeker_skill_names)

    # --- Enrich company names from employer profiles ---------------------
    employer_cache: dict[str, str] = {}
    for em in enriched:
        emp_id = em.company  # currently holds employer_id
        if emp_id not in employer_cache:
            emp = await repos.employers.get(emp_id)
            employer_cache[emp_id] = emp.company_name if emp else emp_id
        em.company = employer_cache[emp_id]

    return AgentInvokeResponse(
        intent=out.get("intent", "match_jobs"),
        final_response=out.get("final_response", ""),
        matches=enriched,
        missing_skills=out.get("missing_skills", []),
        matching_skills=out.get("matching_skills", []),
        recommended_courses=out.get("recommended_courses", []),
        seeker_id=seeker.id if seeker is not _ANONYMOUS_SEEKER else None,
    )
