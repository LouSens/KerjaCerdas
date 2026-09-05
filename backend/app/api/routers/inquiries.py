"""KerjaCerdas — Partnership Inquiries Router.

Endpoints for handling partnership, university integration, training partner,
and enterprise recruiting inquiries.
"""

from __future__ import annotations

import logging
from typing import Any

from backend.app.api.dependencies import get_current_user, get_current_user_optional
from backend.app.db.models import PartnershipInquiry
from backend.app.db.session import async_session
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import desc, select

router = APIRouter(prefix="/inquiries", tags=["inquiries"])
logger = logging.getLogger(__name__)


class CreateInquiryRequest(BaseModel):
    category: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    organization: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    message: str = Field("", max_length=3000)


class UpdateInquiryStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(pending|contacted|reviewed|closed)$")
    notes: str | None = None


class InquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    name: str
    organization: str
    email: str
    message: str
    status: str
    notes: str
    created_at: Any


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict[str, Any])
async def create_inquiry(
    body: CreateInquiryRequest,
    current_user=Depends(get_current_user_optional),
) -> dict[str, Any]:
    """Submit a partnership / enterprise contact request from public landing or about pages."""
    try:
        async with async_session() as session:
            inquiry = PartnershipInquiry(
                category=body.category.strip(),
                name=body.name.strip(),
                organization=body.organization.strip(),
                email=str(body.email).strip().lower(),
                message=body.message.strip(),
                status="pending",
                notes="",
            )
            session.add(inquiry)
            await session.commit()
            await session.refresh(inquiry)

            logger.info(
                "Partnership inquiry received id=%s org='%s' email='%s' category='%s'",
                inquiry.id,
                inquiry.organization,
                inquiry.email,
                inquiry.category,
            )

            return {
                "ok": True,
                "id": inquiry.id,
                "message": "Permohonan kemitraan berhasil dikirim. Tim kami akan menghubungi Anda.",
            }
    except Exception as exc:
        logger.error("Failed to save partnership inquiry: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal menyimpan permohonan kemitraan. Silakan coba kembali.",
        ) from exc


@router.get("", response_model=list[InquiryResponse])
async def list_inquiries(
    category: str | None = None,
    status_filter: str | None = None,
    current_user=Depends(get_current_user),
) -> list[PartnershipInquiry]:
    """List all inquiries."""
    async with async_session() as session:
        query = select(PartnershipInquiry).order_by(desc(PartnershipInquiry.created_at))
        if category:
            query = query.where(PartnershipInquiry.category == category)
        if status_filter:
            query = query.where(PartnershipInquiry.status == status_filter)

        result = await session.execute(query)
        return list(result.scalars().all())


@router.patch("/{inquiry_id}", response_model=dict[str, Any])
async def update_inquiry_status(
    inquiry_id: str,
    body: UpdateInquiryStatusRequest,
    current_user=Depends(get_current_user),
) -> dict[str, Any]:
    """Update status or notes of an inquiry."""
    async with async_session() as session:
        result = await session.execute(
            select(PartnershipInquiry).where(PartnershipInquiry.id == inquiry_id)
        )
        inquiry = result.scalar_one_or_none()
        if not inquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry tidak ditemukan"
            )

        inquiry.status = body.status
        if body.notes is not None:
            inquiry.notes = body.notes

        await session.commit()
        return {"ok": True, "id": inquiry.id, "status": inquiry.status}
