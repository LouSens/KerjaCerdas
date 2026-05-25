"""Mock e-KYC + SIVIL diploma verification."""
from __future__ import annotations

import uuid

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.app.api.services.identity_verifier import MockIdentityVerificationService

router = APIRouter(prefix="/verify", tags=["verify"])


# ── Document registry (encrypted file_id surfaced only to the owner) ─────────
# Demo-grade: in production this would query an audit-logged KMS-backed table.

@router.get("/documents")
async def list_documents() -> dict:
    """Return the current user's verified documents with masked file_ids.

    The file_id is masked (`doc_3f8a··········e91c`) and the underlying
    encrypted bytes are *never* returned by the API. UI uses this to render
    the privacy-promise row under each verified card.
    """
    return {
        "encryption": "AES-256-GCM",
        "region": "id-jakarta",
        "compliance": ["UU-PDP-2022", "ISO-27001"],
        "documents": [],  # populated once real verifications land
    }


class EkycReq(BaseModel):
    nik: str = Field(min_length=16, max_length=16)
    full_name: str
    date_of_birth: str = ""
    selfie_image_base64: str | None = None


@router.post("/identity")
async def verify_identity(req: EkycReq) -> dict:
    r = MockIdentityVerificationService.verify_identity(nik=req.nik, full_name=req.full_name)
    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED" if r["is_valid"] else "FAILED",
        "match_percentage": r["match_score"],
        "verification_hash": r.get("verification_hash"),
        "pii_redacted": r.get("pii_redacted", True),
        "message": "Identitas terverifikasi (mode demo)." if r["is_valid"] else "Verifikasi identitas gagal.",
    }


class SivilReq(BaseModel):
    ijazah_number: str
    university_name: str
    major: str


@router.post("/education")
async def verify_education(req: SivilReq) -> dict:
    ok = bool(req.ijazah_number) and req.ijazah_number != "0000"
    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED" if ok else "NOT_FOUND",
        "message": "Ijazah terverifikasi di SIVIL." if ok else "Ijazah tidak ditemukan.",
        "verified_data": {
            "university": req.university_name, "major": req.major,
            "graduation_year": "2023", "degree": "S1", "status": "Lulus",
        } if ok else None,
    }


class NpwpReq(BaseModel):
    npwp: str
    company_name: str = ""


@router.post("/npwp")
async def verify_npwp(req: NpwpReq) -> dict:
    """Mock DJP Online NPWP verification for employers."""
    # Valid NPWP: exactly 15 numeric digits (after stripping dots/dashes)
    clean = req.npwp.replace(".", "").replace("-", "")
    ok = len(clean) == 15 and clean.isdigit() and clean != "000000000000000"
    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED" if ok else "NOT_FOUND",
        "message": "NPWP terverifikasi di DJP Online (mode demo)." if ok else "NPWP tidak ditemukan.",
        "verified_data": {
            "npwp": req.npwp,
            "company_name": req.company_name or "Perusahaan",
            "status": "AKTIF",
            "valid_until": "2027-12-31",
        } if ok else None,
    }

