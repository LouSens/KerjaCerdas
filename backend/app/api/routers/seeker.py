"""Seeker-side profile, bookmarks, and gamification endpoints.

Uses the JSON store (same layer as the agent/uploads/admin), so seeker
profiles created here are immediately visible to the matching engine.
Auth still goes through JWT (auth.py / SQLAlchemy User), but all seeker
data lives in data/seekers/ and data/applications/.
"""

from __future__ import annotations

import logging

from backend.app.api.dependencies import get_current_user, require_seeker
from backend.app.db.models import User
from backend.app.db.postgres_store import (
    find_applications_by_seeker_id,
    find_gamification_by_seeker_id,
    find_seeker_by_user_id,
    find_skill_gaps_by_seeker_id,
    get_repositories,
)
from backend.app.db.schemas import (
    Application,
    ApplicationStatus,
    GamificationStats,
    SeekerProfile,
    Skill,
)
from backend.app.services.matching.matcher import SemanticMatcher
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/seeker",
    tags=["Seeker"],
    dependencies=[Depends(require_seeker)],
)


# ── Profile ───────────────────────────────────────────────────────────────────


@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    profile = await find_seeker_by_user_id(current_user.id)
    if not profile:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Profile belum dibuat. Upload CV atau isi manual."
        )
    return profile


