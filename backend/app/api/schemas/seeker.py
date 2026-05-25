"""
KerjaCerdas — Seeker Schemas
===========================
Pydantic schemas for Job Seeker actions (Profile, Bookmarks).
"""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class SeekerProfileUpdate(BaseModel):
    """Payload to update an existing SeekerProfile."""
    skills: list[str] | None = None
    experience_years: int | None = Field(default=None, ge=0)
    education_level: str | None = None
    region_code: str | None = None
    salary_expectation: int | None = Field(default=None, ge=0)
    resume_text: str | None = None

class SeekerProfileCreate(SeekerProfileUpdate):
    """Payload to create a SeekerProfile initially."""
    skills: list[str] = Field(default_factory=list)
    experience_years: int = Field(default=0, ge=0)
    education_level: str = "S1"
    region_code: str = "3171"
    salary_expectation: int = Field(default=0, ge=0)
    resume_text: str = ""

class SeekerProfileResponse(SeekerProfileCreate):
    """Response returning a SeekerProfile."""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class BookmarkCreate(BaseModel):
    """Payload to bookmark a job posting."""
    job_id: str


class BookmarkResponse(BaseModel):
    """Response for a bookmarked job."""
    id: str
    job_id: str
    user_id: str
    saved_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
