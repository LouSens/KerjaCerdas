"""PDF upload endpoints — CV (seeker) and Job-Pack (employer).

Files are parsed by Gemini and merged into the user's profile / posting list.
"""

from __future__ import annotations

import hashlib

from backend.app.api.dependencies import require_employer, require_seeker
from backend.app.db.models import User
from backend.app.db.postgres_store import (
    find_employer_by_user_id,
    find_seeker_by_user_id,
    get_cached_job_pack_parse,
    get_repositories,
    save_job_pack_parse,
)
from backend.app.db.schemas import (
    Education,
    EducationLevel,
    SeekerProfile,
    Skill,
    WorkExperience,
)
from backend.app.services.matching.evidence import carry_proof
from backend.app.services.matching.matcher import SemanticMatcher
from backend.app.services.pdf_parser import ScannedPdfError, parse_cv, parse_job_pack
from backend.app.services.storage import put_object, storage_configured
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

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
    # An unparsed degree must not become a bachelor's — that is a credential
    # the CV never claimed. SMA is the floor, so it can satisfy a job that
    # states no requirement and can never clear a real bar unearned.
    raw = (d.get("degree") or "SMA").upper()
    try:
        deg = EducationLevel(raw)
    except ValueError:
        deg = EducationLevel.SMA
    return Education(
        institution=d.get("institution", ""),
        degree=deg,
        major=d.get("major", ""),
        graduation_year=int(d.get("graduation_year") or 2024),
    )


@router.post("/cv")
async def upload_cv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    confirm_offline: bool = Form(False),
    confirm_scanned: bool = Form(False),
    current_user: User = Depends(require_seeker),
) -> dict:
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(400, "Only PDF accepted")
    blob = await file.read()
    if len(blob) > MAX_PDF_BYTES:
        raise HTTPException(413, f"PDF too large (>{MAX_PDF_BYTES // (1024 * 1024)} MB)")
    if not blob.startswith(b"%PDF-"):
        raise HTTPException(400, "Invalid PDF file: Missing %PDF- header signature")

    try:
        parsed = await parse_cv(blob, allow_scanned=confirm_scanned)
    except ScannedPdfError as exc:
        return {
            "requires_scan_consent": True,
            "message": str(exc),
            "alternative": "Atau isi profil singkat secara manual tanpa mengunggah CV.",
        }

    if parsed.get("_offline") and not confirm_offline:
        return {
            "requires_confirmation": True,
            "parsed_offline": True,
            "preview": {
                "full_name": parsed.get("full_name", ""),
                "headline": parsed.get("headline", ""),
                "skills": [s.get("name", "") for s in parsed.get("skills", []) if s.get("name")],
                "resume_text": parsed.get("resume_text", ""),
            },
        }

    repos = get_repositories()

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
    seeker.skills = carry_proof(
        [_to_skill(s) for s in parsed.get("skills", []) if s.get("name")], seeker.skills
    )
    seeker.experience = [_to_experience(x) for x in parsed.get("experience", [])]
    seeker.education = [_to_education(e) for e in parsed.get("education", [])]
    seeker.resume_text = parsed.get("resume_text", "")
    seeker.salary_expectation_min = int(parsed.get("salary_expectation_min") or 0)
    seeker.salary_expectation_max = int(parsed.get("salary_expectation_max") or 0)

    # Save immediately without embedding so the response is fast and reliable
    await repos.seekers.upsert(seeker)

    # Queue embedding in the background to avoid blocking the client
    async def _embed_and_save(p: SeekerProfile) -> None:
        try:
            from backend.app.db.postgres_store import update_seeker_embedding
            matcher = SemanticMatcher()
            await matcher.embed_seeker(p)
            if p.embedding:
                await update_seeker_embedding(p.id, p.embedding, p.embedding_model)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Background embed failed for seeker %s: %s", p.id, exc)

    background_tasks.add_task(_embed_and_save, seeker)

    return {
        "seeker_id": seeker.id,
        "parsed_offline": parsed.get("_offline", False),
        "summary": {
            "skills_count": len(seeker.skills),
            "experience_count": len(seeker.experience),
            "education_count": len(seeker.education),
        },
    }


def job_pack_object_key(employer_id: str, file_hash: str) -> str:
    return f"job-packs/{employer_id}/{file_hash}.pdf"


