"""Retire employers left behind by earlier seeds, so a reseeded database shows
no real brands, no duplicate UMKM jobs, and no invalid logins. Called first in
scripts.seed_all.

Earlier seeds created employers under real company names (GoTo, Bank Mandiri,
...) and UMKM logins with underscores (hr@warung_bahari.id). An underscore is
not valid in an email domain, so every validated read of the users table
(repos.users.list(), the admin views) raised on those rows. For each old login
that still exists:
  * a real-brand employer is renamed to its fictional replacement + "(arsip)";
  * an underscore login is rewritten to a valid address;
  * every job the old employer owns is deactivated.
Nothing is deleted — applications to those jobs keep their history. Idempotent.
"""

from __future__ import annotations

from backend.app.db.postgres_store import (
    find_employer_by_user_id,
    find_jobs_by_employer_id,
    find_user_id_by_email,
    set_user_email,
)

# old seed key -> fictional company that replaced it
LEGACY_BRANDS = {
    "goto": "NusaPay Digital", "mandiri": "BPR Sentosa Artha", "bca": "BPR Mitra Usaha Kita",
    "telkom": "PT Nusantara Net Media", "pertamina": "PT Energi Borneo Lestari",
    "bibit": "Tumbuh Invest", "ruangguru": "Belajar Pintar Edukasi", "halodoc": "Sehat Digital Nusantara",
    "indofood": "PT Pangan Jaya Abadi", "garuda": "Angkasa Charter Nusantara",
    "traveloka": "Jelajah Travel Indonesia", "sayurbox": "Kebun Segar Nusantara",
    "astra": "PT Karya Otomotif Presisi", "kalbe": "PT Farma Husada Nusantara",
    "pegadaian": "PT Gadai Amanah Sejahtera", "unilever": "PT Rumah Bersih Indonesia",
    "reddoorz": "InapNyaman Hospitality", "shopee": "Pasar Digital Nusantara",
    "tanihub": "Tani Makmur Agro", "kalbio": "PT BioNusa Medika",
}
# old UMKM logins that contained an underscore (now hr@<key without _>.id)
LEGACY_UNDERSCORE_KEYS = [
    "warung_bahari", "bengkel_jaya", "salon_ayu", "konveksi_makmur", "laundry_bersih",
    "catering_sedap", "konstruksi_mitra", "klinik_sehat", "bimbel_cerdas", "kelontong_makmur",
]


async def _deactivate_jobs(repos, employer) -> None:
    for job in await find_jobs_by_employer_id(employer.id):
        if job.is_active:
            job.is_active = False
            await repos.jobs.upsert(job)


async def retire_legacy_employers(repos) -> int:
    retired = 0
    # Invalid logins first — until they are fixed, validated user reads raise.
    for key in LEGACY_UNDERSCORE_KEYS:
        user_id = await find_user_id_by_email(f"hr@{key}.id")
        if not user_id:
            continue
        await set_user_email(user_id, f"legacy-{key.replace('_', '-')}@example.com")
        employer = await find_employer_by_user_id(user_id)
        if employer:
            await _deactivate_jobs(repos, employer)
        retired += 1
    for key, name in LEGACY_BRANDS.items():
        user_id = await find_user_id_by_email(f"hr@{key}.id")
        employer = await find_employer_by_user_id(user_id) if user_id else None
        if not employer:
            continue
        archived = f"{name} (arsip)"
        if employer.company_name != archived:
            employer.company_name = archived
            await repos.employers.upsert(employer)
        await _deactivate_jobs(repos, employer)
        retired += 1
    if retired:
        print(f"[legacy] {retired} old seed employers retired (renamed / jobs deactivated)")
    return retired
