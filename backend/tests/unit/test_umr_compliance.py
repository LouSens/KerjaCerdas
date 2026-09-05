"""Employer job posting — regional minimum wage (UMR/UMK) compliance flag.

The check warns, it never blocks: a posting below the seeded regional
minimum wage still gets created (status 201), with `umr_warning` populated
in the response instead of a rejection.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

from fastapi.testclient import TestClient

from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import RegionalMinimumWage


def _seed_umr(region_code: str, amount: int) -> None:
    async def _do() -> None:
        repos = get_repositories()
        await repos.regional_minimum_wages.upsert(
            RegionalMinimumWage(
                region_code=region_code, year=datetime.now(UTC).year, umr_amount=amount
            )
        )

    asyncio.run(_do())


def _post_job(client: TestClient, employer_account: dict, salary_min: int) -> dict:
    payload = {
        "title": "Staff Administrasi",
        "description": "Mengelola dokumen dan input data harian.",
        "required_skills": ["Excel"],
        "region_code": "3171",
        "salary_min": salary_min,
        "salary_max": salary_min + 2_000_000,
        "work_type": "onsite",
    }
    resp = client.post("/api/v1/employer/jobs", json=payload, headers=employer_account["headers"])
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_salary_below_umr_returns_warning(client: TestClient, employer_account: dict) -> None:
    _seed_umr("3171", 5_400_000)

    result = _post_job(client, employer_account, salary_min=3_500_000)

    assert result["umr_warning"] is not None
    assert "UMR" in result["umr_warning"]
    assert "3,500,000" in result["umr_warning"]


def test_salary_at_or_above_umr_has_no_warning(client: TestClient, employer_account: dict) -> None:
    _seed_umr("3171", 5_400_000)

    result = _post_job(client, employer_account, salary_min=6_000_000)

    assert result["umr_warning"] is None


def test_no_seeded_umr_for_region_has_no_warning(client: TestClient, employer_account: dict) -> None:
    # No RegionalMinimumWage row seeded for this region/year at all.
    result = _post_job(client, employer_account, salary_min=1_000_000)

    assert result["umr_warning"] is None
