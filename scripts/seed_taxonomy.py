"""Seed the skill/occupation taxonomy tables.

Run AFTER scripts/seed_all.py (or on top of an already-seeded DB) — this
script deliberately reuses the exact skill names, KBJI codes, and region
codes already present in scripts/seed_all.py's JOB_POSTINGS, so the taxonomy
is connected to the same demo dataset rather than an disconnected island of
new fake data.

Run:
    python -m scripts.seed_taxonomy

IMPORTANT — what is and isn't real data here:
  * Skills / Occupations / OccupationSkill links: derived directly from the
    JOB_POSTINGS already seeded by seed_all.py — these are "real" in the
    sense that they match this repo's own existing demo dataset.
  * regional_minimum_wages: the amounts below are ILLUSTRATIVE PLACEHOLDERS,
    not verified BPS/Kemnaker UMR/UMK figures. Do not present them as
    official in a pitch deck or demo without replacing them with sourced
    numbers — see RegionalMinimumWage's docstring in db/models.py.
  * skill_assessments: original, hand-written objective-fact questions for a
    handful of skills, meant to demonstrate the verification mechanism, not
    a validated psychometric instrument.
"""

from __future__ import annotations

import asyncio

from backend.app.api.database import init_db
from backend.app.db.postgres_store import (
    get_repositories,
    set_occupation_skills,
)
from backend.app.db.schemas import (
    AssessmentQuestion,
    OccupationSkillLink,
    RegionalMinimumWage,
    SkillAssessment,
    TaxonomyOccupation,
    TaxonomySkill,
)

# ── Skills ────────────────────────────────────────────────────────────────────
# Every skill string that appears in scripts/seed_all.py's JOB_POSTINGS
# required_skills/nice_to_have_skills, so resolve_skill() finds an exact
# canonical match for the existing demo data out of the box.

SKILL_NAMES = sorted(
    {
        "AWS", "After Effects", "Airflow", "Android Studio", "AutoCAD", "Bahasa Indonesia",
        "Bahasa Inggris", "Bahasa Mandarin", "Bioteknologi", "CPOB", "Celery", "Cell Culture",
        "Cisco IOS", "Content Writing", "Customer Service", "Dart", "Design System", "Docker",
        "Drilling", "ELISA", "Excel", "FTTH", "Farmasi", "FastAPI", "Figma", "Firebase",
        "Flow Cytometry", "Flutter", "GMP", "Git", "Go", "Illustration", "Kafka", "Komunikasi",
        "Kubernetes", "LIMS", "Lab Safety", "Leadership", "Lean / Six Sigma", "Linux",
        "Logistik", "MATLAB", "MES", "Machine Learning", "Marketing", "Mechanical", "Mikrotik",
        "Negotiation", "Nielsen", "OSPF", "Operasional", "PETREL", "PROSPER", "Penampilan",
        "Pertanian", "Petroleum Engineering", "Photoshop", "PostgreSQL", "Power BI",
        "Problem Solving", "Prototyping", "Python", "Quality Assurance", "R", "REST API",
        "Redis", "Riset", "Risk Management", "S&OP", "SAP", "SAS", "SEO", "SQL", "Sales",
        "Service Mindset", "Six Sigma", "SolidWorks", "Spark", "Statistika", "Supply Chain",
        "TCP/IP", "TPM", "Tableau", "TensorFlow", "Trade Marketing", "UI/UX", "User Research",
        "WordPress", "gRPC", "iOS", "qPCR",
    }
)

# ── Occupations (KBJI) ────────────────────────────────────────────────────────
# (kbji_code, representative title, required skills, nice-to-have skills) —
# taken directly from scripts/seed_all.py's JOB_POSTINGS. Where one code
# covers several distinct demo job titles (e.g. 2511 spans backend/mobile/
# data roles — the seed data's own KBJI codes are broad, not this script's
# invention), the title here is a representative label, not a claim that
# it's the sole official title for that code.