@router.post("/job-pack")
async def upload_job_pack(
    background_tasks: BackgroundTasks,
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

    # Resolve the employer profile for the authenticated user using fast SQL finder
    employer = await find_employer_by_user_id(current_user.id)
    if not employer:
        raise HTTPException(400, "No employer profile for this user")

    # Retrying an upload of the identical PDF — a lost response, a reloaded
    # tab, a different browser or device — must return the exact same
    # parsed postings as the first attempt. Gemini extraction isn't
    # perfectly deterministic even at low temperature, so a second parse of
    # the same bytes can reword a title or reformat a salary just enough to
    # change JobPackUploader's client_ref, which the backend then treats as
    # a brand-new posting instead of a replay. Caching the parse itself by
    # file content (not just deduping the eventual publish) is what makes
    # this safe regardless of client-side state — see JobPackParseCache's
    # docstring in models.py.
    file_hash = hashlib.sha256(blob).hexdigest()
    cache_key = hashlib.sha256(f"{employer.id}:{file_hash}".encode()).hexdigest()
    cached = await get_cached_job_pack_parse(cache_key)
    if cached is not None:
        cached_offline = any(
            "[offline-stub]" in (job.get("description") or "")
            for job in cached
        )
        return {"employer_id": employer.id, "jobs": cached, "parsed_offline": cached_offline}

    try:
        parsed = await parse_job_pack(blob)
    except ScannedPdfError as exc:
        # An employer's scanned job pack has the same problem as a scanned CV,
        # but not the same answer: a job pack contains the employer's own text,
        # not a candidate's personal data, and the employer can simply retype or
        # paste it. So this is a plain 422 rather than a consent handshake.
        # Before this it fell through to _offline_stub and returned a FABRICATED
        # posting, which the cache then stored as a real parse.
        raise HTTPException(
            422,
            detail={
                "error": "scanned_pdf",
                "message": str(exc),
                "hint": "Ketik atau tempel deskripsi lowongan langsung di form Pasang Lowongan.",
            },
        ) from exc
    postings = parsed.get("postings", [])

    # Nothing is written to the JOBS table here — a PDF can extract postings
    # the employer never meant to publish, and every row this endpoint used
    # to create had to be tracked and cleaned up client-side if the batch was
    # abandoned before confirmation (replaced, tab closed mid-upload, etc.).
    # Returning plain parsed data instead removes that whole failure class:
    # POST /employer/jobs (called once per reviewed posting on confirm) is
    # the only place a job-pack posting is actually persisted as a vacancy.
    # (The parse result itself IS persisted, to job_pack_parse_cache above —
    # that's a content-addressed cache keyed by file hash, not a draft job.)
    normalized_jobs: list[dict] = []
    for idx, p in enumerate(postings):
        raw_edu = (p.get("education_min") or "SMA").upper()
        try:
            edu = EducationLevel(raw_edu)
        except ValueError:
            edu = EducationLevel.SMA
        title = p.get("title") or "Untitled"
        required_skills = p.get("required_skills") or []
        region_code = p.get("region_code") or employer.region_code
        remote_allowed = bool(p.get("remote_allowed", False))
        skills_summary = f"{len(required_skills)} skill wajib" if required_skills else "Persyaratan umum"
        loc_summary = "Remote" if remote_allowed else (region_code or "Indonesia")
        normalized_jobs.append({
            # Tied to the file's own hash (not just a bare array index) so
            # the id is traceable to its source parse even outside the
            # cache row; stability across retries comes from the cache
            # above, not from this format.
            "local_id": f"{file_hash[:16]}-{idx}",
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

    await save_job_pack_parse(cache_key, employer.id, normalized_jobs)

    # Archive the source PDF (content-addressed, so a re-upload overwrites the
    # same object). Only job packs: they are the employer's own text. CVs are
    # NOT archived — the raw PDF would keep the NIK/phone/email that
    # services/privacy/redact.py strips before anything else is stored.
    if storage_configured():
        background_tasks.add_task(
            put_object, job_pack_object_key(employer.id, file_hash), blob, "application/pdf"
        )

    return {
        "employer_id": employer.id,
        "jobs": normalized_jobs,
        "parsed_offline": any(p.get("_offline") for p in postings),
    }
