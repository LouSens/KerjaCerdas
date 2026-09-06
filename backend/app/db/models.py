import json
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from backend.app.config.settings import settings


class _JSONVectorText(TypeDecorator):
    """Store an embedding list as a JSON string in a plain Text column.

    Used for SQLite dev/test mode, where the value is never used at query
    time (embeddings are computed and compared in-process by the matcher) —
    this only needs to round-trip whatever list was written, which a bare
    Text column can't do on its own since the SQLite driver refuses to bind
    a raw Python list as a parameter.
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(list(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return json.loads(value)


# pgvector is only available when using PostgreSQL. For SQLite dev/test mode we
# fall back to the JSON-serialising Text column above. This is keyed off the
# *actually configured* database URL, not whether the pgvector package happens
# to be importable: an environment that has pgvector installed but is still
# pointed at SQLite (e.g. this repo's own test suite) must still get the Text
# fallback, or the strict Vector(768) type rejects the shorter test-fixture
# embeddings with a dimension mismatch.
if settings.effective_database_url.startswith("sqlite"):
    _VectorCol = lambda: _JSONVectorText()  # noqa: E731
else:
    try:
        from pgvector.sqlalchemy import Vector as _Vector  # type: ignore[import-untyped]

        _VectorCol = lambda: _Vector(768)  # noqa: E731
    except Exception:  # pragma: no cover
        _VectorCol = lambda: _JSONVectorText()  # noqa: E731


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
    # Optional client-supplied idempotency token (see create_job): if a
    # create request is retried after its response was lost — a timeout, a
    # dropped connection, anything short of the client seeing a definitive
    # failure — replaying it with the same client_ref must return the
    # already-created job instead of inserting a second one. Partial (only
    # rows that actually set it) so employer.post-job's normal create path,
    # which never sends one, is unaffected.
    __table_args__ = (
        Index(
            "uq_job_employer_client_ref",
            "employer_id",
            "client_ref",
            unique=True,
            postgresql_where="client_ref IS NOT NULL",
        ),
    )

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
    client_ref: Mapped[str | None] = mapped_column(String(64), nullable=True)
    embedding = mapped_column(_VectorCol(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(100), nullable=True)


class Application(Base, TimestampedMixin):
    __tablename__ = "applications"
    # A seeker has at most one application row per job — status transitions
    # (saved -> applied -> ...) happen in-place on that row (see apply_to_job
    # in seeker.py). Without this constraint, two concurrent requests that
    # both read "no existing application" before either commits can each
    # insert their own row, producing duplicate applications for the same
    # (job, seeker) pair.
    __table_args__ = (UniqueConstraint("job_id", "seeker_id", name="uq_application_job_seeker"),)

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
