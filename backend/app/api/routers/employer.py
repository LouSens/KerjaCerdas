"""Employer endpoints — profile, job CRUD, applicant ranking and talent search.

Uses the postgres_store layer (same layer as uploads/agent), so postings
created here are immediately visible to the semantic matcher.

v2: every new/edited posting passes AutoMod (services/trust/automod.py) and
gets a shareable link + QR code; the applicant list is ranked by the
proof-weighted match score; plan limits (Spark/Beacon/Lighthouse) apply.
Interview kits, skill confirmation, export and trust live in routers/hiring.py.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from backend.app.api.dependencies import get_current_user, require_employer
from backend.app.api.routers.jobs import invalidate_jobs_cache
from backend.app.api.schemas.employer import (
    ApplicationStatusUpdate,
    CandidateSearchRequest,
    EmployerProfileUpdate,
    JobCreateRequest,
    JobPoolEstimateRequest,
    JobUpdateRequest,
)
from backend.app.config.settings import settings
from backend.app.db.models import User
from backend.app.db.postgres_store import (
    add_event,
    consume_quota,
    find_employer_by_user_id,
    find_job_by_employer_and_client_ref,
    find_jobs_by_employer_id,
    get_repositories,
)
from backend.app.db.schemas import (
    EMPLOYER_SETTABLE_STATUSES,
    ApplicationStatus,
    EducationLevel,
    Employer,
    JobPosting,
    allowed_transitions,
    can_transition,
)
from backend.app.db.schemas_proof import ApplicationStatusEvent
from backend.app.services.billing.plans import (
    PLAN_DAYS,
    TALENT_SEARCHES_BEACON,
    TALENT_SEARCHES_LIGHTHOUSE,
    active_job_limit,
    entitlements_for,
    plan_limits_active,
    talent_search_limit,
)
from backend.app.services.hiring.links import new_public_code, public_path
from backend.app.services.hiring.rejection import REJECTION_REASONS
from backend.app.services.matching.matcher import SemanticMatcher, score_pair
from backend.app.services.trust import policy
from backend.app.services.trust.automod import moderate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/employer",
    tags=["Employer"],
    dependencies=[Depends(require_employer)],
)


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _get_employer(user_id: str) -> Employer | None:
    return await find_employer_by_user_id(user_id)


async def _require_owned_job(repos, current_user: User, job_id: str) -> tuple[JobPosting, Employer]:
    """Fetch a job and assert the current user's employer profile owns it.

    Centralizes the tenant-ownership check that used to be hand-repeated at
    every mutating job/candidate endpoint (update_job, delete_job,
    find_candidates, the hiring router). Repeating "load resource, then check
    job.employer_id == employer.id" by hand at each new endpoint means a
    future endpoint can forget it — that was a real P0 cross-tenant finding
    in this codebase's history, now fixed. Routing every caller through one
    function turns "correct everywhere it happens to be checked" into
    "correct by construction".
    """
    job = await repos.jobs.get(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")

    employer = await _get_employer(current_user.id)
    if not employer or job.employer_id != employer.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bukan lowongan milik perusahaan Anda")

    return job, employer


async def _enforce_active_limit(
    user_id: str, employer: Employer, jobs: list[JobPosting], job_id: str
) -> None:
    """Spark: 1 active job, Lighthouse: 5; a Beacon order covers its own job.

    A second AutoMod strike limits the employer to one active job for 30 days.
    That is a moderation penalty, not a plan limit, so it applies whether or
    not plans are sold.
    """
    strike_limited = policy.strike_state(employer)["limited"]
    if not plan_limits_active():
        # No plan limits: active jobs are uncapped; only the strike penalty limits them.
        if not strike_limited:
            return
        if any(j.is_active and j.id != job_id for j in jobs):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Akun dibatasi 1 lowongan aktif selama 30 hari karena pelanggaran aturan. "
                "Nonaktifkan lowongan lain dulu.",
            )
        return
    ent = await entitlements_for(user_id)
    if job_id in ent.beacon_jobs:
        return
    limit = active_job_limit(ent)
    if strike_limited:
        limit = 1
    uncovered_active = [
        j for j in jobs if j.is_active and j.id != job_id and j.id not in ent.beacon_jobs
    ]
    if len(uncovered_active) >= limit:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            f"Batas {limit} lowongan aktif untuk paket kamu tercapai. Nonaktifkan lowongan lain, "
            "beli Beacon untuk lowongan ini, atau upgrade ke Lighthouse.",
        )


# ── Employer Profile ──────────────────────────────────────────────────────────────────────────


@router.get("/profile")
async def get_employer_profile(current_user: User = Depends(get_current_user)):
    """Return the employer's company profile."""
    employer = await _get_employer(current_user.id)
    if not employer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profil perusahaan belum dibuat")
    return employer


