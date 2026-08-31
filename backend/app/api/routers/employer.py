"""Employer endpoints — profile, job CRUD and real reverse-matching candidate search.

Uses JSON store (same layer as uploads/agent), so postings created here are
immediately visible to the semantic matcher.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from backend.app.api.dependencies import get_current_user, require_employer
from backend.app.api.schemas.employer import (
    ApplicationStatusUpdate,
    CandidateSearchRequest,
    EmployerProfileUpdate,
    JobCreateRequest,
    JobPoolEstimateRequest,
    JobUpdateRequest,
    UnlockCandidateRequest,
)
from backend.app.db.models import User
from backend.app.db.postgres_store import find_employer_by_user_id, get_repositories
from backend.app.db.schemas import (
    EMPLOYER_SETTABLE_STATUSES,
    ApplicationStatus,
    EducationLevel,
    Employer,
    JobPosting,
    allowed_transitions,
    can_transition,
)
from backend.app.services.matching.matcher import SemanticMatcher
from fastapi import APIRouter, Depends, HTTPException, status

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/employer",
    tags=["Employer"],
    dependencies=[Depends(require_employer)],
)


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _get_employer(user_id: str) -> Employer | None:
    return await find_employer_by_user_id(user_id)


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

    Editable fields: company_name, npwp, industry, size, region_code,
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
        edu = EducationLevel.S1

    title = payload.title.strip()
    if not title:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Judul lowongan wajib diisi.")

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
    )

    matcher = SemanticMatcher()
    await matcher.embed_job(job)
    await repos.jobs.upsert(job)
    logger.info("Job created: %s by user_id=%s", job.id, current_user.id)
    return {"job_id": job.id, "title": job.title}


@router.get("/jobs")
async def list_my_jobs(current_user: User = Depends(get_current_user)):
    """Return the jobs posted by the current employer, with application counts."""
    repos = get_repositories()
    employer = await _get_employer(current_user.id)
    if not employer:
        return {"total": 0, "items": []}
    jobs = await repos.jobs.find(lambda j: j.employer_id == employer.id)

    # Attach real application counts from the applications store
    enriched = []
    for j in jobs:
        apps = await repos.applications.find(lambda a: a.job_id == j.id)
        job_dict = j.model_dump()
        job_dict["application_count"] = len(apps)
        enriched.append(job_dict)

    return {"total": len(enriched), "items": enriched}


@router.patch("/jobs/{job_id}")
async def update_job(
    job_id: str,
    payload: JobUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    repos = get_repositories()
    job = await repos.jobs.get(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")

    employer = await _get_employer(current_user.id)
    if not employer or job.employer_id != employer.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bukan milik Anda")

    # The model declares exactly the editable fields, so anything else in the
    # request is already dropped; `exclude_unset` keeps a PATCH partial.
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    for field, value in updates.items():
        setattr(job, field, value)

    # Re-embed if description or skills changed
    if "description" in updates or "required_skills" in updates:
        matcher = SemanticMatcher()
        await matcher.embed_job(job)

    await repos.jobs.upsert(job)
    return {"job_id": job.id, "updated": sorted(updates)}


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str, current_user: User = Depends(get_current_user)):
    repos = get_repositories()
    job = await repos.jobs.get(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")
    employer = await _get_employer(current_user.id)
    if not employer or job.employer_id != employer.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bukan milik Anda")
    await repos.jobs.delete(job_id)
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


@router.post("/jobs/{job_id}/candidates")
async def find_candidates(
    job_id: str,
    payload: CandidateSearchRequest | None = None,
    current_user: User = Depends(get_current_user),
):
    """Return top-K seekers ranked by semantic + skill fit for this job."""
    repos = get_repositories()
    job = await repos.jobs.get(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")

    search = payload or CandidateSearchRequest()
    top_k = search.top_k
    filters = search.filters.model_dump(exclude_none=True)

    # seekers=None → the matcher prefilters DB-side via the pgvector HNSW index.
    matcher = SemanticMatcher()
    ranked = await matcher.rank_seekers_for_job(job, top_k=top_k, filters=filters)
    if not ranked:
        return {"job_id": job_id, "total": 0, "candidates": []}

    # Load only the ranked seekers (needed for the name-redaction teaser below).
    seekers = await repos.seekers.get_many([c["seeker_id"] for c in ranked])

    # Redact full_name (Teaser Method / LinkedIn Style)
    for c in ranked:
        seeker = next((s for s in seekers if s.id == c["seeker_id"]), None)
        if (
            seeker
            and seeker.experience
            and isinstance(seeker.experience[0], dict)
            and seeker.experience[0].get("company")
        ):
            c["full_name"] = f"Someone at {seeker.experience[0]['company']}"
        elif (
            seeker
            and getattr(seeker, "experience", [])
            and hasattr(seeker.experience[0], "company")
        ):
            c["full_name"] = f"Someone at {seeker.experience[0].company}"
        elif (
            seeker
            and seeker.education
            and isinstance(seeker.education[0], dict)
            and seeker.education[0].get("institution")
        ):
            c["full_name"] = f"Someone from {seeker.education[0]['institution']}"
        elif (
            seeker
            and getattr(seeker, "education", [])
            and hasattr(seeker.education[0], "institution")
        ):
            c["full_name"] = f"Someone from {seeker.education[0].institution}"
        elif seeker and seeker.region_code:
            c["full_name"] = f"Someone in region {seeker.region_code}"
        else:
            c["full_name"] = "Hidden Candidate"

    return {"job_id": job_id, "total": len(ranked), "candidates": ranked}


# ── Pay-to-Unlock candidate contact (3.5) ────────────────────────────────────
# Stub implementation: in production this validates a real Midtrans/Xendit
# payment token before revealing the candidate's contact info.
# Budget note: integrate with Midtrans Snap (free to register, ~1.5% MDR) or
# Xendit (free API, transaction fee only) for production pay-to-unlock.

_UNLOCKED_CONTACTS: dict[str, set[str]] = {}  # employer_id → set of seeker_ids


@router.post("/jobs/{job_id}/unlock/{seeker_id}")
async def unlock_candidate(
    job_id: str,
    seeker_id: str,
    payload: UnlockCandidateRequest | None = None,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Unlock a candidate's full contact info after payment validation.

    In demo mode: accepts any payment_token value and returns mock contact.
    In production: validate payment_token with Midtrans/Xendit before unlock.

    Returns: { unlocked: true, name, email, phone, unlock_id }
    """
    repos = get_repositories()
    job = await repos.jobs.get(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")

    employer = await _get_employer(current_user.id)
    if not employer:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Profil perusahaan tidak ditemukan")

    seeker = await repos.seekers.get(seeker_id)
    if not seeker:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Kandidat tidak ditemukan")

    # Check if already unlocked (idempotent)
    employer_unlocks = _UNLOCKED_CONTACTS.setdefault(employer.id, set())
    if seeker_id not in employer_unlocks:
        # In production: validate payment_token with payment gateway here
        # if not _validate_payment(payload.payment_token if payload else None):
        #     raise HTTPException(402, "Payment required")
        employer_unlocks.add(seeker_id)
        logger.info("Employer %s unlocked seeker %s for job %s", employer.id, seeker_id, job_id)

    # Resolve the real user record for contact info
    users = await repos.users.find(lambda u: u.id == seeker.user_id)
    real_user = users[0] if users else None

    return {
        "unlocked": True,
        "seeker_id": seeker_id,
        "name": seeker.full_name or (real_user.name if real_user else "Kandidat"),
        "email": real_user.email if real_user else "demo@kerjacerdas.id",
        "phone": getattr(seeker, "phone", "+628123456789") or "+628123456789",
        "unlock_id": f"unlock_{employer.id[:8]}_{seeker_id[:8]}",
        "unlock_cost_idr": 50000,  # Rp 50.000 per unlock
        "note": "[DEMO] Dalam produksi, verifikasi payment_token Midtrans/Xendit terlebih dahulu.",
    }


# ── Applicant & Application Management (Real Pipeline) ─────────────────────────


@router.get("/applications")
async def list_employer_applications(
    job_id: str | None = None,
    current_user: User = Depends(get_current_user),
):
    """Return real applications submitted to this employer's jobs.

    Optional query parameter: ?job_id=<job_id> to filter by a specific job.
    """
    repos = get_repositories()
    employer = await _get_employer(current_user.id)
    if not employer:
        return {"total": 0, "items": []}

    my_jobs = await repos.jobs.find(lambda j: j.employer_id == employer.id)
    my_job_ids = {j.id for j in my_jobs}
    job_map = {j.id: j for j in my_jobs}

    target_job_ids = {job_id} if job_id and job_id in my_job_ids else my_job_ids

    all_apps = await repos.applications.list()
    relevant_apps = [
        a for a in all_apps if a.job_id in target_job_ids and a.status != ApplicationStatus.SAVED
    ]

    enriched = []
    for app in relevant_apps:
        job = job_map.get(app.job_id)
        seeker = await repos.seekers.get(app.seeker_id)
        users = await repos.users.find(
            lambda u: u.id == (seeker.user_id if seeker else app.seeker_id)
        )
        user_record = users[0] if users else None

        skill_names = [getattr(s, "name", str(s)) for s in (getattr(seeker, "skills", []) or [])]
        applied_dt = getattr(app, "created_at", None)
        updated_dt = getattr(app, "updated_at", None) or applied_dt

        enriched.append(
            {
                "id": app.id,
                "application_id": app.id,
                "job_id": app.job_id,
                "job_title": job.title if job else "—",
                "seeker_id": app.seeker_id,
                "seeker_name": seeker.full_name
                if seeker and seeker.full_name
                else (user_record.name if user_record else "Pelamar"),
                "seeker_email": user_record.email if user_record else "pelamar@kerjacerdas.id",
                "seeker_phone": getattr(seeker, "phone", "") or "+628123456789",
                "headline": getattr(seeker, "headline", "") if seeker else "",
                "skills": skill_names,
                "status": app.status,
                "note": getattr(app, "note", "") or "",
                "cover_letter": getattr(app, "cover_letter", "") or "",
                "match_score": getattr(app, "match_score", 0.0) or 0.0,
                "applied_at": applied_dt.strftime("%Y-%m-%d %H:%M")
                if hasattr(applied_dt, "strftime")
                else str(applied_dt)[:16]
                if applied_dt
                else "2026-08-26 10:00",
                "updated_at": updated_dt.strftime("%Y-%m-%d %H:%M")
                if hasattr(updated_dt, "strftime")
                else str(updated_dt)[:16]
                if updated_dt
                else "2026-08-26 10:00",
            }
        )

    return {"total": len(enriched), "items": enriched}


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

        app.status = target

    if payload.note is not None:
        app.note = payload.note

    app.updated_at = datetime.now(UTC)
    await repos.applications.upsert(app)
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
