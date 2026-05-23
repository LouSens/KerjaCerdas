"""
KerjaCerdas ORM Models
==========================
SQLAlchemy 2.0 declarative models for all core entities.

Tables:
  - users            - Auth users (seekers + employers)
  - seeker_profiles  - Extended seeker data
  - job_postings     - Job listings (employer-created)
  - saved_jobs       - Seeker bookmarks
  - applications     - Job applications
  - verification_logs - e-KYC / SIVIL audit trail

ANTIGRAVITY PROTOCOL Section 7: PostgreSQL 15 + JSONB for flexible profiles.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.api.database import Base


def _utcnow() -> datetime:
    """Return timezone-aware UTC now."""
    return datetime.now(timezone.utc)


def _uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


class User(Base):
    """
    Core user table - supports both seeker and employer roles.

    Password is stored as a bcrypt hash (never plaintext).
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # 'seeker' | 'employer'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    seeker_profile: Mapped["SeekerProfile | None"] = relationship(back_populates="user", uselist=False)
    posted_jobs: Mapped[list["JobPosting"]] = relationship(back_populates="employer")
    saved_jobs: Mapped[list["SavedJob"]] = relationship(back_populates="user")


class SeekerProfile(Base):
    """
    Extended profile for job seekers.

    Skills stored as JSON array for flexible querying.
    """

    __tablename__ = "seeker_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    skills: Mapped[list] = mapped_column(SQLiteJSON, default=list)  # ["Python", "SQL", ...]
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    education_level: Mapped[str] = mapped_column(String(10), default="S1")  # SMA, D3, S1, S2, S3
    region_code: Mapped[str] = mapped_column(String(10), default="3171")  # BPS code
    salary_expectation: Mapped[int] = mapped_column(Integer, default=0)
    resume_text: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="seeker_profile")


class JobPosting(Base):
    """
    Job listing created by an employer.

    Required skills stored as JSON array.
    Status can be: 'active', 'paused', 'closed'.
    """

    __tablename__ = "job_postings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    employer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    region_code: Mapped[str] = mapped_column(String(10), default="3171")
    region_name: Mapped[str] = mapped_column(String(100), default="")
    salary_min: Mapped[int] = mapped_column(Integer, default=0)
    salary_max: Mapped[int] = mapped_column(Integer, default=0)
    required_skills: Mapped[list] = mapped_column(SQLiteJSON, default=list)
    education_min: Mapped[str] = mapped_column(String(10), default="S1")
    experience_years_min: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | paused | closed
    views: Mapped[int] = mapped_column(Integer, default=0)
    applicants: Mapped[int] = mapped_column(Integer, default=0)
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    employer: Mapped["User"] = relationship(back_populates="posted_jobs")


class SavedJob(Base):
    """Seeker's bookmarked / saved job postings."""

    __tablename__ = "saved_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("job_postings.id", ondelete="CASCADE"), index=True)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_user_job"),)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="saved_jobs")
    job: Mapped["JobPosting"] = relationship()


class VerificationLog(Base):
    """
    Audit trail for e-KYC and SIVIL verifications.

    CRITICAL: Only stores a verification hash - never raw PII.
    """

    __tablename__ = "verification_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    verification_type: Mapped[str] = mapped_column(String(20))  # 'ekyc' | 'sivil'
    status: Mapped[str] = mapped_column(String(20))  # 'VERIFIED' | 'FAILED'
    verification_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    match_score: Mapped[float] = mapped_column(Float, default=0.0)
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