@router.post("/profile", status_code=status.HTTP_200_OK)
async def update_employer_profile(
    payload: EmployerProfileUpdate,
    current_user: User = Depends(get_current_user),
):
    """Create or update the employer's company profile.

    Editable fields: company_name, industry, size, region_code,
    website, description. Fields the request omits are left untouched.
    """
    repos = get_repositories()
    provided = payload.model_dump(exclude_unset=True)

    employer = await _get_employer(current_user.id)
    if not employer:
        # Shouldn't normally happen (auto-created on register) but handle gracefully
        employer = Employer(
            user_id=current_user.id,
            company_name=provided.get("company_name") or current_user.name,
            region_code=provided.get("region_code") or "3171",
        )

    for field, value in provided.items():
        if value is not None:
            setattr(employer, field, value)

    await repos.employers.upsert(employer)
    logger.info("Employer profile updated for user_id=%s", current_user.id)
    return {"employer_id": employer.id, "company_name": employer.company_name}


# ── Jobs CRUD ─────────────────────────────────────────────────────────────────


@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def create_job(payload: JobCreateRequest, current_user: User = Depends(get_current_user)):
    repos = get_repositories()
    employer = await _get_employer(current_user.id)
    if not employer:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Employer profile belum ada")

    # An unrecognised education level falls back to S1 rather than 422-ing the
    # whole posting — the field is advisory for matching, not a hard gate.
    try:
        edu = EducationLevel(payload.education_min.upper())
    except ValueError:
        edu = EducationLevel.SMA

    title = payload.title.strip()
    if not title:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Judul lowongan wajib diisi.")

    if "[offline-stub]" in payload.description:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Lowongan dari mode offline (demo) tidak dapat dipublikasikan."
        )

    if policy.strike_state(employer)["suspended"]:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Akun dibatasi karena pelanggaran berulang. Ajukan banding ke admin KerjaCerdas.",
        )

    # Idempotent replay: if the caller already created this exact posting
    # (client_ref set) — e.g. retrying after the first response was lost to
    # a timeout — return the row that already exists instead of inserting a
    # second one under a new id.
    if payload.client_ref:
        existing = await find_job_by_employer_and_client_ref(employer.id, payload.client_ref)
        if existing:
            logger.info(
                "Job create replay: client_ref=%s already maps to job_id=%s, returning it",
                payload.client_ref,
                existing.id,
            )
            # `created: False` tells the caller this wasn't a new posting —
            # without it, a batch publish (JobPackUploader) can't tell a
            # genuine create apart from a replay and would report the same
            # vacancy as newly published on every re-upload of the same pack.
            return {"job_id": existing.id, "title": existing.title, "created": False}

    job = JobPosting(
        employer_id=employer.id,
        title=title,
        description=payload.description,
        responsibilities=payload.responsibilities,
        required_skills=payload.required_skills,
        nice_to_have_skills=payload.nice_to_have_skills,
        education_min=edu,
        experience_years_min=payload.experience_years_min,
        region_code=payload.region_code or payload.location or employer.region_code,
        remote_allowed=payload.work_type in ("remote", "hybrid") or payload.remote_allowed,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        kbji_code=payload.kbji_code,
        client_ref=payload.client_ref,
        public_code=new_public_code(),
    )

    existing_jobs = await find_jobs_by_employer_id(employer.id)
    verdict = await moderate(
        job.title, job.description, job.responsibilities, job.salary_min, job.salary_max
    )
    notice = await policy.apply_verdict(
        job, employer, current_user, verdict, first_job=not existing_jobs
    )
    if job.is_active:
        await _enforce_active_limit(current_user.id, employer, existing_jobs, job.id)

    matcher = SemanticMatcher()
    await matcher.embed_job(job)
    try:
        await repos.jobs.upsert(job)
    except IntegrityError:
        # Lost the race: a concurrent retry with the same client_ref
        # committed first. Same outcome as the pre-check above — return the
        # row that won instead of surfacing a 500 for what is, from the
        # caller's perspective, a successful (if duplicate) request.
        if payload.client_ref:
            existing = await find_job_by_employer_and_client_ref(employer.id, payload.client_ref)
            if existing:
                return {"job_id": existing.id, "title": existing.title, "created": False}
        raise
    invalidate_jobs_cache()
    await policy.log_event(job, "automod", notice["moderation_status"], notice["reasons"])
    logger.info("Job created: %s by user_id=%s", job.id, current_user.id)
    return {
        "job_id": job.id,
        "title": job.title,
        "created": True,
        "public_code": job.public_code,
        "share_path": public_path(job.public_code),
        "moderation_status": notice["moderation_status"],
        "moderation_reasons": notice["reasons"],
        "notice": policy.notice_text(notice),
        "strike": notice["strike"],
    }


