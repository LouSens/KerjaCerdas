"""
KerjaCerdas — Employer request schemas
======================================
Typed request bodies for the employer router.

These endpoints used to take a bare ``dict``, so nothing validated a payload
before the handler indexed into it: a wrong type was a 500, an unknown value
for a constrained field (``size``) was written straight through
``setattr`` — which skips Pydantic validation — into the stored record, and
the OpenAPI schema documented the body as "any object".
"""

from __future__ import annotations

from backend.app.api.schemas.common import LenientInt, StrList
from backend.app.db.schemas import COMPANY_SIZES, normalize_company_size
from pydantic import BaseModel, ConfigDict, Field, field_validator


class EmployerProfileUpdate(BaseModel):
    """Partial update of the employer's company profile.

    Every field is optional: only the ones actually present in the request are
    written, which is what the previous ``for k, v in body.items()`` loop did.
    """

    company_name: str | None = Field(default=None, max_length=255)
    npwp: str | None = Field(default=None, max_length=32)
    industry: str | None = Field(default=None, max_length=120)
    size: str | None = None
    region_code: str | None = Field(default=None, max_length=10)
    website: str | None = Field(default=None, max_length=512)
    description: str | None = Field(default=None, max_length=10_000)

    @field_validator("size", mode="before")
    @classmethod
    def _canonical_size(cls, v: object) -> object:
        """Accept the headcount labels the profile form sends, reject the rest.

        The stored model constrains `size` to four values; the old handler
        wrote whatever arrived straight through `setattr`, which bypasses
        validation, so a label was persisted and then failed to load back.
        """
        if v is None:
            return None
        normalized = normalize_company_size(v)
        if normalized not in COMPANY_SIZES:
            raise ValueError(f"size harus salah satu dari: {', '.join(COMPANY_SIZES)}")
        return normalized


class JobCreateRequest(BaseModel):
    """Payload for creating a job posting."""

    title: str = Field(max_length=255)
    description: str = ""
    responsibilities: StrList = []
    required_skills: StrList = []
    nice_to_have_skills: StrList = []
    education_min: str = "S1"
    experience_years_min: LenientInt = 0
    # The client sends either `region_code` or the older `location` key.
    region_code: str | None = Field(default=None, max_length=10)
    location: str | None = Field(default=None, max_length=120)
    work_type: str = "onsite"
    remote_allowed: bool = False
    salary_min: LenientInt = Field(default=0, ge=0)
    salary_max: LenientInt = Field(default=0, ge=0)
    kbji_code: str = Field(default="", max_length=32)


class JobUpdateRequest(BaseModel):
    """Partial update of a job posting.

    Only the fields the employer is allowed to edit are declared, so an
    unknown or non-editable key is ignored exactly as before.
    """

    title: str | None = Field(default=None, max_length=255)
    description: str | None = None
    required_skills: StrList | None = None
    nice_to_have_skills: StrList | None = None
    responsibilities: StrList | None = None
    salary_min: LenientInt | None = Field(default=None, ge=0)
    salary_max: LenientInt | None = Field(default=None, ge=0)
    experience_years_min: LenientInt | None = Field(default=None, ge=0)
    remote_allowed: bool | None = None
    is_active: bool | None = None


class JobPoolEstimateRequest(BaseModel):
    """Live-preview pool estimate while a job is being drafted."""

    required_skills: StrList = []
    location: str = Field(default="", max_length=120)
    salary_min: LenientInt = Field(default=0, ge=0)
    salary_max: LenientInt = Field(default=0, ge=0)


class CandidateFilters(BaseModel):
    """Optional ranking boosts for candidate search.

    The matcher normalises these again on its own — an unusable filter degrades
    the ranking instead of failing the request — but declaring them here means
    a wrong type is reported to the client as a 422 rather than silently
    ignored.
    """

    location: str | None = Field(default=None, max_length=120)
    salary_min: int | None = Field(default=None, ge=0)
    experience_min: int | None = Field(default=None, ge=0)


class CandidateSearchRequest(BaseModel):
    """Payload for reverse-matching candidates against a job."""

    top_k: int = Field(default=15, ge=1, le=100)
    filters: CandidateFilters = Field(default_factory=CandidateFilters)


class UnlockCandidateRequest(BaseModel):
    """Payload for the pay-to-unlock contact endpoint."""

    payment_token: str | None = Field(default=None, max_length=512)


class ApplicationStatusUpdate(BaseModel):
    """Move an application through the recruitment pipeline and/or attach a note.

    Both fields are optional so the endpoint can set a status, a note, or both.
    The status string is validated against the pipeline state machine in the
    handler, which needs the application's current status to decide.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    status: str | None = Field(default=None, max_length=40)
    note: str | None = Field(default=None, max_length=5_000)
