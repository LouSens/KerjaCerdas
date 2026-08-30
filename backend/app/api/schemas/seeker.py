"""
KerjaCerdas — Seeker request schemas
====================================
Typed request bodies for the seeker router.

These endpoints used to take a bare ``dict``. That meant a payload whose shape
was merely plausible — ``experience`` sent as a string, ``graduation_year`` as
``"lulus 2020"`` — reached the handler unchecked and either 500'd or was
silently dropped. Declaring the shape moves both cases to a 422 that names the
offending field.
"""

from __future__ import annotations

from typing import Any

from backend.app.api.schemas.common import LenientInt, StrList
from backend.app.db.schemas import EducationLevel, VerificationStatus
from pydantic import BaseModel, Field, field_validator


class SkillInput(BaseModel):
    """A skill, accepted either as a bare string or as a full object."""

    name: str = Field(max_length=120)
    level: str = "intermediate"
    years: float = Field(default=0.0, ge=0)

    @field_validator("level")
    @classmethod
    def _known_level(cls, v: str) -> str:
        allowed = {"beginner", "intermediate", "advanced", "expert"}
        return v if v in allowed else "intermediate"


class ExperienceInput(BaseModel):
    company: str = Field(default="", max_length=255)
    title: str = Field(default="", max_length=255)
    start_date: str = Field(default="", max_length=32)
    end_date: str | None = Field(default=None, max_length=32)
    description: str = Field(default="", max_length=5_000)


class EducationInput(BaseModel):
    """Education entry with the leniency the handler used to apply by hand.

    An unrecognised degree or a non-numeric graduation year falls back to a
    default instead of failing the request: these are matching hints, and a CV
    parser feeding this endpoint should not be able to block a profile save.
    """

    institution: str = Field(default="", max_length=255)
    degree: EducationLevel = EducationLevel.S1
    major: str = Field(default="", max_length=255)
    graduation_year: int = 2024
    ijazah_number: str | None = Field(default=None, max_length=64)
    sivil_verified: VerificationStatus = VerificationStatus.UNVERIFIED

    @field_validator("degree", mode="before")
    @classmethod
    def _degree_or_default(cls, v: Any) -> Any:
        if v is None:
            return EducationLevel.S1
        try:
            return EducationLevel(str(v).upper())
        except ValueError:
            return EducationLevel.S1

    @field_validator("graduation_year", mode="before")
    @classmethod
    def _year_or_default(cls, v: Any) -> Any:
        try:
            return int(v)
        except (TypeError, ValueError):
            return 2024

    @field_validator("sivil_verified", mode="before")
    @classmethod
    def _verification_or_default(cls, v: Any) -> Any:
        if v is None:
            return VerificationStatus.UNVERIFIED
        try:
            return VerificationStatus(str(v).lower())
        except ValueError:
            return VerificationStatus.UNVERIFIED


class SeekerProfileUpsert(BaseModel):
    """Create-or-update payload for the seeker profile.

    Every field is optional so an update can send only what changed; the
    handler distinguishes "not sent" from "sent as empty" via
    ``model_fields_set``.
    """

    full_name: str | None = Field(default=None, max_length=255)
    headline: str | None = Field(default=None, max_length=500)
    region_code: str | None = Field(default=None, max_length=10)
    preferred_regions: StrList | None = None
    salary_expectation_min: LenientInt | None = Field(default=None, ge=0)
    salary_expectation_max: LenientInt | None = Field(default=None, ge=0)
    resume_text: str | None = None
    open_to_remote: bool | None = None
    skills: list[SkillInput] | None = None
    experience: list[ExperienceInput] | None = None
    education: list[EducationInput] | None = None

    @field_validator("skills", mode="before")
    @classmethod
    def _accept_bare_skill_strings(cls, v: Any) -> Any:
        """`["Python"]` and `[{"name": "Python"}]` are both valid inputs."""
        if isinstance(v, list):
            return [{"name": s} if isinstance(s, str) else s for s in v]
        return v


class SaveJobRequest(BaseModel):
    """Bookmark a job."""

    job_id: str = Field(max_length=64)


class ApplyRequest(BaseModel):
    """Apply to a job."""

    job_id: str = Field(max_length=64)
    cover_letter: str = Field(default="", max_length=20_000)


class SkillGapRequest(BaseModel):
    """Run the skill-gap analysis, optionally against a specific job."""

    target_job_id: str | None = Field(default=None, max_length=64)