@router.get("/jobs")
async def list_my_jobs(current_user: User = Depends(get_current_user)):
    """Return the jobs posted by the current employer, with application counts."""
    repos = get_repositories()
    employer = await _get_employer(current_user.id)
    if not employer:
        return {"total": 0, "items": []}
    jobs = await find_jobs_by_employer_id(employer.id)

    # Batch the application count instead of one query per job: fetch every
    # application once and tally by job_id in Python.
    job_ids = {j.id for j in jobs}
    all_apps = await repos.applications.list()
    counts_by_job: dict[str, int] = {}
    for a in all_apps:
        if a.job_id in job_ids:
            counts_by_job[a.job_id] = counts_by_job.get(a.job_id, 0) + 1

    ent = await entitlements_for(current_user.id)
    enriched = []
    for j in jobs:
        job_dict = j.model_dump(exclude={"embedding"})
        job_dict["application_count"] = counts_by_job.get(j.id, 0)
        job_dict["share_path"] = public_path(j.public_code) if j.public_code else None
        job_dict["plan_tier"] = ent.job_tier(j.id)
        enriched.append(job_dict)

    return {"total": len(enriched), "items": enriched}


@router.patch("/jobs/{job_id}")
async def update_job(
    job_id: str,
    payload: JobUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    repos = get_repositories()
    job, _employer = await _require_owned_job(repos, current_user, job_id)

    # The model declares exactly the editable fields, so anything else in the
    # request is already dropped; `exclude_unset` keeps a PATCH partial.
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    wants_active = updates.pop("is_active", None)
    for field, value in updates.items():
        setattr(job, field, value)

    notice = None
    content_fields = {"title", "description", "responsibilities", "salary_min", "salary_max"}
    if content_fields & set(updates):
        # Edited content is re-checked; this is also how a poster fixes a
        # held/rejected ad ("edit & resubmit").
        verdict = await moderate(
            job.title, job.description, job.responsibilities, job.salary_min, job.salary_max
        )
        was_active = job.is_active
        notice = await policy.apply_verdict(job, _employer, current_user, verdict, first_job=False)
        if notice["moderation_status"] == "published":
            job.is_active = was_active
        await policy.log_event(job, "automod", notice["moderation_status"], notice["reasons"])

    if wants_active is not None:
        if wants_active and job.moderation_status != "published":
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Lowongan belum lolos moderasi. Perbaiki isinya atau ajukan banding.",
            )
        if wants_active and not job.is_active:
            others = await find_jobs_by_employer_id(_employer.id)
            await _enforce_active_limit(current_user.id, _employer, others, job.id)
        job.is_active = bool(wants_active)
        updates["is_active"] = job.is_active

    # Re-embed if description or skills changed
    if "description" in updates or "required_skills" in updates:
        matcher = SemanticMatcher()
        await matcher.embed_job(job)

    if not job.public_code:
        job.public_code = new_public_code()
    await repos.jobs.upsert(job)
    invalidate_jobs_cache()
    out = {"job_id": job.id, "updated": sorted(updates), "moderation_status": job.moderation_status}
    if notice:
        out["moderation_reasons"] = notice["reasons"]
        out["notice"] = policy.notice_text(notice)
    return out


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str, current_user: User = Depends(get_current_user)):
    repos = get_repositories()
    await _require_owned_job(repos, current_user, job_id)
    await repos.jobs.delete(job_id)
    invalidate_jobs_cache()
    return None


