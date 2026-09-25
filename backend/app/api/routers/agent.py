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

import hashlib
import logging

from backend.app.api.dependencies import get_current_user
from backend.app.api.middleware.sanitization import sanitize_text
from backend.app.db.models import User
from backend.app.db.postgres_store import find_seeker_by_user_id, get_repositories
from backend.app.db.schemas import (
    CourseRecommendation,
    MatchResult,
    SeekerProfile,
)
from backend.app.services.regions import get_region_name
from backend.app.utils import content_to_text
from fastapi import APIRouter, Depends, HTTPException
from langgraph.errors import GraphRecursionError
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agent", tags=["agent"])
logger = logging.getLogger(__name__)


def _safe_profile_text(value: str, fallback: str) -> str:
    """Sanitize a stored profile string for use inside the LLM context.

    Profile fields are written through endpoints that do not sanitize, so they
    are treated as untrusted here. An injection marker yields `fallback`
    instead of a 422 — the user should still get their job matches.
    """
    try:
        return sanitize_text(value or "", max_length=200, field_name="profile") or fallback
    except HTTPException:
        logger.warning("profile field rejected by sanitizer — using placeholder")
        return fallback


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
    explicit_intent: str | None = None
    session_id: str | None = Field(default=None, description="thread id for memory")
    filters: dict | None = Field(
        default_factory=dict, description="Active UI filters like location, salary"
    )


class EnrichedMatch(BaseModel):
    """MatchResult extended with human-readable job metadata for the frontend."""

    # Core match scores (from MatchResult)
    job_id: str
    seeker_id: str
    score: float
    cosine: float
    skill_overlap: float
    experience_fit: float = 0.0
    education_met: bool = False
    region_match: bool
    salary_in_range: bool
    rank: int
    band: str = "stretch"  # headline for the seeker card; UI never renders score/rank
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
    # Per required skill: claimed / quiz / hr_confirmed / missing (v2 proof).
    skill_proof: list[dict] = []
    experience_years_min: int = 0


class AgentInvokeResponse(BaseModel):
    """Response from the unified agent endpoint."""

    intent: str
    final_response: str
    matches: list[EnrichedMatch] = []
    missing_skills: list[str] = []
    matching_skills: list[str] = []
    recommended_courses: list[CourseRecommendation] = []
    seeker_id: str | None = None  # echo back so frontend can cache it
    target_job_title: str | None = None
    # Observability fields (used by monitoring + A/B analysis)
    fallback_used: bool = False  # True when seeker_id was stale or absent
    band_distribution: dict = {}  # {"strong": n, "possible": n, "stretch": n}
    routing_confidence: float = 1.0  # 1.0 = explicit intent; 0.7 = inferred
    hallucinated_ids_removed: int = 0  # count of invalid job_ids stripped post-LLM
    early_exit: bool = False  # True when token gate fired (all-stretch corpus)


async def _enrich_matches(
    raw_matches: list[MatchResult],
    candidate_jobs: list,
    seeker_skills: list[str],
) -> list[EnrichedMatch]:
    """Join MatchResult objects with their JobPosting to add human-readable fields."""
    job_index = {j.id: j for j in candidate_jobs}
    enriched: list[EnrichedMatch] = []
    # Company names resolved here, in one batched read, so EVERY return path
    # (LLM, early exit, plain match button) shows a name — not an employer id.
    employer_ids = list({j.employer_id for j in candidate_jobs if j.employer_id})
    employers = await get_repositories().employers.get_many(employer_ids) if employer_ids else []
    company_by_id = {e.id: e.company_name for e in employers}

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

        # Shared table (services/regions.py): the local copy here lacked Malang,
        # Bogor, Semarang, Surakarta and mislabelled 6371, so cards showed "3573".
        location = get_region_name(job.region_code) or "Indonesia"
        if job.remote_allowed:
            location += " · Remote OK"

        enriched.append(
            EnrichedMatch(
                # scores
                job_id=m.job_id,
                seeker_id=m.seeker_id,
                score=m.score,
                cosine=m.cosine,
                skill_overlap=m.skill_overlap,
                experience_fit=m.experience_fit,
                education_met=m.education_met,
                region_match=m.region_match,
                salary_in_range=m.salary_in_range,
                rank=m.rank,
                band=m.band,
                explanation=m.explanation,
                # metadata
                title=job.title,
                company=company_by_id.get(job.employer_id, ""),
                location=location,
                salary_range=salary_str,
                salary_min=job.salary_min,
                salary_max=job.salary_max,
                remote_allowed=job.remote_allowed,
                required_skills=list(job.required_skills),
                matching_skills=matching,
                missing_skills=missing,
                skill_proof=m.skill_proof,
                experience_years_min=job.experience_years_min,
            )
        )

    return enriched


