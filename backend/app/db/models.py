from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
    Text,
    UniqueConstraint,
)
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
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )


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
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True, unique=True
    )
    full_name: Mapped[str] = mapped_column(String(255))
    headline: Mapped[str] = mapped_column(String(255), default="")
    nik: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # Stores SHA-256 hash of NIK for UU-PDP compliance
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
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True, unique=True
    )
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
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id"), index=True)
    seeker_id: Mapped[str] = mapped_column(String(36), ForeignKey("seekers.id"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="applied")
    cover_letter: Mapped[str] = mapped_column(Text, default="")
    match_score: Mapped[float] = mapped_column(Float, default=0.0)
    note: Mapped[str] = mapped_column(Text, default="")


class OTPRecord(Base, TimestampedMixin):
    """Database-backed OTP store with expiration for distributed/autoscale environments."""

    __tablename__ = "otps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    phone: Mapped[str] = mapped_column(String(30), index=True)
    code_hash: Mapped[str] = mapped_column(String(64))  # SHA-256 hash of 6-digit OTP
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)


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


class QueryEmbedding(Base):
    """Persistent tier of the matcher's query-embedding cache.

    Keyed by sha256(model + query text) — identical to the in-process LRU key —
    so invalidation stays automatic: any profile/job text edit or model switch
    produces a new key. Survives restarts and is shared across instances, so
    the first match after a deploy still skips the Gemini embed call.
    The vector is stored as JSON (not pgvector) because it is only ever fetched
    by exact key, never similarity-searched.
    """

    __tablename__ = "query_embeddings"

    cache_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    embedding: Mapped[list[Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)


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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)


class PartnershipInquiry(Base, TimestampedMixin):
    """Stores partnership, campus integration, training, and enterprise inquiries."""

    __tablename__ = "partnership_inquiries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    organization: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    notes: Mapped[str] = mapped_column(Text, default="")


# ── Skill / occupation taxonomy ───────────────────────────────────────────────
# Normalized alongside (not instead of) SeekerProfile.skills / JobPosting.
# required_skills, which stay as the free-text source the user actually typed.
# These tables are a resolved, canonical projection of that text — see
# services/taxonomy/resolver.py — so matching/analytics can key on skill_id
# instead of re-normalizing strings at query time.


class Skill(Base, TimestampedMixin):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    canonical_name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(50), default="")
    aliases: Mapped[list[Any]] = mapped_column(JSON, default=list)
    skkni_unit_code: Mapped[str | None] = mapped_column(String(30), nullable=True)


class Occupation(Base, TimestampedMixin):
    """A KBJI (Klasifikasi Baku Jenis Jabatan) occupation entry."""

    __tablename__ = "occupations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    kbji_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")


class OccupationSkill(Base):
    """The core skill+proficiency template for an occupation.

    Composite PK (no synthetic id) — this is a pure association row, not an
    entity with its own identity, so it's accessed via dedicated
    postgres_store helpers rather than the generic PostgresRepository (which
    assumes a single `.id` column).
    """

    __tablename__ = "occupation_skills"

    occupation_id: Mapped[str] = mapped_column(String(36), ForeignKey("occupations.id"))
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id"))
    min_level: Mapped[str] = mapped_column(String(20), default="intermediate")
    is_core: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (PrimaryKeyConstraint("occupation_id", "skill_id"),)


class SeekerSkill(Base, TimestampedMixin):
    """Normalized mirror of one entry in SeekerProfile.skills."""

    __tablename__ = "seeker_skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    seeker_id: Mapped[str] = mapped_column(String(36), ForeignKey("seekers.id"), index=True)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id"), index=True)
    level: Mapped[str] = mapped_column(String(20), default="intermediate")
    years: Mapped[float] = mapped_column(Float, default=0.0)
    # self_report | assessment | course_completion
    verified_via: Mapped[str] = mapped_column(String(30), default="self_report")

    __table_args__ = (UniqueConstraint("seeker_id", "skill_id", name="uq_seeker_skill"),)


class JobSkillRequirement(Base):
    """Normalized mirror of one entry in JobPosting.required_skills /
    nice_to_have_skills. Composite PK — see OccupationSkill's docstring."""

    __tablename__ = "job_skill_requirements"

    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id"))
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id"))
    min_level: Mapped[str] = mapped_column(String(20), default="intermediate")
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (PrimaryKeyConstraint("job_id", "skill_id"),)


class SkillDemandSnapshot(Base, TimestampedMixin):
    """Precomputed (not query-time) supply/demand aggregate for one
    (skill, region, period) triple — see services/taxonomy/demand.py."""

    __tablename__ = "skill_demand_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id"), index=True)
    region_code: Mapped[str] = mapped_column(String(50), index=True)
    period: Mapped[str] = mapped_column(String(10), index=True)  # "YYYY-MM"
    demand_count: Mapped[int] = mapped_column(Integer, default=0)
    supply_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_salary_offered: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("skill_id", "region_code", "period", name="uq_skill_demand_period"),
    )


class LearningAction(Base, TimestampedMixin):
    """A seeker's plan (and, once completed, outcome) for closing one skill
    gap — closes the loop that skill-gap recommendations previously dead-ended
    at ("here's a course"), with no record of whether it was ever done."""

    __tablename__ = "learning_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    seeker_id: Mapped[str] = mapped_column(String(36), ForeignKey("seekers.id"), index=True)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id"))
    course_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("courses.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="planned")  # planned|in_progress|completed
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RegionalMinimumWage(Base, TimestampedMixin):
    """UMR/UMK (regional minimum wage) by region and year, used to flag job
    postings priced below the legal floor at creation time.

    SEED DATA IS PLACEHOLDER: the rows shipped with this migration are
    illustrative, not verified BPS/Kemnaker figures — see
    scripts/seed_taxonomy.py's module docstring before using this for
    anything beyond a demo.
    """

    __tablename__ = "regional_minimum_wages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    region_code: Mapped[str] = mapped_column(String(50), index=True)
    year: Mapped[int] = mapped_column(Integer)
    umr_amount: Mapped[int] = mapped_column(Integer)

    __table_args__ = (UniqueConstraint("region_code", "year", name="uq_umr_region_year"),)


class SkillAssessment(Base, TimestampedMixin):
    """A short auto-graded quiz for one skill. `questions` is a list of
    {question, options: [str, ...], correct_index}. Correct answers never
    leave the backend — the seeker-facing endpoint strips them."""

    __tablename__ = "skill_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id"), unique=True)
    questions: Mapped[list[Any]] = mapped_column(JSON, default=list)
    passing_score: Mapped[float] = mapped_column(Float, default=0.7)


class SeekerSkillAssessmentAttempt(Base, TimestampedMixin):
    __tablename__ = "seeker_skill_assessment_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uid)
    seeker_id: Mapped[str] = mapped_column(String(36), ForeignKey("seekers.id"), index=True)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id"), index=True)
    score: Mapped[float] = mapped_column(Float)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