OCCUPATIONS = [
    ("2511", "Pengembang Perangkat Lunak & Analitik Data",
     ["Dart", "Docker", "Excel", "FastAPI", "Flutter", "Git", "Go", "Kafka", "Kubernetes",
      "Machine Learning", "PostgreSQL", "Python", "REST API", "SQL", "Spark", "Statistika",
      "Tableau"],
     ["AWS", "Airflow", "Android Studio", "Celery", "Firebase", "Power BI", "Redis",
      "TensorFlow", "gRPC", "iOS"]),
    ("2152", "Network Engineer",
     ["Cisco IOS", "FTTH", "Linux", "TCP/IP"], ["Mikrotik", "OSPF"]),
    ("2146", "Petroleum Engineer",
     ["Drilling", "PETREL", "PROSPER", "Petroleum Engineering"], ["MATLAB", "Python"]),
    ("2166", "Product / UI-UX Designer",
     ["Design System", "Figma", "Prototyping", "UI/UX", "User Research"],
     ["After Effects", "Bahasa Inggris", "Illustration"]),
    ("2641", "Content Writer",
     ["Bahasa Indonesia", "Content Writing", "Riset", "SEO"], ["Photoshop", "WordPress"]),
    ("2412", "Risk Management Analyst",
     ["Risk Management", "SAS", "SQL", "Statistika"], ["Python", "R"]),
    ("1324", "Supply Chain Manager",
     ["Negotiation", "S&OP", "SAP", "Supply Chain"], ["Power BI", "Six Sigma"]),
    ("5111", "Cabin Crew",
     ["Bahasa Inggris", "Komunikasi", "Penampilan", "Service Mindset"], ["Bahasa Mandarin"]),
    ("3331", "Operations Lead",
     ["Excel", "Leadership", "Operasional", "Problem Solving"], ["Lean / Six Sigma"]),
    ("2144", "Mechanical Engineer",
     ["AutoCAD", "Bahasa Inggris", "Mechanical", "TPM"], ["MES", "SolidWorks"]),
    ("2262", "Quality Assurance Pharmacist",
     ["CPOB", "Farmasi", "GMP", "Quality Assurance"], ["LIMS", "Six Sigma"]),
    ("4222", "Customer Service Representative",
     ["Bahasa Indonesia", "Customer Service", "Komunikasi", "Penampilan"], ["Excel"]),
    ("2431", "Marketing Specialist",
     ["Bahasa Inggris", "Excel", "Marketing", "Trade Marketing"], ["Nielsen", "Power BI"]),
    ("3322", "Sales Executive",
     ["Bahasa Indonesia", "Komunikasi", "Negotiation", "Sales"], ["Bahasa Inggris"]),
    ("6111", "Agriculture Field Officer",
     ["Bahasa Indonesia", "Excel", "Komunikasi", "Pertanian"], ["Logistik"]),
    ("2131", "Biotechnology Research Associate",
     ["Bioteknologi", "Cell Culture", "ELISA", "Lab Safety"], ["Flow Cytometry", "qPCR"]),
]

# ── Skill assessments ─────────────────────────────────────────────────────────
# Hand-written, objectively-correct trivia — a demo of the verification
# mechanism, not a validated psychometric instrument.

