"""
KerjaCerdas — Employer Schemas
==============================
Pydantic schemas for Employer actions (Job Postings, Candidate Search).
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class JobPostingCreate(BaseModel):
    """Payload for an employer creating a new job posting."""
    title: str = Field(..., max_length=255)
    company: str = Field(..., max_length=255)
    description: str
    region_code: str = Field(..., max_length=10)
    region_name: str = ""
    salary_min: int = Field(default=0, ge=0)
    salary_max: int = Field(default=0, ge=0)
    required_skills: list[str] = Field(default_factory=list)
    education_min: str = "S1"
    experience_years_min: int = Field(default=0, ge=0)


class JobPostingUpdate(BaseModel):
    """Payload for updating an existing job posting."""
    title: str | None = None
    company: str | None = None
    description: str | None = None
    region_code: str | None = None
    region_name: str | None = None
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    required_skills: list[str] | None = None
    education_min: str | None = None
    experience_years_min: int | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, pattern="^(active|paused|closed)$")


class JobPostingResponse(BaseModel):
    """Response representing a single job posting."""
    id: str  # Kept as str to match frontend expectation
    title: str
    company: str
    description: str
    region_code: str
    region_name: str
    salary_min: int
    salary_max: int
    required_skills: list[str]
    education_min: str
    experience_years_min: int
    status: str
    views: int
    applicants: int
    posted_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobPostingListResponse(BaseModel):
    """Response for a list of job postings."""
    jobs: list[JobPostingResponse]
    total: int


# Optional: Re-use matching Schemas for candidate search
class SearchCandidateRequest(BaseModel):
    """Payload for employer searching candidates using AI."""
    required_skills: list[str]
    region_code: str | None = None
    top_k: int = 10
