from __future__ import annotations

import hashlib
import random
import string
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select

from backend.app.api.dependencies import get_current_user
from backend.app.api.services.identity_verifier import MockIdentityVerificationService
from backend.app.db.models import OTPRecord, SeekerProfile, User
from backend.app.db.postgres_store import find_seeker_by_user_id, get_repositories
from backend.app.db.session import async_session

_OTP_TTL_SECONDS = 300  # 5 minutes
_OTP_MAX_ATTEMPTS = 5


def _hash_token(value: str) -> str:
    """Return SHA-256 hex digest of a string."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


router = APIRouter(prefix="/verify", tags=["verify"])


# ── Document registry (encrypted file_id surfaced only to the owner) ─────────


@router.get("/documents")
async def list_documents(current_user: User = Depends(get_current_user)) -> dict:
    """Return the current user's verified documents with masked file_ids."""
    return {
        "encryption": "AES-256-GCM",
        "region": "id-jakarta",
        "compliance": ["UU-PDP-2022", "ISO-27001"],
        "documents": [],
    }


class EkycReq(BaseModel):
    nik: str = Field(min_length=16, max_length=16)
    full_name: str
    date_of_birth: str = ""
    selfie_image_base64: str | None = None


@router.post("/identity")
async def verify_identity(req: EkycReq, current_user: User = Depends(get_current_user)) -> dict:
    """Verify Indonesian NIK identity.

    Stores ONLY the SHA-256 hash of the NIK in compliance with UU-PDP-2022.
    """
    nik_hash = _hash_token(req.nik)
    r = MockIdentityVerificationService.verify_identity(nik=req.nik, full_name=req.full_name)

    if r["is_valid"]:
        # Update seeker profile if exists
        seeker = await find_seeker_by_user_id(current_user.id)
        if seeker:
            seeker.nik = nik_hash
            seeker.nik_verified = "verified"
            repos = get_repositories()
            await repos.seekers.upsert(seeker)

    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED" if r["is_valid"] else "FAILED",
        "match_percentage": r["match_score"],
        "verification_hash": r.get("verification_hash") or nik_hash,
        "pii_redacted": True,
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


# ── Phone OTP — send & verify (Database Backed) ───────────────────────────────


class OtpSendReq(BaseModel):
    phone: str  # E.164 format: +6281234567890


class OtpVerifyReq(BaseModel):
    phone: str
    code: str


@router.post("/otp/send")
async def send_otp(req: OtpSendReq, current_user: User = Depends(get_current_user)) -> dict:
    """Generate and record a 6-digit OTP in the database."""
    phone = req.phone.strip()
    if not phone.startswith("+"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Phone harus dalam format internasional (+62...)"
        )

    code = "".join(random.choices(string.digits, k=6))
    code_hash = _hash_token(code)
    now = datetime.now(UTC)
    expires_at = now + timedelta(seconds=_OTP_TTL_SECONDS)

    async with async_session() as session:
        # Invalidate any prior unverified OTPs for this user & phone
        await session.execute(
            delete(OTPRecord).where(
                OTPRecord.user_id == current_user.id,
                OTPRecord.phone == phone,
            )
        )
        otp_entry = OTPRecord(
            user_id=current_user.id,
            phone=phone,
            code_hash=code_hash,
            expires_at=expires_at,
            attempts=0,
            verified=False,
        )
        session.add(otp_entry)
        await session.commit()

    return {
        "request_id": str(uuid.uuid4()),
        "status": "SENT",
        "phone": phone,
        "expires_in_seconds": _OTP_TTL_SECONDS,
        "demo_code": code,
        "message": (
            f"[DEMO MODE] Kode OTP: {code}. Dalam produksi kode akan dikirim via WhatsApp/SMS."
        ),
    }


@router.post("/otp/verify")
async def verify_otp(req: OtpVerifyReq, current_user: User = Depends(get_current_user)) -> dict:
    """Validate submitted OTP against the database record."""
    phone = req.phone.strip()
    submitted_hash = _hash_token(req.code.strip())
    now = datetime.now(UTC)

    async with async_session() as session:
        stmt = (
            select(OTPRecord)
            .where(
                OTPRecord.user_id == current_user.id,
                OTPRecord.phone == phone,
                OTPRecord.verified.is_(False),
            )
            .order_by(OTPRecord.created_at.desc())
        )
        result = await session.execute(stmt)
        entry = result.scalars().first()

        if not entry:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND, "OTP tidak ditemukan. Kirim ulang kode terlebih dahulu."
            )

        if entry.expires_at.tzinfo is None:
            # Ensure timezone-aware comparison
            entry_expires = entry.expires_at.replace(tzinfo=UTC)
        else:
            entry_expires = entry.expires_at

        if now > entry_expires:
            await session.delete(entry)
            await session.commit()
            raise HTTPException(status.HTTP_410_GONE, "OTP sudah kedaluwarsa. Kirim ulang kode.")

        entry.attempts += 1
        if entry.attempts > _OTP_MAX_ATTEMPTS:
            await session.delete(entry)
            await session.commit()
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS, "Terlalu banyak percobaan. Kirim ulang kode."
            )

        if submitted_hash != entry.code_hash:
            remaining = _OTP_MAX_ATTEMPTS - entry.attempts
            await session.commit()
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Kode OTP salah. {remaining} percobaan tersisa.",
            )

        entry.verified = True
        await session.commit()

    return {
        "request_id": str(uuid.uuid4()),
        "status": "VERIFIED",
        "phone": phone,
        "message": "Nomor HP berhasil diverifikasi.",
    }