async def _check_advisor_quota(user_id: str) -> None:
    from datetime import UTC, datetime

    from backend.app.config.settings import settings
    from backend.app.db.postgres_store import add_event, consume_quota
    from backend.app.services.billing.plans import (
        ADVISOR_FREE_PER_DAY,
        ADVISOR_PRISM_PER_DAY,
        entitlements_for,
    )

    if settings.plan_limits_enforced and not settings.demo_unlimited:
        now = datetime.now(UTC)
        ent = await entitlements_for(user_id)
        # Same window for both tiers, so the paid one cannot come out smaller.
        # Prism used to be metered per 30 days against a free tier metered per
        # day, which made the upsell below an advertisement for a downgrade.
        since = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period = "hari ini"
        limit = ADVISOR_PRISM_PER_DAY if ent.has_prism else ADVISOR_FREE_PER_DAY

        success = await consume_quota(user_id, "advisor_message", limit, since)
        if not success:
            raise HTTPException(
                status_code=429,
                detail=f"Batas {limit} pesan advisor untuk {period} sudah tercapai."
                + ("" if ent.has_prism else f" Prism menaikkannya ke {ADVISOR_PRISM_PER_DAY} pesan / hari."),
            )
    else:
        await add_event(user_id, "advisor_message")


@router.post("/invoke", response_model=AgentInvokeResponse)
async def invoke_agent(
    req: AgentInvokeRequest,
    current_user: User = Depends(get_current_user),
) -> AgentInvokeResponse:
    """Unified entry point: routes to matcher / skill-gap / advisor based on message intent."""
    import time

    _start = time.time()
    repos = get_repositories()

    # --- Sanitize user input BEFORE any LLM injection -------------------
    safe_message = sanitize_text(
        req.user_message or "",
        max_length=2_000,
        field_name="user_message",
    )
    safe_intent = (
        sanitize_text(
            req.explicit_intent or "",
            max_length=200,
            field_name="explicit_intent",
        )
        if req.explicit_intent
        else None
    )

    # --- Resolve seeker (graceful cascade, never 400) ---------------------
    # Inline seeker override is only honoured when it belongs to the authenticated user.
    seeker: SeekerProfile | None = None
    if req.seeker is not None and req.seeker.user_id == current_user.id:
        # An inline profile can never carry proof it has not earned: reset
        # every proof level, then copy real proof from the stored profile.
        from backend.app.services.matching.evidence import carry_proof

        for sk in req.seeker.skills:
            sk.proof_level, sk.proof_date = "claimed", None
        stored = await find_seeker_by_user_id(current_user.id)
        req.seeker.skills = carry_proof(req.seeker.skills, stored.skills if stored else [])
        seeker = req.seeker
    fallback_used = False

    if seeker is None and req.seeker_id:
        candidate = await repos.seekers.get(req.seeker_id)
        if candidate is not None and candidate.user_id == current_user.id:
            seeker = candidate
        else:
            if candidate is not None:
                logger.warning(
                    "seeker_id %s does not belong to user %s — ignoring.",
                    req.seeker_id,
                    current_user.id,
                )
            else:
                logger.warning(
                    "seeker_id %s not found (stale?), using owned profile.", req.seeker_id
                )
            fallback_used = True

    # Fall back to the seeker profile owned by the authenticated user (if any).
    if seeker is None:
        owned = await find_seeker_by_user_id(current_user.id)
        if owned:
            seeker = owned
        else:
            seeker = _ANONYMOUS_SEEKER
            fallback_used = True

    # --- Pre-rank to detect all-stretch corpus (token efficiency gate) ---
    # jobs=None → the matcher prefilters DB-side via the pgvector HNSW index
    # instead of loading every job row into Python.
    from backend.app.services.matching.matcher import SemanticMatcher

    matcher = SemanticMatcher()
    raw_matches = await matcher.rank_jobs_for_seeker(seeker, filters=req.filters)

    # Load only the matched jobs (for enrichment + the hallucination guard).
    jobs = await repos.jobs.get_many([m.job_id for m in raw_matches])
    valid_job_ids = {j.id for j in jobs}

    # Token efficiency gate: skip the LLM when the pool carries NO relevance
    # signal at all — no job with meaningful text similarity and no job
    # sharing even one skill (claimed or proven). Gating on the raw score no
    # longer works since v2: claimed-only skills count at 30%, so a relevant
    # but not-yet-proven profile can legitimately score low.
    max_score = max((m.score for m in raw_matches), default=0.0)
    has_signal = any(
        m.cosine > 0.10 or any(p.get("status") != "missing" for p in m.skill_proof)
        for m in raw_matches
    )
    early_exit = not has_signal
    if early_exit:
        logger.info("token_gate_fired max_score=%.3f seeker=%s", max_score, seeker.id)
        seeker_skill_names = [s.name for s in (seeker.skills or [])]
        enriched = await _enrich_matches(raw_matches, jobs, seeker_skill_names)
        band_dist = _band_distribution(enriched)
        return AgentInvokeResponse(
            intent="job_search",
            final_response=(
                "Belum ada lowongan yang cukup relevan dengan profilmu saat ini. "
                "Coba tambahkan lebih banyak skill di profil, atau upload CV agar AI bisa "
                "mengenali pengalamanmu lebih baik."
            ),
            matches=enriched,
            seeker_id=seeker.id if seeker is not _ANONYMOUS_SEEKER else None,
            target_job_title=None,
            fallback_used=fallback_used,
            band_distribution=band_dist,
            routing_confidence=1.0,
            early_exit=True,
        )

    # --- Plain "show my matches" (button, no chat text) -------------------
    # Ranking is free on every tier (services/billing/plans.py), so it must not
    # spend an advisor message — it did, and a seeker who refreshed matches ten
    # times got an empty list with a 429. It also needs no LLM: every match
    # already carries the matcher's own explanation.
    if safe_intent == "match_jobs" and not safe_message.strip():
        seeker_skill_names = [s.name for s in (seeker.skills or [])]
        enriched = await _enrich_matches(raw_matches, jobs, seeker_skill_names)
        return AgentInvokeResponse(
            intent="match_jobs",
            final_response="Berikut lowongan yang paling cocok dengan profilmu.",
            matches=enriched,
            seeker_id=seeker.id if seeker is not _ANONYMOUS_SEEKER else None,
            target_job_title=None,
            fallback_used=fallback_used,
            band_distribution=_band_distribution(enriched),
            routing_confidence=1.0,
        )

    # --- Plan metering: Free 10 advisor messages / day, Prism 30 / day ---
    await _check_advisor_quota(current_user.id)

    # --- Run agent --------------------------------------------------------
    from backend.app.agents.graph.builder import get_graph

    app_graph = get_graph()

    # Build context prompt for ReAct agent.
    # Profile fields are user-authored and are interpolated ABOVE the
    # <user_input> fence, so they must be sanitized too — otherwise a crafted
    # full_name or skill is second-order prompt injection into the trusted
    # half of the context. sanitize_text raises 422 on injection markers, so
    # fall back to a neutral placeholder rather than failing the whole request.
    safe_name = _safe_profile_text(seeker.full_name, "Pengguna")
    skills = [_safe_profile_text(s.name, "") for s in seeker.skills] if seeker.skills else []
    skills = [s for s in skills if s]
    context = f"[Context System]\nProfil Kandidat:\nNama: {safe_name}\nSkill: {skills}\n"
    routing_confidence = 0.7  # inferred from message
    if safe_intent:
        routing_confidence = 1.0  # explicit intent from UI button
        context += f"\nInstruksi Prioritas (Bypass UI): Kandidat menekan tombol dengan intent '{safe_intent}'. Segera eksekusi alat yang relevan!\n"
        if req.target_job_id:
            context += f"Target Job ID: {req.target_job_id}\n"

    context += f"\n<user_input>\n{safe_message}\n</user_input>"

    state_in = {"messages": [("user", context)]}
    # The checkpointer keys conversation memory on thread_id. session_id comes
    # straight from the client, so it MUST be namespaced by the authenticated
    # user — otherwise two callers passing the same value share one buffer and
    # each can read the other's history back out of the model.
    raw_thread = req.session_id or seeker.id
    thread_id = f"{current_user.id}:{hashlib.sha256(raw_thread.encode()).hexdigest()[:32]}"
    config = {
        "configurable": {"thread_id": thread_id},
        "recursion_limit": 10,
    }
    from backend.app.services.llm_factory import LLMBusyError

    try:
        out = await app_graph.ainvoke(state_in, config=config)
        final_response = content_to_text(out["messages"][-1].content)
    except LLMBusyError:
        # All chat models throttled/failing (or circuit breaker open).
        # Degrade gracefully: return the deterministic matches we already have.
        logger.warning("llm_busy seeker=%s — returning matches without LLM narrative", seeker.id)
        out = {}
        final_response = (
            "Berikut lowongan yang paling cocok dengan profilmu. "
            "Asisten AI sedang sibuk, jadi penjelasan detail belum tersedia — coba lagi sebentar lagi."
        )
    except GraphRecursionError:
        # Agent ran out of steps (e.g. tool loop under LLM throttling).
        # Degrade gracefully: return the deterministic matches we already have.
        logger.warning(
            "graph_recursion_limit seeker=%s — returning matches without LLM narrative", seeker.id
        )
        out = {}
        final_response = (
            "Berikut lowongan yang paling cocok dengan profilmu. "
            "Asisten AI sedang sibuk, jadi penjelasan detail belum tersedia — coba lagi sebentar lagi."
        )
    except RuntimeError:
        # No Gemini auth configured (see llm_factory.build_chat_llm) — a
        # deployment/config problem, not throttling, but the user-facing
        # outcome is the same: degrade to matches without an LLM narrative
        # instead of a raw 500.
        logger.error(
            "llm_unconfigured seeker=%s — returning matches without LLM narrative", seeker.id
        )
        out = {}
        final_response = (
            "Berikut lowongan yang paling cocok dengan profilmu. "
            "Asisten AI belum dikonfigurasi — penjelasan detail belum tersedia."
        )

    # --- Enrich matches with job metadata --------------------------------
    seeker_skill_names = [s.name for s in (seeker.skills or [])]
    enriched = await _enrich_matches(raw_matches, jobs, seeker_skill_names)

    # --- Hallucination guard: strip job_ids that don't exist in DB ------
    pre_count = len(enriched)
    enriched = [m for m in enriched if m.job_id in valid_job_ids]
    hallucinated_removed = pre_count - len(enriched)
    if hallucinated_removed:
        logger.warning(
            "hallucination_guard removed=%d seeker=%s",
            hallucinated_removed,
            seeker.id,
        )

    band_dist = _band_distribution(enriched)
    latency_ms = int((time.time() - _start) * 1000)
    logger.info(
        "agent_invoke seeker=%s intent=%s bands=%s latency_ms=%d fallback=%s",
        seeker.id,
        out.get("intent", "match_jobs"),
        band_dist,
        latency_ms,
        fallback_used,
    )

    return AgentInvokeResponse(
        intent=out.get("intent", "match_jobs"),
        final_response=final_response,
        matches=enriched,
        missing_skills=out.get("missing_skills", []),
        matching_skills=out.get("matching_skills", []),
        recommended_courses=out.get("recommended_courses", []),
        seeker_id=seeker.id if seeker is not _ANONYMOUS_SEEKER else None,
        target_job_title=out.get("target_job_title"),
        fallback_used=fallback_used,
        band_distribution=band_dist,
        routing_confidence=routing_confidence,
        hallucinated_ids_removed=hallucinated_removed,
        early_exit=False,
    )


def _band_distribution(matches: list[EnrichedMatch]) -> dict:
    """Compute the count per band from a list of enriched matches."""
    dist: dict[str, int] = {"strong": 0, "possible": 0, "stretch": 0}
    for m in matches:
        key = getattr(m, "band", "stretch") or "stretch"
        dist[key] = dist.get(key, 0) + 1
    return dist
