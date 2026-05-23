"""
KerjaCerdas — Seeker Router
==============================
Job seeker operations: Managing profiles and bookmarking jobs.

ANTIGRAVITY PROTOCOL: Bookmarks require seeker role.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.database import get_session
from src.api.dependencies import get_current_user, require_seeker
from src.api.models import JobPosting, SavedJob, SeekerProfile, User
from src.api.schemas.seeker import (
    BookmarkCreate,
    BookmarkResponse,
    SeekerProfileCreate,
    SeekerProfileResponse,
    SeekerProfileUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/seeker",
    tags=["Seeker Actions"],
    dependencies=[Depends(require_seeker)],
)


# ──────────────────────────────────────────────────────────────────────────────
#  SEEKER PROFILE
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=SeekerProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get the current seeker's profile."""
    stmt = select(SeekerProfile).where(SeekerProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create one."
        )

    return profile


@router.post("/profile", response_model=SeekerProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    request: SeekerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Create a new profile for the current seeker."""
    # Check if a profile already exists
    stmt = select(SeekerProfile).where(SeekerProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists. Use PUT or PATCH to update."
        )

    profile = SeekerProfile(
        user_id=current_user.id,
        skills=request.skills,
        experience_years=request.experience_years,
        education_level=request.education_level,
        region_code=request.region_code,
        salary_expectation=request.salary_expectation,
        resume_text=request.resume_text,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    logger.info(f"Seeker profile created for user {current_user.email}")
    return profile


@router.patch("/profile", response_model=SeekerProfileResponse)
async def update_profile(
    request: SeekerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Update existing profile."""
    stmt = select(SeekerProfile).where(SeekerProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)

    return profile


# ──────────────────────────────────────────────────────────────────────────────
#  BOOKMARKS (SAVED JOBS)
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/bookmarks", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def save_job(
    request: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Save/Bookmark a job posting."""
    # Check if job exists
    stmt_job = select(JobPosting).where(JobPosting.id == request.job_id)
    if not (await db.execute(stmt_job)).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")

    new_bookmark = SavedJob(user_id=current_user.id, job_id=request.job_id)
    db.add(new_bookmark)

    try:
        await db.commit()
        await db.refresh(new_bookmark)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is already bookmarked."
        )
    
    logger.info(f"Seeker {current_user.email} bookmarked job {request.job_id}")
    return new_bookmark


@router.delete("/bookmarks/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Remove a bookmark."""
    stmt = select(SavedJob).where(SavedJob.job_id == job_id, SavedJob.user_id == current_user.id)
    result = await db.execute(stmt)
    bookmark = result.scalar_one_or_none()

    if not bookmark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")

    await db.delete(bookmark)
    await db.commit()

    return None


@router.get("/bookmarks")
async def list_bookmarks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Retrieve all saved jobs for current seeker."""
    # In a full app: we'd JOIN SavedJob and JobPosting to return job details
    stmt = select(SavedJob).where(SavedJob.user_id == current_user.id)
    result = await db.execute(stmt)
    bookmarks = result.scalars().all()
    
    return [
        {
            "id": b.id,
            "job_id": b.job_id,
            "saved_at": b.saved_at
        } for b in bookmarks
    ]
