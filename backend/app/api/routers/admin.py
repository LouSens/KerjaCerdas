"""KerjaCerdas — Admin router (temporary seed endpoint).

Protected by X-Admin-Token header matching SEED_DEFAULT_PASSWORD secret.
Remove this router after seeding production.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, Header, HTTPException, status

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_token(x_admin_token: str = Header(...)) -> None:
    expected = os.environ.get("SEED_DEFAULT_PASSWORD", "")
    if not expected or x_admin_token != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("/seed")
async def run_seed(_: None = None, x_admin_token: str = Header(...)) -> dict:
    """Seed the production database with demo employers, jobs, seekers, and courses."""
    _require_token(x_admin_token)

    # Import here to avoid loading heavy deps at module import time
    from backend.scripts.seed_all import seed  # type: ignore[attr-defined]

    await seed(clear=False)
    return {"status": "ok", "message": "Seed complete"}