# ── AI pool estimation (live preview while drafting a job) ────────────────────


@router.post("/jobs/estimate")
async def estimate_job_pool(payload: JobPoolEstimateRequest):
    """Cheap heuristic pool estimate for the live-preview card in PostJob.

    Walks the seeker store, scores each on skill overlap + location, and
    returns count + median score + a salary tip. No LLM calls — fast enough
    to fire on every keystroke (debounced client-side).
    """
    repos = get_repositories()
    seekers = await repos.seekers.list()

    req_skills = {s.lower() for s in payload.required_skills if s}
    location = payload.location.lower()
    salary_min = payload.salary_min
    salary_max = payload.salary_max

    scored = []
    for s in seekers:
        seeker_skills = {
            sk.name.lower() for sk in getattr(s, "skills", []) if getattr(sk, "name", None)
        }
        if req_skills:
            overlap = len(req_skills & seeker_skills) / max(1, len(req_skills))
        else:
            overlap = 0.6
        loc_bonus = (
            0.15 if location and location in (getattr(s, "region_code", "") or "").lower() else 0
        )
        scored.append(min(1.0, overlap + loc_bonus))

    above_80 = sum(1 for v in scored if v >= 0.8)
    # Demo fallback so the card still feels alive on a fresh DB
    if not scored:
        above_80, median = 340, 82
    else:
        median = int(round((sorted(scored)[len(scored) // 2]) * 100))

    tip = None
    if salary_min and salary_min < 30_000_000:
        target = max(35_000_000, salary_min + 7_000_000)
        target_max = max(salary_max, 50_000_000)
        tip = (
            f"Naikin gaji ke Rp {target // 1_000_000}-{target_max // 1_000_000}jt → "
            f"perkiraan pool naik ~80%."
        )
    elif not req_skills:
        tip = "Tambah 3-5 required skills biar estimasi lebih akurat."

    return {
        "pool_size": max(above_80, 1) if scored else above_80,
        "match_score": median,
        "tip": tip or "Estimasi siap. Klik Publish saat puas.",
    }


# ── Candidate search (REAL reverse-matching, no mocks) ────────────────────────


async def _check_talent_search_quota(user_id: str, job_id: str) -> None:
    """Meter reverse matching — the one employer feature that is actually sold.

    Ranked APPLICANTS are free and uncapped on every tier because scoring people
    who applied costs Rp0 to compute. Searching people who have NOT applied is
    sourcing: it is the thing an employer pays for, so it is the thing that
    carries a countable limit. `talent_search_limit()` existed and was unit
    tested, but no caller ever consulted it, so Spark's documented quota of zero
    was in practice unlimited and the paid tiers bought nothing.

    Both the LIMIT and the COUNTER are scoped to the job for Beacon, because
    Beacon is sold per job. Checking only "does this account hold a Beacon?"
    let one paid job unlock sourcing on every other job the account owned, and
    counting per account would have made two Beacon purchases share one
    30-search allowance. Lighthouse is account-wide by design, so it meters per
    account.
    """
    if not plan_limits_active() or settings.demo_unlimited:
        await add_event(user_id, "talent_search")
        return

    ent = await entitlements_for(user_id)
    limit = talent_search_limit(ent, job_id)
    # Lighthouse buys one account-wide pool; a Beacon buys an allowance for the
    # single job it was bought for.
    bucket = "talent_search" if ent.has_lighthouse else f"talent_search:{job_id}"
    if limit <= 0:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            "Mencari kandidat yang belum melamar tersedia di paket Beacon "
            f"({TALENT_SEARCHES_BEACON}x / 30 hari) atau Lighthouse "
            f"({TALENT_SEARCHES_LIGHTHOUSE}x / 30 hari). Memeringkat pelamar "
            "yang sudah melamar tetap gratis dan tanpa batas.",
        )

    since = datetime.now(UTC) - timedelta(days=PLAN_DAYS)
    if not await consume_quota(user_id, bucket, limit, since):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Kuota {limit} pencarian kandidat per 30 hari sudah terpakai."
            + ("" if ent.has_lighthouse else
               f" Lighthouse menaikkannya ke {TALENT_SEARCHES_LIGHTHOUSE}x / 30 hari."),
        )


@router.post("/jobs/{job_id}/candidates")
async def find_candidates(
    job_id: str,
    payload: CandidateSearchRequest | None = None,
    current_user: User = Depends(get_current_user),
):
    """Return top-K seekers ranked by semantic + skill fit for this job."""
    repos = get_repositories()
    # A recruiter may only search the talent pool for a posting owned by their
    # own organisation. Router-level role enforcement alone is insufficient:
    # without this check employer B could submit employer A's public job id and
    # receive candidate-fit data for a recruitment process they do not own.
    job, _employer = await _require_owned_job(repos, current_user, job_id)
    await _check_talent_search_quota(current_user.id, job_id)

    search = payload or CandidateSearchRequest()
    top_k = search.top_k
    filters = search.filters.model_dump(exclude_none=True)

    # seekers=None → the matcher prefilters DB-side via the pgvector HNSW index.
    matcher = SemanticMatcher()
    ranked = await matcher.rank_seekers_for_job(job, top_k=top_k, filters=filters)
    if not ranked:
        return {"job_id": job_id, "total": 0, "candidates": []}

    # Talent search shows ANONYMISED candidates only: no name, no employer or
    # school names (those let a profile be re-identified on LinkedIn), no
    # contact. The way to reach them is to share the job link; a candidate who
    # applied directly is already fully visible in the applicant list.
    applied_seeker_ids = {
        a.seeker_id for a in await repos.applications.find(lambda a: a.job_id == job_id)
    }
    for c in ranked:
        c["already_applied"] = c["seeker_id"] in applied_seeker_ids
        c["proven_skill_count"] = sum(
            1 for p in c.get("skill_proof", []) if p["status"] in ("quiz", "hr_confirmed")
        )
        if not c["already_applied"]:
            c["full_name"] = f"Kandidat #{c.get('rank', '')}".strip()
            c["headline"] = ""

    return {"job_id": job_id, "total": len(ranked), "candidates": ranked}


# ── Applicant & Application Management (Real Pipeline) ─────────────────────────


@router.get("/applications")
async def list_employer_applications(
    job_id: str | None = None,
    current_user: User = Depends(get_current_user),
):
    """Applications to this employer's jobs, ranked by proof-weighted match score.

    Optional query parameter: ?job_id=<job_id> to filter by a specific job.

    The score is recomputed live (a candidate who passes a quiz after applying
    moves up). On the free Spark tier only the first N applicants per job (by
    arrival) are ranked and fully shown; the rest are listed as `locked` until
    the job is covered by Beacon or Lighthouse.
    """
    repos = get_repositories()
    employer = await _get_employer(current_user.id)
    if not employer:
        return {"total": 0, "items": []}

    my_jobs = await find_jobs_by_employer_id(employer.id)
    my_job_ids = {j.id for j in my_jobs}
    job_map = {j.id: j for j in my_jobs}
    target_job_ids = {job_id} if job_id and job_id in my_job_ids else my_job_ids

    all_apps = await repos.applications.list()
    relevant_apps = [
        a for a in all_apps if a.job_id in target_job_ids and a.status != ApplicationStatus.SAVED
    ]

    seeker_ids = list({a.seeker_id for a in relevant_apps})
    seekers = await repos.seekers.get_many(seeker_ids) if seeker_ids else []
    seeker_by_id = {s.id: s for s in seekers}
    user_lookup_ids = {
        (seeker_by_id[a.seeker_id].user_id if a.seeker_id in seeker_by_id else a.seeker_id)
        for a in relevant_apps
    }
    users = await repos.users.get_many(list(user_lookup_ids)) if user_lookup_ids else []
    user_by_id = {u.id: u for u in users}

    ent = await entitlements_for(current_user.id)
    # 0 means "no cap", which is now the shipped default. Ranked applicants are
    # free to compute, so hiding some of them never saved us a rupiah — it only
    # made the candidate ranked 21st invisible to the employer who asked for a
    # ranking. Paid tiers now differ on interview kits, export and reverse
    # matching instead. The setting stays so a deployment can re-introduce a cap
    # without a code change, and every site below honours 0.
    cap = settings.spark_ranked_applicant_limit

    # Score every applicant first, then rank BY SCORE — not by arrival time.
    # Spark is the tier every employer meets first, so it is the one that has to
    # demonstrate that ranking works. Capping by arrival showed the first N who
    # applied and hid the best candidate behind the paywall whenever they
    # happened to apply late, which demonstrates a queue, not a ranking. The cap
    # now limits how many are revealed, not which.
    scored: dict[str, dict] = {}
    for app in relevant_apps:
        job = job_map.get(app.job_id)
        seeker = seeker_by_id.get(app.seeker_id)
        if seeker and job:
            scored[app.id] = score_pair(seeker, job)

    score_rank: dict[str, int] = {}
    for jid in target_job_ids:
        ordered = sorted(
            (a for a in relevant_apps if a.job_id == jid),
            # Descending score; arrival time breaks ties so the order is stable.
            key=lambda a: (-(scored.get(a.id, {}).get("score") or 0.0), a.created_at),
        )
        for i, a in enumerate(ordered):
            score_rank[a.id] = i

    def _fmt(dt) -> str:
        if hasattr(dt, "strftime"):
            return dt.strftime("%Y-%m-%d %H:%M")
        return str(dt)[:16] if dt else datetime.now(UTC).strftime("%Y-%m-%d %H:%M")

    enriched = []
    for app in relevant_apps:
        job = job_map.get(app.job_id)
        seeker = seeker_by_id.get(app.seeker_id)
        user_record = user_by_id.get(seeker.user_id if seeker else app.seeker_id)
        locked = (
            cap > 0
            and job is not None
            and not ent.premium_for_job(job.id)
            and score_rank.get(app.id, 0) >= cap
        )
        live = scored.get(app.id)
        item = {
            "id": app.id,
            "application_id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "—",
            "seeker_id": app.seeker_id,
            "status": app.status,
            "source": app.source,
            "applied_at": _fmt(app.created_at),
            "updated_at": _fmt(app.updated_at or app.created_at),
            "locked": locked,
        }
        if locked:
            item.update({
                "seeker_name": "Pelamar terkunci",
                "lock_reason": (
                    f"Paket Spark menampilkan {cap} pelamar dengan skor tertinggi. "
                    "Beli Beacon untuk lowongan ini agar semua pelamar terbuka."
                ),
                "match_score": None,
            })
        else:
            item.update({
                "seeker_name": seeker.full_name
                if seeker and seeker.full_name
                else (user_record.name if user_record else "Pelamar"),
                "seeker_email": user_record.email if user_record else "",
                "email_verified": bool(getattr(user_record, "email_verified", False)),
                "headline": seeker.headline if seeker else "",
                "skills": [s.name for s in (seeker.skills if seeker else [])],
                "skill_proof": live["skill_proof"] if live else [],
                "band": live["band"] if live else "stretch",
                "match_score": live["score"] if live else (app.match_score or 0.0),
                "match_score_at_apply": app.match_score or 0.0,
                "note": app.note or "",
                "cover_letter": app.cover_letter or "",
            })
        enriched.append(item)

    # Ranked applicants first (highest score first), locked ones last.
    enriched.sort(key=lambda x: (x["locked"], -(x["match_score"] or 0.0)))
    return {
        "total": len(enriched),
        "ranked_limit": cap if (plan_limits_active() and cap > 0) else None,
        "items": enriched,
    }


# Rejection reason codes live in services/hiring/rejection.py (shared with the
# seeker's application list, which shows them back to the candidate).

# Indonesian aliases the frontend has historically sent for pipeline stages.

_STATUS_ALIASES: dict[str, ApplicationStatus] = {
    "accepted": ApplicationStatus.HIRED,
    "diterima": ApplicationStatus.HIRED,
    "wawancara": ApplicationStatus.INTERVIEW,
    "ditinjau": ApplicationStatus.REVIEWED,
    "ditolak": ApplicationStatus.REJECTED,
    "terkirim": ApplicationStatus.APPLIED,
    "ditawari": ApplicationStatus.OFFERED,
}


def _parse_status(raw: str) -> ApplicationStatus:
    """Resolve a client status string to an ApplicationStatus, or 400."""
    normalized = raw.lower().strip()
    try:
        return ApplicationStatus(normalized)
    except ValueError:
        pass
    if normalized in _STATUS_ALIASES:
        return _STATUS_ALIASES[normalized]
    raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Status '{raw}' tidak valid")


@router.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
):
    """Move an application through the recruitment pipeline and attach notes.

    Status changes are checked against the pipeline state machine
    (`APPLICATION_TRANSITIONS`): the pipeline only moves forward and
    hired/rejected/withdrawn are terminal, so a hire cannot be quietly walked
    back to `applied` and a rejection cannot be flipped to `hired`. Re-sending
    the status an application already has is a no-op rather than an error, so
    a retried request stays safe.
    """
    repos = get_repositories()
    app = await repos.applications.get(application_id)
    if not app:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lamaran tidak ditemukan")

    employer = await _get_employer(current_user.id)
    if not employer:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Profil perusahaan tidak ditemukan")

    job = await repos.jobs.get(app.job_id)
    if not job or job.employer_id != employer.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Anda tidak memiliki izin mengelola lamaran ini"
        )

    # Built while validating, written only AFTER the application row lands —
    # see the comment at the upsert below.
    pending_event: ApplicationStatusEvent | None = None

    if payload.status is not None:
        target = _parse_status(payload.status)
        current = ApplicationStatus(app.status)

        if target not in EMPLOYER_SETTABLE_STATUSES and target != current:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Status '{target.value}' bukan milik perusahaan untuk diubah.",
            )

        if not can_transition(current, target):
            allowed = allowed_transitions(current)
            detail = (
                f"Lamaran berstatus '{current.value}' sudah final dan tidak dapat diubah."
                if not allowed
                else (
                    f"Tidak bisa mengubah status dari '{current.value}' ke "
                    f"'{target.value}'. Berikutnya: {', '.join(allowed)}."
                )
            )
            raise HTTPException(status.HTTP_409_CONFLICT, detail)

        if target == ApplicationStatus.REJECTED and target != current:
            if (payload.reason_code or "") not in REJECTION_REASONS:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    "Penolakan wajib menyertakan alasan. Pilih salah satu: "
                    + ", ".join(REJECTION_REASONS),
                )

        if target != current:
            pending_event = ApplicationStatusEvent(
                application_id=app.id,
                job_id=app.job_id,
                from_status=current.value,
                to_status=target.value,
                match_score=app.match_score or 0.0,
                reason_code=payload.reason_code or "",
                reason_note=(payload.reason_note or "").strip(),
            )
        app.status = target

    if payload.note is not None:
        app.note = payload.note

    app.updated_at = datetime.now(UTC)
    await repos.applications.upsert(app)

    # The history event is written only once the status change itself has been
    # persisted. Each repository upsert runs in its own transaction, so the two
    # writes cannot be made atomic here — but the ORDER decides which way a
    # partial failure fails:
    #
    #   event first  → a failed application write leaves /admin/metrics
    #                  permanently reporting an interview/offer/hire that never
    #                  happened, and a retry (status still unchanged) appends a
    #                  SECOND identical event, since nothing constrains
    #                  transition uniqueness.
    #   status first → a failed event write means the transition is missing from
    #                  metrics. A retry then sees target == current and writes no
    #                  event at all, so duplicates are impossible.
    #
    # Under-counting a real transition is recoverable and honest; fabricating one
    # corrupts the very number this product argues from ("do higher scores reach
    # interview?"). Hence status first, and a loud log rather than a silent pass.
    if pending_event is not None:
        try:
            await repos.status_events.upsert(pending_event)
        except Exception:  # noqa: BLE001 — the status change itself already succeeded
            logger.exception(
                "Status %s->%s persisted for application %s but its history event "
                "was not written — /admin/metrics will under-count this transition.",
                pending_event.from_status,
                pending_event.to_status,
                app.id,
            )

    logger.info(
        "Application %s updated to status=%s note=%s by employer=%s",
        app.id,
        app.status,
        app.note,
        employer.id,
    )

    return {
        "id": app.id,
        "application_id": app.id,
        "status": app.status,
        "note": app.note,
        "updated_at": app.updated_at.isoformat(),
    }
