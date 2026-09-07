"""BPS wilayah (kabupaten/kota) code -> display name lookup.

Single source of truth: this used to be two hand-copied, silently-drifting
dicts (jobs.py's _BPS_REGIONS and matcher.py's _BPS_REGION_NAMES), which is
exactly how "3271"/"3573" — both genuinely used by seeded job/employer
records — ended up with no display name in one place while the other had a
different set of gaps. Add a new code here once and both the public job
listing and the matcher's location-filter logic pick it up.

Deliberately NOT claiming full 34-province coverage: every code below is one
we're actually confident about. A region code with no entry here still works
correctly for filtering (it's just displayed as its raw code) — see
`get_region_name`. Guessing a wrong human-readable name would be worse than
showing the code, since a wrong name silently misleads users about where a
job actually is.
"""

from __future__ import annotations

BPS_REGION_NAMES: dict[str, str] = {
    "3171": "Jakarta Pusat",
    "3172": "Jakarta Utara",
    "3173": "Jakarta Barat",
    "3174": "Jakarta Selatan",
    "3175": "Jakarta Timur",
    "3271": "Bogor",
    "3273": "Bandung",
    "3372": "Surakarta",
    "3374": "Semarang",
    "3573": "Malang",
    "3578": "Surabaya",
    "3471": "Yogyakarta",
    "5171": "Denpasar",
    "1275": "Medan",
    "7371": "Makassar",
    "6371": "Banjarmasin",
    "6471": "Balikpapan",
}


def get_region_name(region_code: str | None) -> str:
    """Human-readable name for a BPS region code, or the raw code if unknown."""
    if not region_code:
        return ""
    return BPS_REGION_NAMES.get(region_code, region_code)
