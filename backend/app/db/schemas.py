"""
KerjaCerdas — canonical Pydantic schemas.

These models are the single source of truth for:
  • request/response shapes (FastAPI)
  • the JSON file store under /data (dev mode)
  • the Supabase / Postgres+pgvector migration target (prod mode)

Field naming follows snake_case so models map 1:1 to Supabase tables.
The `embedding` field uses list[float] in Python and `vector(768)` in pgvector.
"""

from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# ── Common ────────────────────────────────────────────────────────────────────


def _now() -> datetime:
    return datetime.now(UTC)


def _uid() -> str:
    return str(uuid4())


class TimestampedModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


# ── Enums ─────────────────────────────────────────────────────────────────────


class UserRole(str, Enum):
    SEEKER = "seeker"
    EMPLOYER = "employer"


class EducationLevel(str, Enum):
    SMA = "SMA"
    D3 = "D3"
    D4 = "D4"
    S1 = "S1"
    S2 = "S2"
    S3 = "S3"


class ApplicationStatus(str, Enum):
    SAVED = "saved"  # Bookmarked/saved (not yet applied)
    APPLIED = "applied"
    REVIEWED = "reviewed"
    INTERVIEW = "interview"
    OFFERED = "offered"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


# ── Application lifecycle ─────────────────────────────────────────────────────
#
# The recruitment pipeline only moves forward. Without this table any status
# could be written over any other, so a hired candidate could be walked back to
# `applied` and a rejected one flipped to `hired` — silently rewriting the
# record both sides of the hire rely on.
#
# HIRED, REJECTED and WITHDRAWN are terminal: correcting one is a deliberate
# act that belongs in an admin/audit path, not in the ordinary status PATCH.

APPLICATION_TRANSITIONS: dict[ApplicationStatus, frozenset[ApplicationStatus]] = {
    ApplicationStatus.SAVED: frozenset({ApplicationStatus.APPLIED, ApplicationStatus.WITHDRAWN}),
    ApplicationStatus.APPLIED: frozenset(
        {
            ApplicationStatus.REVIEWED,
            ApplicationStatus.INTERVIEW,
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
        }
    ),
    ApplicationStatus.REVIEWED: frozenset(
        {
            ApplicationStatus.INTERVIEW,
            ApplicationStatus.OFFERED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
        }
    ),
    ApplicationStatus.INTERVIEW: frozenset(
        {
            ApplicationStatus.OFFERED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
        }
    ),
    ApplicationStatus.OFFERED: frozenset(
        {
            ApplicationStatus.HIRED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN,
        }
    ),
    ApplicationStatus.HIRED: frozenset(),
    ApplicationStatus.REJECTED: frozenset(),
    ApplicationStatus.WITHDRAWN: frozenset(),
}

# Statuses an employer may set through the recruitment pipeline. `saved` is the
# seeker's private bookmark state and `withdrawn` is the seeker's own decision;
# neither is the employer's to write.
EMPLOYER_SETTABLE_STATUSES: frozenset[ApplicationStatus] = frozenset(
    {
        ApplicationStatus.REVIEWED,
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.OFFERED,
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
    }
)


def can_transition(current: ApplicationStatus, target: ApplicationStatus) -> bool:
    """True if an application may move from `current` to `target`.

    Re-setting the status an application already holds is allowed so that a
    retried request is idempotent rather than a 409.
    """
    if current == target:
        return True
    return target in APPLICATION_TRANSITIONS.get(current, frozenset())


def allowed_transitions(current: ApplicationStatus) -> list[str]:
    """Sorted target statuses reachable from `current`, for error messages."""
    return sorted(s.value for s in APPLICATION_TRANSITIONS.get(current, frozenset()))


class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


# ── Users / Auth ──────────────────────────────────────────────────────────────


class User(TimestampedModel):
    """`auth.users` equivalent. Supabase auth provides id; we mirror it."""

    id: str = Field(default_factory=_uid)
    email: EmailStr
    password_hash: str
    role: UserRole
    is_active: bool = True
    last_login_at: datetime | None = None


# ── Seeker profile ────────────────────────────────────────────────────────────


class Skill(BaseModel):
    name: str
    level: Literal["beginner", "intermediate", "advanced", "expert"] = "intermediate"
    years: float = 0.0


class WorkExperience(BaseModel):
    company: str
    title: str
    start_date: str  # YYYY-MM
    end_date: str | None = None  # None = current
    description: str = ""


class Education(BaseModel):
    institution: str
    degree: EducationLevel
    major: str
    graduation_year: int
    ijazah_number: str | None = None
    sivil_verified: VerificationStatus = VerificationStatus.UNVERIFIED


