"""KerjaCerdas — Admin router (temporary seed endpoint).

Protected by token query param matching SEED_DEFAULT_PASSWORD secret.
Remove this router after seeding production.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, BackgroundTasks, HTTPException, status

router = APIRouter(prefix="/admin", tags=["admin"])

_seed_running = False


async def _run_seed() -> None:
    global _seed_running
    try:
        from backend.scripts.seed_all import seed  # type: ignore[attr-defined]

        await seed(clear=False)
    finally:
        _seed_running = False


@router.get("/seed")
async def trigger_seed(token: str, background_tasks: BackgroundTasks) -> dict:
    """Start seeding in the background. Poll /admin/seed/status to check progress.

    Browser: /api/v1/admin/seed?token=YOUR_PASSWORD
    """
    global _seed_running
    expected = os.environ.get("SEED_DEFAULT_PASSWORD", "")
    if not expected or token != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if _seed_running:
        return {"status": "running", "message": "Seed already in progress"}

    _seed_running = True
    background_tasks.add_task(_run_seed)
    return {
        "status": "started",
        "message": "Seeding started in background — check /api/v1/admin/seed/status",
    }


@router.get("/seed/status")
async def seed_status() -> dict:
    """Check whether the background seed is still running."""
    return {"running": _seed_running}
