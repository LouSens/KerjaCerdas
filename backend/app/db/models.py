from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# pgvector is only available when using PostgreSQL. For SQLite dev mode we fall
# back to a plain Text column (stores the vector as a serialised string that is
# never used at query time — embeddings are computed in-process by the matcher).
try:
    from pgvector.sqlalchemy import Vector as _Vector  # type: ignore[import-untyped]
    _VectorCol = lambda: _Vector(768)  # noqa: E731
except Exception:  # pragma: no cover
    from sqlalchemy import Text as _Text  # type: ignore[assignment]
    _VectorCol = lambda: _Text()  # noqa: E731


def _now() -> datetime:
    return datetime.now(UTC)

def _uid() -> str:
    return str(uuid4())

class Base(DeclarativeBase):
    pass

class TimestampedMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

class User(Base, TimestampedMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class SeekerProfile(Base, TimestampedMixin):
    __tablename__ = "seekers"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    headline: Mapped[str] = mapped_column(String(255), default="")
    nik: Mapped[str | None] = mapped_column(String(16), nullable=True)
    nik_verified: Mapped[str] = mapped_column(String(20), default="unverified")
    date_of_birth: Mapped[str | None] = mapped_column(String(20), nullable=True)
    region_code: Mapped[str] = mapped_column(String(50))
    preferred_regions: Mapped[list[Any]] = mapped_column(JSON, default=list)
    skills: Mapped[list[Any]] = mapped_column(JSON, default=list)
    experience: Mapped[list[Any]] = mapped_column(JSON, default=list)
    education: Mapped[list[Any]] = mapped_column(JSON, default=list)
    resume_text: Mapped[str] = mapped_column(Text, default="")
    salary_expectation_min: Mapped[int] = mapped_column(Integer, default=0)
    salary_expectation_max: Mapped[int] = mapped_column(Integer, default=0)
    open_to_remote: Mapped[bool] = mapped_column(Boolean, default=True)
    embedding = mapped_column(_VectorCol(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(100), nullable=True)

class Employer(Base, TimestampedMixin):
    __tablename__ = "employers"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    company_name: Mapped[str] = mapped_column(String(255))
    npwp: Mapped[str | None] = mapped_column(String(50), nullable=True)
    industry: Mapped[str] = mapped_column(String(100), default="")
    size: Mapped[str] = mapped_column(String(20), default="sme")
    region_code: Mapped[str] = mapped_column(String(50))
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    verified: Mapped[str] = mapped_column(String(20), default="unverified")

class JobPosting(Base, TimestampedMixin):
    __tablename__ = "jobs"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    employer_id: Mapped[str] = mapped_column(String(36), ForeignKey("employers.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    kbji_code: Mapped[str] = mapped_column(String(50), default="")
    description: Mapped[str] = mapped_column(Text)
    responsibilities: Mapped[list[Any]] = mapped_column(JSON, default=list)
    required_skills: Mapped[list[Any]] = mapped_column(JSON, default=list)
    nice_to_have_skills: Mapped[list[Any]] = mapped_column(JSON, default=list)
    education_min: Mapped[str] = mapped_column(String(10), default="S1")
    experience_years_min: Mapped[int] = mapped_column(Integer, default=0)
    region_code: Mapped[str] = mapped_column(String(50))
    remote_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    salary_min: Mapped[int] = mapped_column(Integer, default=0)
    salary_max: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    embedding = mapped_column(_VectorCol(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(100), nullable=True)

class Application(Base, TimestampedMixin):
    __tablename__ = "applications"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    job_id: Mapped[str] = mapped_column(String(36), index=True)
    seeker_id: Mapped[str] = mapped_column(String(36), index=True)
    status: Mapped[str] = mapped_column(String(50), default="applied")
    cover_letter: Mapped[str] = mapped_column(Text, default="")
    match_score: Mapped[float] = mapped_column(Float, default=0.0)

class MatchBundle(Base, TimestampedMixin):
    __tablename__ = "matches"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    subject_kind: Mapped[str] = mapped_column(String(20))
    subject_id: Mapped[str] = mapped_column(String(36), index=True)
    top_k: Mapped[int] = mapped_column(Integer)
    results: Mapped[list[Any]] = mapped_column(JSON, default=list)
    embedding_model: Mapped[str] = mapped_column(String(100))

class SkillGapResult(Base, TimestampedMixin):
    __tablename__ = "skill_gaps"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    seeker_id: Mapped[str] = mapped_column(String(36), index=True)
    target_job_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    missing_skills: Mapped[list[Any]] = mapped_column(JSON, default=list)
    matching_skills: Mapped[list[Any]] = mapped_column(JSON, default=list)
    gap_severity: Mapped[str] = mapped_column(String(20))
    match_percentage: Mapped[float] = mapped_column(Float)
    recommended_courses: Mapped[list[Any]] = mapped_column(JSON, default=list)
    estimated_readiness_months: Mapped[int] = mapped_column(Integer)
    summary: Mapped[str] = mapped_column(Text)

class ChatSession(Base, TimestampedMixin):
    __tablename__ = "conversations"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    seeker_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    title: Mapped[str] = mapped_column(String(255), default="")
    messages: Mapped[list[Any]] = mapped_column(JSON, default=list)

class Course(Base, TimestampedMixin):
    __tablename__ = "courses"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    provider: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(100))
    skills_taught: Mapped[list[Any]] = mapped_column(JSON, default=list)
    duration: Mapped[str] = mapped_column(String(100))
    cost_idr: Mapped[int] = mapped_column(Integer, default=0)
    is_prakerja: Mapped[bool] = mapped_column(Boolean, default=False)
    level: Mapped[str] = mapped_column(String(50), default="beginner")
    url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")

class AIPerformanceLog(Base, TimestampedMixin):
    __tablename__ = "ai_logs"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    request_id: Mapped[str] = mapped_column(String(100))
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    role: Mapped[str] = mapped_column(String(100))
    task: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100))
    latency_ms: Mapped[int] = mapped_column(Integer)
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    rating: Mapped[str | None] = mapped_column(String(20), nullable=True)

class GamificationStats(Base, TimestampedMixin):
    __tablename__ = "gamification"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    seeker_id: Mapped[str] = mapped_column(String(36), index=True)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    badges: Mapped[list[Any]] = mapped_column(JSON, default=list)
    quests_completed: Mapped[list[Any]] = mapped_column(JSON, default=list)


class Event(Base):
    """Analytics event table — foundation of the feedback loop data moat.

    Each user interaction (job_viewed, apply_clicked, band_clicked, etc.) is
    stored here for funnel analysis, A/B testing result measurement, and
    eventual model fine-tuning. No PII is stored — user_id is a UUID reference.
    """
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    session_id: Mapped[str] = mapped_column(String(100), default="", index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    job_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    band: Mapped[str | None] = mapped_column(String(10), nullable=True)  # strong/possible/stretch
    ab_variant: Mapped[str | None] = mapped_column(String(30), nullable=True)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True
    )