ASSESSMENTS: dict[str, list[tuple[str, list[str], int]]] = {
    "Python": [
        ("Tipe data mana yang immutable di Python?", ["list", "dict", "tuple", "set"], 2),
        ("Fungsi apa yang membuat generator?", ["return", "yield", "def", "lambda"], 1),
        ("Apa hasil dari `len([1,2,3])`?", ["2", "3", "4", "Error"], 1),
    ],
    "SQL": [
        ("Klausa mana yang memfilter baris SEBELUM agregasi?", ["HAVING", "WHERE", "GROUP BY", "ORDER BY"], 1),
        ("JOIN mana yang mengembalikan semua baris tabel kiri walau tidak ada pasangan di kanan?", ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "CROSS JOIN"], 1),
        ("Perintah apa untuk menghapus seluruh baris tabel tanpa menghapus skemanya?", ["DROP TABLE", "DELETE", "TRUNCATE", "ALTER TABLE"], 2),
    ],
    "Excel": [
        ("Fungsi mana yang mencari nilai berdasarkan kecocokan baris pertama?", ["VLOOKUP", "SUMIF", "CONCAT", "TRIM"], 0),
        ("Shortcut apa untuk mengunci referensi sel (absolute reference)?", ["F2", "F4", "F6", "F9"], 1),
        ("Fungsi apa untuk menjumlahkan sel dengan syarat tertentu?", ["SUM", "SUMIF", "COUNT", "AVERAGE"], 1),
    ],
    "Docker": [
        ("File apa yang mendefinisikan cara membangun sebuah image?", ["docker-compose.yml", "Dockerfile", "image.json", ".dockerignore"], 1),
        ("Perintah apa untuk melihat container yang sedang berjalan?", ["docker images", "docker ps", "docker build", "docker logs"], 1),
        ("Apa fungsi utama volume di Docker?", ["Mempercepat build", "Menyimpan data yang persisten", "Mengatur network", "Mengelola image"], 1),
    ],
    "Git": [
        ("Perintah apa untuk membuat branch baru dan langsung pindah ke sana?", ["git branch", "git checkout -b", "git merge", "git stash"], 1),
        ("Apa fungsi `git rebase`?", ["Menghapus commit", "Menyusun ulang riwayat commit di atas base baru", "Membuat tag", "Meng-clone repo"], 1),
        ("File apa yang mendaftar file/folder yang diabaikan Git?", [".gitconfig", ".gitignore", ".gitmodules", "README.md"], 1),
    ],
    "TCP/IP": [
        ("Protokol mana yang connection-oriented dan menjamin pengiriman?", ["UDP", "TCP", "ICMP", "ARP"], 1),
        ("Berapa jumlah bit pada alamat IPv4?", ["16", "32", "64", "128"], 1),
        ("Layer OSI mana yang menangani routing?", ["Data Link", "Network", "Transport", "Session"], 1),
    ],
}


async def seed() -> None:
    await init_db()
    repos = get_repositories()

    skill_id_by_name: dict[str, str] = {}
    for name in SKILL_NAMES:
        skill = TaxonomySkill(canonical_name=name)
        saved = await repos.skills.upsert(skill)
        skill_id_by_name[name] = saved.id
    print(f"[skills] {len(skill_id_by_name)} created")

    occ_count = 0
    for kbji_code, title, required, nice_to_have in OCCUPATIONS:
        occupation = TaxonomyOccupation(kbji_code=kbji_code, title=title)
        saved_occ = await repos.occupations.upsert(occupation)
        links = [
            OccupationSkillLink(
                occupation_id=saved_occ.id,
                skill_id=skill_id_by_name[name],
                min_level="intermediate",
                is_core=True,
            )
            for name in required
            if name in skill_id_by_name
        ] + [
            OccupationSkillLink(
                occupation_id=saved_occ.id,
                skill_id=skill_id_by_name[name],
                min_level="beginner",
                is_core=False,
            )
            for name in nice_to_have
            if name in skill_id_by_name
        ]
        await set_occupation_skills(saved_occ.id, links)
        occ_count += 1
    print(f"[occupations] {occ_count} created")

    assessment_count = 0
    for skill_name, questions in ASSESSMENTS.items():
        if skill_name not in skill_id_by_name:
            continue
        assessment = SkillAssessment(
            skill_id=skill_id_by_name[skill_name],
            questions=[
                AssessmentQuestion(question=q, options=opts, correct_index=idx)
                for q, opts, idx in questions
            ],
            passing_score=0.7,
        )
        await repos.skill_assessments.upsert(assessment)
        assessment_count += 1
    print(f"[skill_assessments] {assessment_count} created")

    # PLACEHOLDER regional minimum wages — see module docstring.
    umr_year = 2026
    umr_placeholders = {
        "3171": 5_400_000, "3172": 5_400_000, "3173": 5_400_000, "3174": 5_400_000,
        "3175": 5_400_000,  # Jakarta (all kotamadya share one provincial UMP in reality)
        "3273": 4_000_000,  # Bandung
        "3578": 4_200_000,  # Surabaya
        "3471": 2_400_000,  # Yogyakarta
        "5171": 3_000_000,  # Denpasar
        "1275": 3_700_000,  # Medan
    }
    umr_count = 0
    for region_code, amount in umr_placeholders.items():
        await repos.regional_minimum_wages.upsert(
            RegionalMinimumWage(region_code=region_code, year=umr_year, umr_amount=amount)
        )
        umr_count += 1
    print(f"[regional_minimum_wages] {umr_count} created (PLACEHOLDER figures — see module docstring)")

    print("\n[OK] Taxonomy seed selesai.")


if __name__ == "__main__":
    asyncio.run(seed())
