"""Karirhub (national job system) sync endpoints — backed by a MOCK connector.

Endpoints (registered under /api/v1):
  POST /karirhub/sync      feed active vacancies to the national system (mock)
  GET  /karirhub/listings  pull verified national listings (mock)
"""
from __future__ import annotations

from typing import Any

from backend.app.db.postgres_store import get_repositories
from backend.app.services.integrations.karirhub import (
    pull_verified_listings,
    push_vacancies,
)
from fastapi import APIRouter

router = APIRouter(prefix="/karirhub", tags=["karirhub"])


@router.post("/sync")
async def sync_vacancies() -> dict[str, Any]:
    """Feed active vacancies to the national system (mock).

    Tolerates an empty/unavailable store by defaulting to no jobs.
    """
    store_unavailable = False
    try:
        repos = get_repositories()
        jobs = await repos.jobs.list()
    except Exception:  # noqa: BLE001 - store is optional for this mock
        jobs = []
        store_unavailable = True
    result = push_vacancies(jobs)
    if store_unavailable:
        result["store_unavailable"] = True
    return result


@router.get("/listings")
async def list_verified_listings(region: str | None = None) -> dict[str, Any]:
    """Pull verified national listings (mock), optionally filtered by region."""
    items = pull_verified_listings(region)
    return {"total": len(items), "items": items}
