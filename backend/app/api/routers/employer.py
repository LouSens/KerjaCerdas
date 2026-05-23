"""
KerjaCerdas — Employer Router
===============================
Endpoints for employers (creating and managing jobs, finding candidates).

ANTIGRAVITY PROTOCOL: All endpoints MUST use `require_employer`.
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from src.api.database import get_session
from src.api.dependencies import get_current_user, require_employer
from src.api.models import JobPosting, User
from src.api.schemas.employer import (
    JobPostingCreate,
    JobPostingResponse,
    JobPostingUpdate,
    JobPostingListResponse,
    SearchCandidateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/employer/jobs",
    tags=["Employer Actions"],
    dependencies=[Depends(require_employer)],  # Only employers allowed
)


@router.post("", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    request: JobPostingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new job posting attached to the current employer account.
    """
    logger.info(f"Employer {current_user.email} creating new job posting: {request.title}")
    
    new_job = JobPosting(
        employer_id=current_user.id,
        title=request.title.strip(),
        company=request.company.strip(),
        description=request.description.strip(),
        region_code=request.region_code,
        region_name=request.region_name.strip(),
        salary_min=request.salary_min,
        salary_max=request.salary_max,
        required_skills=request.required_skills,
        education_min=request.education_min,
        experience_years_min=request.experience_years_min,
        status="active",
        views=0,
        applicants=0,
    )
    
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)

    return new_job


@router.get("", response_model=JobPostingListResponse)
async def list_employer_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    List all job postings created by the current employer.
    """
    stmt = (
        select(JobPosting)
        .where(JobPosting.employer_id == current_user.id)
        .order_by(desc(JobPosting.posted_at))
    )
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    
    return JobPostingListResponse(jobs=list(jobs), total=len(jobs))


@router.patch("/{job_id}", response_model=JobPostingResponse)
async def update_job(
    job_id: str,
    request: JobPostingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Update an existing job posting. Examples: change status to paused/closed.
    """
    stmt = select(JobPosting).where(JobPosting.id == job_id, JobPosting.employer_id == current_user.id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
        
    await db.commit()
    await db.refresh(job)
    
    logger.info(f"Employer {current_user.email} updated job posting: {job.id}")
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """
    Delete a job posting completely. 
    Alternatively, use PATCH /status to set status to 'closed'.
    """
    stmt = select(JobPosting).where(JobPosting.id == job_id, JobPosting.employer_id == current_user.id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    
    await db.delete(job)
    await db.commit()
    logger.info(f"Employer {current_user.email} deleted job posting: {job_id}")

    return None

# Placeholder for candidate search (will integrate with MatchingAgent)
@router.post("/search-candidates")
async def search_candidates(
    request: SearchCandidateRequest,
    current_user: User = Depends(get_current_user),
    # db: AsyncSession = Depends(get_session)  # Real implementation would query SeekerProfiles
):
    """
    AI-powered candidate search for employers. Returns a ranked list of mocked seeker candidates.
    (Currently returns mocked data for demonstration)
    """
    logger.info(f"Employer {current_user.email} searching candidates with skills: {request.required_skills}")
    
    # Returning mocked response for now similar to what EmployerDashboard.jsx expects
    mock_candidates = [
        {
            "id": "c1",
            "name": "Andi Pratama",
            "matchScore": 95,
            "skills": ["JavaScript", "React", "Node.js"],
            "experience": "3 Tahun",
            "reasoning": "Kecocokan tinggi pada React dan Node.js"
        },
        {
            "id": "c2",
            "name": "Siti Nurhaliza",
            "matchScore": 88,
            "skills": ["UI/UX", "Figma", "Tailwind CSS"],
            "experience": "2 Tahun",
            "reasoning": "Pengalaman relevan dalam desain UI/UX"
        },
        {
            "id": "c3",
            "name": "Budi Santoso",
            "matchScore": 75,
            "skills": ["Data Analysis", "Python", "SQL"],
            "experience": "1 Tahun",
            "reasoning": "Sesuai kualifikasi, perlu tambahan skill Cloud"
        }
    ]
    
    # Sort by match score and return top_k
    return {"candidates": mock_candidates[:request.top_k], "total_found": min(request.top_k, 3)}
