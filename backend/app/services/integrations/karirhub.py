"""MOCK Karirhub / SIAPkerja connector.

This module SIMULATES integration with Karirhub (the Indonesian national job
system run by Kemnaker). It makes **no external network calls** and needs **no
API keys** — every function returns canned, deterministic data. It exists so the
rest of the platform can be wired against a realistic interface now and swapped
for a real connector later.

Two directions, matching the strategy of using the national system as a
distribution channel + a source of verified supply:
  • push_vacancies(...)         — feed verified BKK/employer vacancies OUT to the
                                  national system (returns a canned acknowledgement).
  • pull_verified_listings(...) — pull verified national listings IN (returns a
                                  small canned set, each flagged verified + sourced).
"""

from __future__ import annotations

from typing import Any

# Canned national listings. `verified` + `source` let the UI badge them as
# trusted, government-sourced postings.
_CANNED_LISTINGS: list[dict[str, Any]] = [
    {
        "id": "kh-1001",
        "title": "Teknisi Jaringan Junior",
        "company": "PT Solusi Jaringan Nusantara",
        "region_code": "3171",
        "salary_min": 4_500_000,
        "salary_max": 6_000_000,
        "description": "Instalasi & pemeliharaan jaringan LAN/WAN, troubleshooting perangkat.",
        "required_skills": ["jaringan komputer", "mikrotik", "troubleshooting"],
        "verified": True,
        "source": "karirhub",
    },
    {
        "id": "kh-1002",
        "title": "Staff Administrasi",
        "company": "Koperasi Maju Bersama",
        "region_code": "3578",
        "salary_min": 4_000_000,
        "salary_max": 5_000_000,
        "description": "Pengelolaan dokumen, input data, dukungan operasional kantor.",
        "required_skills": ["Microsoft Excel", "administrasi", "arsip"],
        "verified": True,
        "source": "karirhub",
    },
    {
        "id": "kh-1003",
        "title": "Operator Produksi",
        "company": "PT Manufaktur Sejahtera",
        "region_code": "3273",
        "salary_min": 4_200_000,
        "salary_max": 5_500_000,
        "description": "Mengoperasikan mesin produksi sesuai SOP, quality check dasar.",
        "required_skills": ["operator mesin", "K3", "ketelitian"],
        "verified": True,
        "source": "karirhub",
    },
]


def push_vacancies(jobs: list[Any]) -> dict[str, Any]:
    """Pretend to publish vacancies to the national system. Canned acknowledgement.

    No network call is made — this returns a synthetic national-id per job so the
    UI/flow can be exercised end-to-end.
    """
    jobs = list(jobs or [])
    national_ids = [f"KH-{i:05d}" for i in range(1, len(jobs) + 1)]
    return {
        "status": "accepted",
        "pushed": len(jobs),
        "national_ids": national_ids,
        "note": "MOCK Karirhub sync — no external call was made.",
    }


def pull_verified_listings(region: str | None = None) -> list[dict[str, Any]]:
    """Return canned verified national listings, optionally filtered by region."""
    if region:
        return [dict(item) for item in _CANNED_LISTINGS if item["region_code"] == region]
    return [dict(item) for item in _CANNED_LISTINGS]
