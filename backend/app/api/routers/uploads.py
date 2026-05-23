"""PDF upload endpoints — CV (seeker) and Job-Pack (employer).

Files are parsed by Gemini and merged into the user's profile / posting list.
"""
from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from backend.app.db.json_store import get_repositories
from backend.app.db.schemas import (
    Education,
    EducationLevel,
    JobPosting,
    SeekerProfile,
    Skill,
    WorkExperience,
)
from backend.app.ml.matcher import SemanticMatcher
from backend.app.services.pdf_parser import parse_cv, parse_job_pack

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
async def upload_cv(user_id: str = Form(...), file: UploadFile = File(...)) -> dict:
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(400, "Only PDF accepted")
    blob = await file.read()
    if len(blob) > MAX_PDF_BYTES:
        raise HTTPException(413, f"PDF too large (>{MAX_PDF_BYTES // (1024*1024)} MB)")

    parsed = await parse_cv(blob)
    repos = get_repositories()

    # Find or create a seeker profile for this user.
    existing = await repos.seekers.find(lambda s: s.user_id == user_id)
    seeker = existing[0] if existing else SeekerProfile(
        user_id=user_id, full_name=parsed.get("full_name", "Pengguna"),
        region_code=parsed.get("region_code") or "3171",
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
    user_id: str = Form(...),
    file: UploadFile = File(...),
) -> dict:
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(400, "Only PDF accepted")
    blob = await file.read()
    if len(blob) > MAX_PDF_BYTES:
        raise HTTPException(413, "PDF too large")

    parsed = await parse_job_pack(blob)
    postings = parsed.get("postings", [])
    repos = get_repositories()

    # Resolve the employer for this user.
    employer_match = await repos.employers.find(lambda e: e.user_id == user_id)
    if not employer_match:
        raise HTTPException(400, "No employer profile for this user")
    employer = employer_match[0]

    matcher = SemanticMatcher()
    created: list[str] = []
    for p in postings:
        raw_edu = (p.get("education_min") or "S1").upper()
        try:
            edu = EducationLevel(raw_edu)
        except ValueError:
            edu = EducationLevel.S1
        job = JobPosting(
            employer_id=employer.id,
            title=p.get("title", "Untitled"),
            description=p.get("description", ""),
            responsibilities=p.get("responsibilities", []),
            required_skills=p.get("required_skills", []),
            nice_to_have_skills=p.get("nice_to_have_skills", []),
            education_min=edu,
            experience_years_min=int(p.get("experience_years_min") or 0),
            region_code=p.get("region_code") or employer.region_code,
            remote_allowed=bool(p.get("remote_allowed", False)),
            salary_min=int(p.get("salary_min") or 0),
            salary_max=int(p.get("salary_max") or 0),
            kbji_code=p.get("kbji_code", ""),
        )
        await matcher.embed_job(job)
        await repos.jobs.upsert(job)
        created.append(job.id)

    return {
        "employer_id": employer.id,
        "created_job_ids": created,
        "parsed_offline": any(p.get("_offline") for p in postings),
    }
