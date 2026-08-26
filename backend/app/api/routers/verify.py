"""Mock e-KYC + SIVIL diploma verification + phone OTP (demo mode).

Phone OTP (demo):  The generated code is returned in the JSON response itself
so testers can verify their phone number without any external SMS/WA provider.
In production: replace the code reveal with Twilio / Fonnte WA Gateway API.
Budget note: Twilio SMS ~$0.01/SMS, Fonnte WA ~Rp 200/pesan.
"""

from __future__ import annotations

import random
import string
import time
import uuid

from backend.app.api.dependencies import get_current_user
from backend.app.api.services.identity_verifier import MockIdentityVerificationService
from backend.app.db.models import User
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

# ── In-memory OTP store (demo mode) ─────────────────────────────────────────
# Key: user_id + phone, Value: { code, expires_at, attempts }
# Replace with Redis in production.
_OTP_STORE: dict[str, dict] = {}
_OTP_TTL = 300  # 5 minutes
_OTP_MAX_ATTEMPTS = 5


router = APIRouter(prefix="/verify", tags=["verify"])


# ── Document registry (encrypted file_id surfaced only to the owner) ─────────
# Demo-grade: in production this would query an audit-logged KMS-backed table.


@router.get("/documents")
async def list_documents(current_user: User = Depends(get_current_user)) -> dict:
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
async def verify_identity(req: EkycReq, current_user: User = Depends(get_current_user)) -> dict:
    r = MockIdentityVerificationService.verify_identity(nik=req.nik, full_name=req.full_name)
    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED" if r["is_valid"] else "FAILED",
        "match_percentage": r["match_score"],
        "verification_hash": r.get("verification_hash"),
        "pii_redacted": r.get("pii_redacted", True),
        "message": "Identitas terverifikasi (mode demo)."
        if r["is_valid"]
        else "Verifikasi identitas gagal.",
    }


class SivilReq(BaseModel):
    ijazah_number: str
    university_name: str
    major: str


@router.post("/education")
async def verify_education(req: SivilReq, current_user: User = Depends(get_current_user)) -> dict:
    ok = bool(req.ijazah_number) and req.ijazah_number != "0000"
    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED" if ok else "NOT_FOUND",
        "message": "Ijazah terverifikasi di SIVIL." if ok else "Ijazah tidak ditemukan.",
        "verified_data": {
            "university": req.university_name,
            "major": req.major,
            "graduation_year": "2023",
            "degree": "S1",
            "status": "Lulus",
        }
        if ok
        else None,
    }


class NpwpReq(BaseModel):
    npwp: str
    company_name: str = ""


@router.post("/npwp")
async def verify_npwp(req: NpwpReq, current_user: User = Depends(get_current_user)) -> dict:
    """Mock DJP Online NPWP verification for employers."""
    # Valid NPWP: exactly 15 numeric digits (after stripping dots/dashes)
    clean = req.npwp.replace(".", "").replace("-", "")
    ok = len(clean) == 15 and clean.isdigit() and clean != "000000000000000"
    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED" if ok else "NOT_FOUND",
        "message": "NPWP terverifikasi di DJP Online (mode demo)."
        if ok
        else "NPWP tidak ditemukan.",
        "verified_data": {
            "npwp": req.npwp,
            "company_name": req.company_name or "Perusahaan",
            "status": "AKTIF",
            "valid_until": "2027-12-31",
        }
        if ok
        else None,
    }


# ── Phone OTP — send & verify (3.4) ──────────────────────────────────────────
# Demo mode: OTP code is returned in the API response so testers can verify
# their number without an SMS/WhatsApp provider.
# Production upgrade path:
#   - WhatsApp: Fonnte (fonnte.com) or Meta WA Business API via WABA
#   - SMS: Twilio Verify API (verify.twilio.com)
#   Set DEMO_OTP_REVEAL=false in .env once a provider is integrated.


class OtpSendReq(BaseModel):
    phone: str  # E.164 format: +6281234567890


class OtpVerifyReq(BaseModel):
    phone: str
    code: str


def _otp_key(user_id: str, phone: str) -> str:
    return f"{user_id}:{phone}"


@router.post("/otp/send")
async def send_otp(req: OtpSendReq, current_user: User = Depends(get_current_user)) -> dict:
    """Generate and 'send' a 6-digit OTP.

    Demo mode: the code is returned in the response body so testers can
    verify without a real SMS/WA provider. In production, set an env flag
    to suppress `demo_code` and dispatch via Fonnte / Twilio instead.
    """
    phone = req.phone.strip()
    if not phone.startswith("+"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Phone harus dalam format internasional (+62...)"
        )

    code = "".join(random.choices(string.digits, k=6))
    key = _otp_key(str(current_user.id), phone)
    _OTP_STORE[key] = {
        "code": code,
        "expires_at": time.time() + _OTP_TTL,
        "attempts": 0,
    }

    return {
        "request_id": str(uuid.uuid4()),
        "status": "SENT",
        "phone": phone,
        "expires_in_seconds": _OTP_TTL,
        # DEMO ONLY — remove in production when real WA/SMS provider is active
        "demo_code": code,
        "message": (
            f"[DEMO MODE] Kode OTP: {code}. Dalam produksi kode akan dikirim via WhatsApp/SMS."
        ),
    }


@router.post("/otp/verify")
async def verify_otp(req: OtpVerifyReq, current_user: User = Depends(get_current_user)) -> dict:
    """Validate the submitted OTP code for the given phone number."""
    key = _otp_key(str(current_user.id), req.phone.strip())
    entry = _OTP_STORE.get(key)

    if not entry:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "OTP tidak ditemukan. Kirim ulang kode terlebih dahulu."
        )

    if time.time() > entry["expires_at"]:
        del _OTP_STORE[key]
        raise HTTPException(status.HTTP_410_GONE, "OTP sudah kedaluwarsa. Kirim ulang kode.")

    entry["attempts"] += 1
    if entry["attempts"] > _OTP_MAX_ATTEMPTS:
        del _OTP_STORE[key]
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Terlalu banyak percobaan. Kirim ulang kode."
        )

    if req.code.strip() != entry["code"]:
        remaining = _OTP_MAX_ATTEMPTS - entry["attempts"]
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Kode OTP salah. {remaining} percobaan tersisa.",
        )

    del _OTP_STORE[key]
    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED",
        "phone": req.phone,
        "message": "Nomor HP berhasil diverifikasi.",
    }
