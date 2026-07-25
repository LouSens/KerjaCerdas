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


_reembed_state: dict = {"running": False, "done": False, "error": None}


async def _run_reembed() -> None:
    try:
        from backend.scripts.reembed import reembed

        await reembed(force_all=False)
        _reembed_state["done"] = True
    except Exception as exc:  # noqa: BLE001 — surfaced via status endpoint
        _reembed_state["error"] = str(exc)
    finally:
        _reembed_state["running"] = False


@router.get("/reembed")
async def trigger_reembed(token: str, background_tasks: BackgroundTasks) -> dict:
    """Re-embed rows whose vectors were made by a stale embedding model.

    Browser: /api/v1/admin/reembed?token=YOUR_PASSWORD
    Poll /api/v1/admin/reembed/status to check progress.
    """
    expected = os.environ.get("SEED_DEFAULT_PASSWORD", "")
    if not expected or token != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if _reembed_state["running"]:
        return {"status": "running", "message": "Re-embed already in progress"}

    _reembed_state.update({"running": True, "done": False, "error": None})
    background_tasks.add_task(_run_reembed)
    return {
        "status": "started",
        "message": "Re-embedding started — check /api/v1/admin/reembed/status",
    }


@router.get("/reembed/status")
async def reembed_status() -> dict:
    """Check re-embed progress; error is set if the run failed."""
    return dict(_reembed_state)
