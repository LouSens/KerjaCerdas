"""PDF upload endpoints — CV (seeker) and Job-Pack (employer).

Files are parsed by Gemini and merged into the user's profile / posting list.
"""

from __future__ import annotations

from backend.app.api.dependencies import require_employer, require_seeker
from backend.app.db.models import User
from backend.app.db.postgres_store import (
    find_employer_by_user_id,
    find_seeker_by_user_id,
    get_repositories,
)
from backend.app.db.schemas import (
    Education,
    EducationLevel,
    SeekerProfile,
    Skill,
    WorkExperience,
)
from backend.app.services.matching.matcher import SemanticMatcher
from backend.app.services.pdf_parser import parse_cv, parse_job_pack
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

router = APIRouter(prefix="/uploads", tags=["uploads"])

MAX_PDF_BYTES = 10 * 1024 * 1024  # 10 MB


def _to_skill(d: dict) -> Skill:
    return Skill(
        name=d.get("name", "").strip(),
        level=d.get("level", "intermediate"),
        years=float(d.get("years", 0) or 0),
    )


def _to_experience(d: dict) -> WorkExperience:
    return WorkExperience(
        company=d.get("company", ""),
        title=d.get("title", ""),
        start_date=d.get("start_date", "2024-01"),
        end_date=d.get("end_date"),
        description=d.get("description", ""),
    )


def _to_education(d: dict) -> Education:
    raw = (d.get("degree") or "S1").upper()
    try:
        deg = EducationLevel(raw)
    except ValueError:
        deg = EducationLevel.S1
    return Education(
        institution=d.get("institution", ""),
        degree=deg,
        major=d.get("major", ""),
        graduation_year=int(d.get("graduation_year") or 2024),
    )


@router.post("/cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_seeker),
) -> dict:
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(400, "Only PDF accepted")
    blob = await file.read()
    if len(blob) > MAX_PDF_BYTES:
        raise HTTPException(413, f"PDF too large (>{MAX_PDF_BYTES // (1024 * 1024)} MB)")
    if not blob.startswith(b"%PDF-"):
        raise HTTPException(400, "Invalid PDF file: Missing %PDF- header signature")

    parsed = await parse_cv(blob)
    if parsed.get("_offline"):
        raise HTTPException(503, "Parser AI sedang tidak tersedia. Coba lagi nanti.")
    repos = get_repositories()

    # Find or create a seeker profile for the authenticated user using fast SQL finder
    user_id = current_user.id
    existing = await find_seeker_by_user_id(user_id)
    seeker = (
        existing
        if existing
        else SeekerProfile(
            user_id=user_id,
            full_name=parsed.get("full_name", "Pengguna"),
            region_code=parsed.get("region_code") or "3171",
        )
    )

    seeker.full_name = parsed.get("full_name") or seeker.full_name
    seeker.headline = parsed.get("headline", seeker.headline)
    if parsed.get("region_code"):
        seeker.region_code = parsed["region_code"]
    seeker.skills = [_to_skill(s) for s in parsed.get("skills", []) if s.get("name")]
    seeker.experience = [_to_experience(x) for x in parsed.get("experience", [])]
    seeker.education = [_to_education(e) for e in parsed.get("education", [])]
    seeker.resume_text = parsed.get("resume_text", "")
    seeker.salary_expectation_min = int(parsed.get("salary_expectation_min") or 0)
    seeker.salary_expectation_max = int(parsed.get("salary_expectation_max") or 0)

    matcher = SemanticMatcher()
    await matcher.embed_seeker(seeker)
    await repos.seekers.upsert(seeker)

    return {
        "seeker_id": seeker.id,
        "parsed_offline": parsed.get("_offline", False),
        "summary": {
            "skills_count": len(seeker.skills),
            "experience_count": len(seeker.experience),
            "education_count": len(seeker.education),
        },
    }


@router.post("/job-pack")
async def upload_job_pack(
    file: UploadFile = File(...),
    current_user: User = Depends(require_employer),
) -> dict:
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(400, "Only PDF accepted")
    blob = await file.read()
    if len(blob) > MAX_PDF_BYTES:
        raise HTTPException(413, "PDF too large")
    if not blob.startswith(b"%PDF-"):
        raise HTTPException(400, "Invalid PDF file: Missing %PDF- header signature")

    parsed = await parse_job_pack(blob)
    postings = parsed.get("postings", [])
    if parsed.get("_offline") or any(p.get("_offline") for p in postings):
        raise HTTPException(503, "Parser AI sedang tidak tersedia. Coba lagi nanti.")

    # Resolve the employer profile for the authenticated user using fast SQL finder
    employer = await find_employer_by_user_id(current_user.id)
    if not employer:
        raise HTTPException(400, "No employer profile for this user")

    # Nothing is written to the database here — a PDF can extract postings
    # the employer never meant to publish, and every row this endpoint used
    # to create had to be tracked and cleaned up client-side if the batch was
    # abandoned before confirmation (replaced, tab closed mid-upload, etc.).
    # Returning plain parsed data instead removes that whole failure class:
    # POST /employer/jobs (called once per reviewed posting on confirm) is
    # the only place a job-pack posting is actually persisted.
    normalized_jobs: list[dict] = []
    for idx, p in enumerate(postings):
        raw_edu = (p.get("education_min") or "S1").upper()
        try:
            edu = EducationLevel(raw_edu)
        except ValueError:
            edu = EducationLevel.S1
        title = p.get("title") or "Untitled"
        required_skills = p.get("required_skills") or []
        region_code = p.get("region_code") or employer.region_code
        remote_allowed = bool(p.get("remote_allowed", False))
        skills_summary = f"{len(required_skills)} skill wajib" if required_skills else "Persyaratan umum"
        loc_summary = "Remote" if remote_allowed else (region_code or "Indonesia")
        normalized_jobs.append({
            # Client-local id for list rendering only — not a database id,
            # since nothing has been persisted yet.
            "local_id": f"parsed-{idx}",
            "title": title,
            "details": f"{loc_summary} · {skills_summary}",
            "valid": True,
            "description": p.get("description") or "",
            "responsibilities": p.get("responsibilities") or [],
            "required_skills": required_skills,
            "nice_to_have_skills": p.get("nice_to_have_skills") or [],
            "education_min": edu.value,
            "experience_years_min": int(p.get("experience_years_min") or 0),
            "region_code": region_code,
            "location": region_code,
            "remote_allowed": remote_allowed,
            "salary_min": int(p.get("salary_min") or 0),
            "salary_max": int(p.get("salary_max") or 0),
            "kbji_code": p.get("kbji_code") or "",
        })

    return {
        "employer_id": employer.id,
        "jobs": normalized_jobs,
        "parsed_offline": any(p.get("_offline") for p in postings),
    }
