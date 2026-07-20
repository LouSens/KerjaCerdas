"""Analytics event tracking endpoint.

POST /api/v1/events/track
  Records any user interaction event (job_viewed, apply_clicked, band_clicked,
  skill_gap_opened, course_clicked, unlock_triggered, etc.) for product analytics,
  A/B test measurement, and the closed-loop feedback data moat.

Designed to be fire-and-forget from the frontend: if the write fails silently
the UX is never interrupted. No PII is stored — only UUID user_id references.
"""

from __future__ import annotations

import logging

from backend.app.api.dependencies import get_current_user_optional
from backend.app.db.models import Event
from backend.app.db.session import async_session
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/events", tags=["events"])
logger = logging.getLogger(__name__)


class TrackEventRequest(BaseModel):
    event_type: str  # job_viewed | apply_clicked | band_clicked | ...
    job_id: str | None = None
    band: str | None = None  # strong | possible | stretch
    ab_variant: str | None = None  # which A/B variant was active
    session_id: str = ""
    payload: dict | None = None  # arbitrary extra context


@router.post("/track", status_code=202)
async def track_event(
    body: TrackEventRequest,
    current_user=Depends(get_current_user_optional),
):
    """Record a user interaction event. Returns 202 immediately; write is best-effort.

    Frontend should call this fire-and-forget — a failure here must never
    break the UI. The endpoint returns 202 (Accepted) to make that contract
    explicit to callers.
    """
    try:
        async with async_session() as session:
            event = Event(
                user_id=current_user.id if current_user else None,
                session_id=body.session_id or "",
                event_type=body.event_type,
                job_id=body.job_id,
                band=body.band,
                ab_variant=body.ab_variant,
                payload=body.payload or {},
            )
            session.add(event)
            await session.commit()
    except Exception as exc:  # noqa: BLE001
        # Silent failure — analytics loss is preferable to a broken user action.
        logger.warning("event_track_failed type=%s err=%s", body.event_type, exc)

    return {"ok": True, "event_type": body.event_type}