class SeekerProfile(TimestampedModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    full_name: str
    headline: str = ""
    nik: str | None = Field(default=None, max_length=64)
    nik_verified: VerificationStatus = VerificationStatus.UNVERIFIED
    date_of_birth: str | None = None
    region_code: str  # BPS wilayah
    preferred_regions: list[str] = []
    skills: list[Skill] = []
    experience: list[WorkExperience] = []
    education: list[Education] = []
    resume_text: str = ""
    salary_expectation_min: int = 0
    salary_expectation_max: int = 0
    open_to_remote: bool = True
    # Embedding of the seeker's profile (resume + skills + headline)
    embedding: list[float] | None = None
    embedding_model: str | None = None


# ── Employer / Company ────────────────────────────────────────────────────────


COMPANY_SIZES = ("startup", "sme", "mid", "enterprise")

# The employer profile form has always POSTed a human-readable headcount band
# rather than the canonical value, and the router wrote it through `setattr`,
# which skips validation — so the value was stored and then failed to load
# back. Map the known labels instead of silently corrupting the record.
_COMPANY_SIZE_ALIASES: dict[str, str] = {
    "1 - 50 karyawan": "startup",
    "1 - 50 karyawan (startup)": "startup",
    "51 - 200 karyawan": "sme",
    "51 - 200 karyawan (ukm)": "sme",
    "201 - 500 karyawan": "mid",
    "201 - 1000 karyawan": "mid",
    "201 - 1000 karyawan (menengah)": "mid",
    "501 - 1000 karyawan": "mid",
    "1000+ karyawan": "enterprise",
    "1000+ karyawan (enterprise)": "enterprise",
}


def normalize_company_size(value: object) -> object:
    """Map a company-size label or canonical value to the canonical value.

    Anything unrecognised is returned untouched so the field's own validation
    reports it, rather than being quietly coerced to a default.
    """
    if not isinstance(value, str):
        return value
    lowered = value.strip().lower()
    if lowered in COMPANY_SIZES:
        return lowered
    return _COMPANY_SIZE_ALIASES.get(lowered, value)


class Employer(TimestampedModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    company_name: str
    npwp: str | None = None
    industry: str = ""
    size: Literal["startup", "sme", "mid", "enterprise"] = "sme"

    @field_validator("size", mode="before")
    @classmethod
    def _normalize_size(cls, v: object) -> object:
        return normalize_company_size(v)

    region_code: str
    website: str | None = None
    description: str = ""
    verified: VerificationStatus = VerificationStatus.UNVERIFIED


# ── Job posting ───────────────────────────────────────────────────────────────


class JobPosting(TimestampedModel):
    id: str = Field(default_factory=_uid)
    employer_id: str
    title: str
    kbji_code: str = ""
    description: str
    responsibilities: list[str] = []
    required_skills: list[str] = []
    nice_to_have_skills: list[str] = []
    education_min: EducationLevel = EducationLevel.S1
    experience_years_min: int = 0
    region_code: str
    remote_allowed: bool = False
    salary_min: int = 0
    salary_max: int = 0
    is_active: bool = True
    embedding: list[float] | None = None
    embedding_model: str | None = None


# ── Applications ──────────────────────────────────────────────────────────────


class Application(TimestampedModel):
    id: str = Field(default_factory=_uid)
    job_id: str
    seeker_id: str
    status: ApplicationStatus = ApplicationStatus.APPLIED
    cover_letter: str = ""
    match_score: float = 0.0
    note: str = ""


# ── Match results (cached) ────────────────────────────────────────────────────


class MatchResult(BaseModel):
    job_id: str
    seeker_id: str
    score: float  # final reranked score [0..1]
    cosine: float  # raw bi-encoder cosine
    skill_overlap: float
    region_match: bool
    salary_in_range: bool
    rank: int
    band: str = "stretch"  # strong | possible | stretch — the headline, not the number
    explanation: str = ""


class MatchBundle(TimestampedModel):
    """A point-in-time top-K result for a (seeker, query) or (job, query)."""

    id: str = Field(default_factory=_uid)
    subject_kind: Literal["seeker", "job"]
    subject_id: str
    top_k: int
    results: list[MatchResult]
    embedding_model: str


# ── Skill gap & advisor ───────────────────────────────────────────────────────


class CourseRecommendation(BaseModel):
    name: str
    provider: str
    duration: str
    url: str | None = None
    price: str | None = None
    rating: float | None = None
    description: str | None = None
    category: str | None = None


class SkillGapResult(TimestampedModel):
    id: str = Field(default_factory=_uid)
    seeker_id: str
    target_job_id: str | None = None
    missing_skills: list[str]
    matching_skills: list[str]
    gap_severity: Literal["low", "medium", "high"]
    match_percentage: float
    recommended_courses: list[CourseRecommendation]
    estimated_readiness_months: int
    summary: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    ts: datetime = Field(default_factory=_now)


class Course(TimestampedModel):
    """Indonesian online course / bootcamp catalog entry."""

    id: str = Field(default_factory=_uid)
    name: str
    provider: str  # Dicoding | Coursera ID | Prakerja | Hacktiv8 | Purwadhika | RevoU | Binar | MySkill | Skill Academy | ...
    category: (
        str  # "tech", "design", "marketing", "finance", "language", "ops", "healthcare", "agri"
    )
    skills_taught: list[str] = []
    duration: str  # e.g. "1 bulan", "12 minggu"
    cost_idr: int = 0
    is_prakerja: bool = False  # subsidized by Kartu Prakerja
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    url: str | None = None
    description: str = ""


class ChatSession(TimestampedModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    seeker_id: str | None = None
    title: str = ""
    messages: list[ChatMessage] = []


# ── AI observability ──────────────────────────────────────────────────────────


class AIPerformanceLog(TimestampedModel):
    """One row per Gemini call. Admin reviews these in the AI dashboard."""

    id: str = Field(default_factory=_uid)
    request_id: str
    user_id: str | None = None
    role: str  # which prompt role was used
    task: str  # which task file was used
    model: str
    latency_ms: int
    tokens_in: int = 0
    tokens_out: int = 0
    success: bool = True
    error: str | None = None
    flagged: bool = False  # set true when output triggered a guardrail
    rating: Literal["up", "down", None] = None  # user thumbs


# ── Gamification ──────────────────────────────────────────────────────────────


class GamificationStats(TimestampedModel):
    """Per-seeker quest progress. Stored alongside the seeker profile."""

    id: str = Field(default_factory=_uid)
    seeker_id: str
    xp: int = 0
    level: int = 1
    streak_days: int = 0
    badges: list[str] = []  # e.g. ["profile_complete", "first_match", "cv_uploaded"]
    quests_completed: list[str] = []