@router.post("/profile", status_code=status.HTTP_201_CREATED)
async def create_or_update_profile(
    data: dict,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Create or overwrite the seeker profile for the logged-in user.

    Embedding runs in the background so the response is returned immediately
    (< 200ms) instead of blocking on the Gemini API call (1–3s).
    """
    repos = get_repositories()
    profile = await find_seeker_by_user_id(current_user.id)

    # Parse inline skills: accept both list[str] and list[Skill]
    raw_skills = data.get("skills", [])
    skills: list[Skill] = []
    for sk in raw_skills:
        if isinstance(sk, str):
            skills.append(Skill(name=sk))
        elif isinstance(sk, dict):
            skills.append(Skill(**sk))
        elif isinstance(sk, Skill):
            skills.append(sk)

    # Parse inline experience
    from backend.app.db.schemas import Education, EducationLevel, VerificationStatus, WorkExperience

    raw_exp = data.get("experience", [])
    experience: list[WorkExperience] = []
    for x in raw_exp:
        if isinstance(x, dict):
            experience.append(WorkExperience(**x))
        elif isinstance(x, WorkExperience):
            experience.append(x)

    # Parse inline education
    raw_edu = data.get("education", [])
    education: list[Education] = []
    for e in raw_edu:
        if isinstance(e, dict):
            raw_deg = (e.get("degree") or "S1").upper()
            try:
                deg = EducationLevel(raw_deg)
            except ValueError:
                deg = EducationLevel.S1
            education.append(
                Education(
                    institution=e.get("institution", ""),
                    degree=deg,
                    major=e.get("major", ""),
                    graduation_year=int(e.get("graduation_year") or 2024),
                    ijazah_number=e.get("ijazah_number"),
                    sivil_verified=VerificationStatus(e.get("sivil_verified", "unverified")),
                )
            )
        elif isinstance(e, Education):
            education.append(e)

    if profile:
        for field in (
            "full_name",
            "headline",
            "region_code",
            "preferred_regions",
            "salary_expectation_min",
            "salary_expectation_max",
            "resume_text",
            "open_to_remote",
        ):
            if field in data:
                setattr(profile, field, data[field])
        if "skills" in data:
            profile.skills = skills
        if "experience" in data:
            profile.experience = experience
        if "education" in data:
            profile.education = education
    else:
        profile = SeekerProfile(
            user_id=current_user.id,
            full_name=data.get("full_name", current_user.name),
            headline=data.get("headline", ""),
            region_code=data.get("region_code", "3171"),
            skills=skills,
            experience=experience,
            education=education,
            resume_text=data.get("resume_text", ""),
            salary_expectation_min=data.get("salary_expectation_min", 0),
            salary_expectation_max=data.get("salary_expectation_max", 0),
        )

    # Persist profile immediately so profile is available to other endpoints
    await repos.seekers.upsert(profile)

    # Schedule embedding in the background — response is returned before this runs
    async def _embed_and_save(p: SeekerProfile) -> None:
        try:
            matcher = SemanticMatcher()
            await matcher.embed_seeker(p)
            await repos.seekers.upsert(p)
            logger.info("Background embed complete for seeker %s", p.id)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Background embed failed for seeker %s: %s", p.id, exc)

    background_tasks.add_task(_embed_and_save, profile)

    # Ensure gamification record exists
    gam = await find_gamification_by_seeker_id(profile.id)
    if not gam:
        gam = GamificationStats(seeker_id=profile.id)
        # Award first badge for completing profile
        if skills:
            gam.badges.append("profile_complete")
            gam.xp += 100
        await repos.gamification.upsert(gam)

    logger.info(
        "Profile upserted for user_id=%s → seeker %s (embedding queued)",
        current_user.id,
        profile.id,
    )
    return {
        "seeker_id": profile.id,
        "skills_count": len(profile.skills),
        "embedding_status": "queued",
    }


# ── Gamification ──────────────────────────────────────────────────────────────


@router.get("/gamification")
async def get_gamification(current_user: User = Depends(get_current_user)):
    profile = await find_seeker_by_user_id(current_user.id)
    if not profile:
        return {"xp": 0, "level": 1, "streak_days": 0, "badges": []}
    g = await find_gamification_by_seeker_id(profile.id)
    if not g:
        return {"xp": 0, "level": 1, "streak_days": 0, "badges": []}
    return {
        "xp": g.xp,
        "level": max(1, g.xp // 250 + 1),
        "streak_days": g.streak_days,
        "badges": g.badges,
        "quests_completed": g.quests_completed,
    }


# ── Bookmarks (saved jobs) ────────────────────────────────────────────────────


@router.post("/bookmarks", status_code=status.HTTP_201_CREATED)
async def save_job(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    job_id: str = body.get("job_id", "")
    repos = get_repositories()
    job = await repos.jobs.get(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")

    profile = await find_seeker_by_user_id(current_user.id)
    seeker_id = profile.id if profile else current_user.id

    existing = await repos.applications.find(
        lambda a: a.job_id == job_id and a.seeker_id == seeker_id
    )
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sudah tersimpan")

    app = Application(job_id=job_id, seeker_id=seeker_id, status=ApplicationStatus.SAVED)
    await repos.applications.upsert(app)
    return {"id": app.id, "job_id": job_id, "status": app.status}


@router.delete("/bookmarks/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_job(job_id: str, current_user: User = Depends(get_current_user)):
    repos = get_repositories()
    profile = await find_seeker_by_user_id(current_user.id)
    seeker_id = profile.id if profile else current_user.id

    apps = await repos.applications.find(
        lambda a: (
            a.job_id == job_id and a.seeker_id == seeker_id and a.status == ApplicationStatus.SAVED
        )
    )
    for a in apps:
        await repos.applications.delete(a.id)
    return None


@router.get("/bookmarks")
async def list_bookmarks(current_user: User = Depends(get_current_user)):
    """Return all saved job bookmarks for the logged-in seeker, enriched with job and employer metadata."""
    repos = get_repositories()
    profile = await find_seeker_by_user_id(current_user.id)
    if not profile:
        return []
    seeker_id = profile.id
    apps = await find_applications_by_seeker_id(seeker_id)
    apps = [a for a in apps if a.status == ApplicationStatus.SAVED]
    # Enrich with job titles
    result = []
    for app in apps:
        job = await repos.jobs.get(app.job_id)
        # Resolve employer name
        emp = await repos.employers.get(job.employer_id) if job else None
        result.append(
            {
                "application_id": app.id,
                "job_id": app.job_id,
                "title": job.title if job else "—",
                "company": emp.company_name if emp else (job.employer_id if job else "—"),
                "status": app.status,
                "saved_at": app.created_at.isoformat(),
                # Enriched fields for SavedJobsPage (1.3)
                "salary_range": (
                    f"Rp {int(job.salary_min / 1_000_000)}–{int(job.salary_max / 1_000_000)}jt"
                    if job and job.salary_min
                    else None
                ),
                "salary_min": job.salary_min if job else None,
                "salary_max": job.salary_max if job else None,
                "region_code": job.region_code if job else None,
                "remote_allowed": job.remote_allowed if job else False,
            }
        )
    return result


@router.post("/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Create a job application (status=applied) for the logged-in seeker.

    Accepts: { job_id: str, cover_letter: str (optional) }
    Returns: { application_id, job_id, status }
    Idempotent — returns existing application if already applied.
    """
    job_id: str = body.get("job_id", "")
    if not job_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "job_id diperlukan")
    repos = get_repositories()
    job = await repos.jobs.get(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")

    profile = await find_seeker_by_user_id(current_user.id)
    seeker_id = profile.id if profile else current_user.id

    existing = await repos.applications.find(
        lambda a: a.job_id == job_id and a.seeker_id == seeker_id
    )
    if existing:
        return {
            "application_id": existing[0].id,
            "job_id": job_id,
            "status": existing[0].status,
            "already_applied": True,
        }

    app = Application(
        job_id=job_id,
        seeker_id=seeker_id,
        status=ApplicationStatus.APPLIED,
        cover_letter=body.get("cover_letter", ""),
        note="Lamaran terkirim ke sistem rekrutmen institusi dan menunggu peninjauan tim HR.",
    )
    await repos.applications.upsert(app)

    # Award XP for applying
    gam = await find_gamification_by_seeker_id(seeker_id)
    if gam:
        gam.xp += 50
        if "first_apply" not in gam.badges:
            gam.badges.append("first_apply")
        await repos.gamification.upsert(gam)

    logger.info("Application created: seeker %s → job %s", seeker_id, job_id)
    return {
        "id": app.id,
        "application_id": app.id,
        "job_id": job_id,
        "status": app.status,
        "note": app.note,
        "already_applied": False,
    }


@router.post("/skill-gap")
async def analyze_skill_gap(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Run AI-powered skill gap analysis for the logged-in seeker.

    Accepts: { target_job_id: str | None }
    Returns: {
        missing_skills, matching_skills, recommended_courses,
        match_before, match_after, target_job_title,
        estimated_hours, gap_severity, seeker_id
    }

    Flow:
      1. Load seeker profile and all active jobs from DB.
      2. Run SemanticMatcher to rank jobs and find top match.
      3. Run _run_skill_gap_inline() to compute gap vs the target job.
      4. Recommend courses via Gemini → course store → catalog fallback.
      5. Persist a SkillGapResult record so the frontend can load it later.
    """
    from backend.app.agents.graph.nodes import _recommend_courses
    from backend.app.db.schemas import SkillGapResult

    repos = get_repositories()

    # --- Resolve seeker -------------------------------------------------------
    seeker = await find_seeker_by_user_id(current_user.id)
    if not seeker:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Profile belum dibuat. Upload CV atau isi profil terlebih dahulu.",
        )

    # --- Load jobs ------------------------------------------------------------
    jobs = await repos.jobs.list()
    if not jobs:
        return {
            "seeker_id": seeker.id,
            "missing_skills": [],
            "matching_skills": [],
            "recommended_courses": [],
            "match_before": 0.0,
            "match_after": 0.0,
            "target_job_title": None,
            "estimated_hours": 0,
            "gap_severity": "low",
            "message": "Belum ada lowongan aktif di sistem.",
        }

    # --- Rank jobs -----------------------------------------------------------
    matcher = SemanticMatcher()
    raw_matches = await matcher.rank_jobs_for_seeker(seeker, jobs)

    # Determine target job
    target_job_id = body.get("target_job_id")
    job_index = {j.id: j for j in jobs}

    target = None
    if target_job_id:
        target = job_index.get(target_job_id)
    if target is None and raw_matches:
        target = job_index.get(raw_matches[0].job_id)

    if target is None:
        return {
            "seeker_id": seeker.id,
            "missing_skills": [],
            "matching_skills": [],
            "recommended_courses": [],
            "match_before": 0.0,
            "match_after": 0.0,
            "target_job_title": None,
            "estimated_hours": 0,
            "gap_severity": "low",
            "message": "Tidak ditemukan pekerjaan yang relevan. Tambahkan skill ke profil.",
        }

    # --- Compute skill gap ---------------------------------------------------
    seeker_lower = {s.name.lower(): s.name for s in (seeker.skills or [])}
    matching_skills: list[str] = []
    missing_skills: list[str] = []

    for req in target.required_skills or []:
        if req.lower() in seeker_lower:
            matching_skills.append(seeker_lower[req.lower()])
        else:
            missing_skills.append(req)

    total_required = len(target.required_skills or [])
    match_before = (len(matching_skills) / total_required) if total_required else 1.0
    # Hypothetical match after covering all gaps
    match_after = (
        min(match_before + (len(missing_skills) / total_required * 0.85), 1.0)
        if total_required
        else 1.0
    )

    # Use top match score as the current match score
    if raw_matches:
        top_score = next(
            (m.score for m in raw_matches if m.job_id == target.id), raw_matches[0].score
        )
        match_before = max(match_before, top_score)

    # --- Determine severity --------------------------------------------------
    gap_ratio = len(missing_skills) / total_required if total_required else 0
    if gap_ratio >= 0.5:
        gap_severity = "high"
    elif gap_ratio >= 0.25:
        gap_severity = "medium"
    else:
        gap_severity = "low"

    # --- Course recommendations (Gemini > course store > catalog) ------------
    courses = await _recommend_courses(missing_skills, target)

    # Estimated hours: ~10h per missing skill, capped at 120h
    estimated_hours = min(len(missing_skills) * 10, 120)

    # --- Persist SkillGapResult ----------------------------------------------
    try:
        gap_record = SkillGapResult(
            seeker_id=seeker.id,
            target_job_id=target.id,
            missing_skills=missing_skills,
            matching_skills=matching_skills,
            gap_severity=gap_severity,
            match_percentage=round(match_before * 100, 1),
            recommended_courses=courses,
            estimated_readiness_months=max(1, len(missing_skills) // 2),
            summary=(
                f"Gap {len(missing_skills)} skill untuk posisi {target.title}. "
                f"Match saat ini {round(match_before * 100)}%."
            ),
        )
        await repos.skill_gaps.upsert(gap_record)
    except Exception as exc:
        logger.warning("skill_gap persist failed: %s", exc)

    logger.info(
        "skill_gap seeker=%s target=%s missing=%d matching=%d",
        seeker.id,
        target.id,
        len(missing_skills),
        len(matching_skills),
    )

    return {
        "seeker_id": seeker.id,
        "target_job_id": target.id,
        "target_job_title": target.title,
        "missing_skills": missing_skills,
        "matching_skills": matching_skills,
        "recommended_courses": [c.model_dump() for c in courses],
        "match_before": round(match_before * 100, 1),
        "match_after": round(match_after * 100, 1),
        "estimated_hours": estimated_hours,
        "gap_severity": gap_severity,
    }


@router.get("/skill-gap/latest")
async def get_latest_skill_gap(current_user: User = Depends(get_current_user)):
    """Return the most recently computed skill gap result for the seeker, if any."""
    repos = get_repositories()
    profile = await find_seeker_by_user_id(current_user.id)
    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile tidak ditemukan.")
    seeker_id = profile.id
    gaps = await find_skill_gaps_by_seeker_id(seeker_id)
    if not gaps:
        return None
    # Return the most recently created
    latest = max(gaps, key=lambda g: g.created_at)
    courses = [
        c.model_dump() if hasattr(c, "model_dump") else dict(c) for c in latest.recommended_courses
    ]
    # Resolve target job title from job store (3.3 fix: was always returning None)
    target_job_title = None
    if latest.target_job_id:
        target_job = await repos.jobs.get(latest.target_job_id)
        target_job_title = target_job.title if target_job else None
    return {
        "seeker_id": seeker_id,
        "target_job_id": latest.target_job_id,
        "target_job_title": target_job_title,
        "missing_skills": latest.missing_skills,
        "matching_skills": latest.matching_skills,
        "recommended_courses": courses,
        "match_before": latest.match_percentage,
        "match_after": min(latest.match_percentage + 9.0, 99.0),
        "estimated_hours": min(len(latest.missing_skills) * 10, 120),
        "gap_severity": latest.gap_severity,
    }


@router.get("/applications")
async def list_applications(current_user: User = Depends(get_current_user)):
    """Return all job applications for the logged-in seeker with job metadata.

    Returns list of { id, application_id, job_id, title, company, status, note, applied_at, updated_at }.
    """
    repos = get_repositories()
    profile = await find_seeker_by_user_id(current_user.id)
    if not profile:
        return []
    seeker_id = profile.id
    apps = await find_applications_by_seeker_id(seeker_id)
    result = []
    for app in apps:
        job = await repos.jobs.get(app.job_id)
        emp = await repos.employers.get(job.employer_id) if job else None

        # Determine note from DB or provide informative default by status
        note_val = getattr(app, "note", "") or ""
        if not note_val:
            if app.status == ApplicationStatus.APPLIED:
                note_val = "Lamaran terkirim ke sistem rekrutmen institusi dan menunggu peninjauan tim HR."
            elif app.status == ApplicationStatus.REVIEWED:
                note_val = "Berkas dan profil portofolio Anda sedang dalam proses peninjauan aktif oleh Hiring Manager."
            elif app.status == ApplicationStatus.INTERVIEW:
                note_val = "Kandidat lolos ke tahap wawancara teknis. Tim HR akan menghubungi untuk koordinasi jadwal."
            elif app.status in (ApplicationStatus.HIRED, ApplicationStatus.OFFERED):
                note_val = "Selamat! Anda dinyatakan lolos dan menerima penawaran kerja (Offering). Silakan cek email terdaftar."
            elif app.status == ApplicationStatus.REJECTED:
                note_val = "Terima kasih atas partisipasi Anda. Proses rekrutmen untuk posisi ini telah selesai."
            else:
                note_val = "Status lamaran tersimpan dalam sistem."

        applied_dt = getattr(app, "created_at", None)
        updated_dt = getattr(app, "updated_at", None) or applied_dt

        result.append(
            {
                "id": app.id,
                "application_id": app.id,
                "job_id": app.job_id,
                "title": job.title if job else "—",
                "company": emp.company_name if emp else "—",
                "status": app.status,
                "note": note_val,
                "applied_at": applied_dt.strftime("%Y-%m-%d") if hasattr(applied_dt, "strftime") else str(applied_dt)[:10] if applied_dt else "2026-08-26",
                "updated_at": updated_dt.strftime("%Y-%m-%d") if hasattr(updated_dt, "strftime") else str(updated_dt)[:10] if updated_dt else "2026-08-26",
            }
        )
    return result
