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
from backend.app.db.postgres_store import get_repositories
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
    repos = get_repositories()
    profiles = await repos.seekers.find(lambda s: s.user_id == current_user.id)
    if not profiles:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Profile belum dibuat. Upload CV atau isi manual."
        )
    return profiles[0]


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
    existing = await repos.seekers.find(lambda s: s.user_id == current_user.id)

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

    if existing:
        profile = existing[0]
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
        if skills:
            profile.skills = skills
    else:
        profile = SeekerProfile(
            user_id=current_user.id,
            full_name=data.get("full_name", current_user.name),
            headline=data.get("headline", ""),
            region_code=data.get("region_code", "3171"),
            skills=skills,
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
    gam_list = await repos.gamification.find(lambda g: g.seeker_id == profile.id)
    if not gam_list:
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
    repos = get_repositories()
    profiles = await repos.seekers.find(lambda s: s.user_id == current_user.id)
    if not profiles:
        return {"xp": 0, "level": 1, "streak_days": 0, "badges": []}
    gam_list = await repos.gamification.find(lambda g: g.seeker_id == profiles[0].id)
    if not gam_list:
        return {"xp": 0, "level": 1, "streak_days": 0, "badges": []}
    g = gam_list[0]
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

    profiles = await repos.seekers.find(lambda s: s.user_id == current_user.id)
    seeker_id = profiles[0].id if profiles else current_user.id

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
    profiles = await repos.seekers.find(lambda s: s.user_id == current_user.id)
    seeker_id = profiles[0].id if profiles else current_user.id

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
    profiles = await repos.seekers.find(lambda s: s.user_id == current_user.id)
    if not profiles:
        return []
    seeker_id = profiles[0].id
    apps = await repos.applications.find(
        lambda a: a.seeker_id == seeker_id and a.status == ApplicationStatus.SAVED
    )
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

    profiles = await repos.seekers.find(lambda s: s.user_id == current_user.id)
    seeker_id = profiles[0].id if profiles else current_user.id

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
    )
    await repos.applications.upsert(app)

    # Award XP for applying
    gam_list = await repos.gamification.find(lambda g: g.seeker_id == seeker_id)
    if gam_list:
        gam = gam_list[0]
        gam.xp += 50
        if "first_apply" not in gam.badges:
            gam.badges.append("first_apply")
        await repos.gamification.upsert(gam)

    logger.info("Application created: seeker %s → job %s", seeker_id, job_id)
    return {
        "application_id": app.id,
        "job_id": job_id,
        "status": app.status,
        "already_applied": False,
    }


@router.get("/applications")
async def list_applications(current_user: User = Depends(get_current_user)):
    """Return all job applications for the logged-in seeker with job metadata.

    Returns list of { application_id, job_id, title, company, status, applied_at }.
    """
    repos = get_repositories()
    profiles = await repos.seekers.find(lambda s: s.user_id == current_user.id)
    if not profiles:
        return []
    seeker_id = profiles[0].id
    apps = await repos.applications.find(lambda a: a.seeker_id == seeker_id)
    result = []
    for app in apps:
        job = await repos.jobs.get(app.job_id)
        emp = await repos.employers.get(job.employer_id) if job else None
        result.append(
            {
                "application_id": app.id,
                "job_id": app.job_id,
                "title": job.title if job else "—",
                "company": emp.company_name if emp else "—",
                "status": app.status,
                "applied_at": app.created_at.isoformat(),
            }
        )
    return result
