"""
KerjaCerdas — Demo Seed Script
=================================
Populates the JSON store with realistic demo data: 3 employers, 12 job
postings, and 5 seeker profiles, each with embedded Gemini vectors.

This data stays in the store and is **live** — seekers can match against it
the moment they upload their CV or run the agent. Every new user, job, or CV
uploaded through the frontend adds to this base.

Usage (from repo root):
    python -m scripts.seed_json

The script is idempotent: running it twice won't create duplicates
(upsert-by-id semantics from JsonRepository).
"""
from __future__ import annotations

import asyncio
import logging

from backend.app.api.services.auth_service import configure as configure_auth, hash_password
from backend.app.config.settings import settings
from backend.app.db.json_store import get_repositories
from backend.app.db.schemas import (
    EducationLevel,
    Employer,
    JobPosting,
    SeekerProfile,
    Skill,
    User,
    UserRole,
)
from backend.app.ml.matcher import SemanticMatcher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main() -> None:
    """Seed demo data and exit."""
    configure_auth(secret_key=settings.jwt_secret_key or "demo-secret-key-change-in-prod")
    repos = get_repositories()
    matcher = SemanticMatcher()

    # ── Employers ──────────────────────────────────────────────────────────────
    emp_defs = [
        {
            "email": "hr@bankmandiri.id",
            "name": "Bank Mandiri",
            "company": "Bank Mandiri",
            "industry": "Perbankan & Keuangan",
            "region": "3171",
            "desc": "Bank BUMN terbesar. Tim data & AI berkembang pesat.",
        },
        {
            "email": "hr@tokopedia.com",
            "name": "Tokopedia",
            "company": "Tokopedia / GoTo",
            "industry": "E-Commerce & Teknologi",
            "region": "3171",
            "desc": "Super-app terbesar Indonesia. Skala ratusan juta pengguna.",
        },
        {
            "email": "hr@akulaku.com",
            "name": "Akulaku",
            "company": "Akulaku Teknologi",
            "industry": "Fintech",
            "region": "3171",
            "desc": "Platform BNPL & digital banking tumbuh 3× YoY.",
        },
    ]

    employers: list[Employer] = []
    for d in emp_defs:
        u = await repos.users.upsert(User(
            email=d["email"],
            password_hash=hash_password("demo123456"),
            role=UserRole.EMPLOYER,
        ))
        e = await repos.employers.upsert(Employer(
            user_id=u.id,
            company_name=d["company"],
            industry=d["industry"],
            region_code=d["region"],
            description=d["desc"],
        ))
        employers.append(e)
        logger.info("Seeded employer: %s", d["company"])

    mandiri, tokped, akulaku = employers

    # ── Job Postings ───────────────────────────────────────────────────────────
    jobs_raw = [
        # Mandiri
        dict(employer_id=mandiri.id, title="Data Analyst Senior",
             description="Membangun pipeline analitik dan dashboard eksekutif untuk bisnis ritel perbankan. Bekerja dekat dengan tim risk dan product.",
             responsibilities=["Bangun ETL pipeline", "Dashboard BI", "Analisis ad-hoc", "Laporan MBR"],
             required_skills=["Python", "SQL", "Tableau", "Statistics"],
             nice_to_have_skills=["dbt", "Airflow", "BigQuery"],
             education_min=EducationLevel.S1, experience_years_min=2,
             region_code="3171", salary_min=12_000_000, salary_max=22_000_000),

        dict(employer_id=mandiri.id, title="Machine Learning Engineer",
             description="Desain dan deploy model credit scoring dan fraud detection di infrastruktur Kubernetes.",
             responsibilities=["Training & evaluasi model", "Deploy ke produksi", "Monitoring drift"],
             required_skills=["Python", "PyTorch", "SQL", "Docker", "Kubernetes"],
             nice_to_have_skills=["MLflow", "Ray", "Spark"],
             education_min=EducationLevel.S1, experience_years_min=2,
             region_code="3171", salary_min=18_000_000, salary_max=32_000_000),

        dict(employer_id=mandiri.id, title="Cloud Infrastructure Engineer",
             description="Mengelola infrastruktur multi-cloud (GCP + on-prem) untuk sistem perbankan kritikal.",
             required_skills=["Terraform", "Kubernetes", "GCP", "Linux"],
             nice_to_have_skills=["Ansible", "Vault", "Prometheus"],
             education_min=EducationLevel.S1, experience_years_min=3,
             region_code="3171", salary_min=16_000_000, salary_max=28_000_000),

        # Tokopedia
        dict(employer_id=tokped.id, title="Senior Backend Engineer – Go",
             description="Bangun dan scale microservices payment gateway yang handle 500K TPS di peak season Harbolnas.",
             responsibilities=["Develop & maintain microservices", "Code review", "On-call rotation"],
             required_skills=["Go", "PostgreSQL", "Redis", "Kafka", "Docker"],
             nice_to_have_skills=["gRPC", "Kubernetes", "Prometheus"],
             education_min=EducationLevel.S1, experience_years_min=3,
             region_code="3171", salary_min=25_000_000, salary_max=45_000_000, remote_allowed=True),

        dict(employer_id=tokped.id, title="Staff Engineer – Platform",
             description="Design system-level technical decisions untuk platform belanja Indonesia. Impact ke 100+ engineer.",
             required_skills=["Go", "Microservices", "System Design", "Kubernetes", "PostgreSQL"],
             nice_to_have_skills=["Kafka", "Spark", "Rust"],
             education_min=EducationLevel.S1, experience_years_min=6,
             region_code="3171", salary_min=40_000_000, salary_max=70_000_000),

        dict(employer_id=tokped.id, title="Product Designer – Growth",
             description="Own end-to-end design untuk Growth squad: onboarding, referral, gamification. OKR langsung ke DAU.",
             required_skills=["Figma", "User Research", "Prototyping", "Design System"],
             nice_to_have_skills=["Motion Design", "Principle", "SQL"],
             education_min=EducationLevel.S1, experience_years_min=2,
             region_code="3171", salary_min=15_000_000, salary_max=26_000_000),

        dict(employer_id=tokped.id, title="Data Scientist – Recommendation",
             description="Build dan iterasi model rekomendasi produk untuk 100M user. A/B test tiap sprint.",
             required_skills=["Python", "PyTorch", "SQL", "Recommender Systems", "Statistics"],
             nice_to_have_skills=["Spark", "MLflow", "A/B Testing"],
             education_min=EducationLevel.S1, experience_years_min=2,
             region_code="3171", salary_min=18_000_000, salary_max=35_000_000),

        # Akulaku
        dict(employer_id=akulaku.id, title="Backend Engineer – Lending",
             description="Bangun core lending engine untuk produk BNPL. Integrasi OJK regulatory reporting.",
             required_skills=["Java", "Spring Boot", "PostgreSQL", "Redis"],
             nice_to_have_skills=["Kafka", "Docker", "gRPC"],
             education_min=EducationLevel.S1, experience_years_min=2,
             region_code="3171", salary_min=14_000_000, salary_max=24_000_000),

        dict(employer_id=akulaku.id, title="Risk Data Analyst",
             description="Monitor portfolio credit risk, bangun scorecard, dan deteksi anomali fraud real-time.",
             required_skills=["Python", "SQL", "Statistics", "Excel"],
             nice_to_have_skills=["Tableau", "R", "SAS"],
             education_min=EducationLevel.S1, experience_years_min=1,
             region_code="3171", salary_min=9_000_000, salary_max=16_000_000),

        dict(employer_id=akulaku.id, title="Android Engineer",
             description="Kembangkan app Akulaku yang dipakai 20M+ pengguna. Performance-obsessed team.",
             required_skills=["Kotlin", "Android SDK", "Jetpack Compose", "REST"],
             nice_to_have_skills=["Flutter", "CI/CD", "Firebase"],
             education_min=EducationLevel.S1, experience_years_min=2,
             region_code="3171", salary_min=13_000_000, salary_max=22_000_000),

        dict(employer_id=akulaku.id, title="DevOps / SRE Engineer",
             description="Own reliability SLO 99.99% untuk sistem fintech kritikal 24/7.",
             required_skills=["Kubernetes", "Docker", "CI/CD", "Linux", "Monitoring"],
             nice_to_have_skills=["Terraform", "Ansible", "Prometheus", "Grafana"],
             education_min=EducationLevel.S1, experience_years_min=2,
             region_code="3171", salary_min=16_000_000, salary_max=28_000_000, remote_allowed=True),

        dict(employer_id=akulaku.id, title="QA Automation Engineer",
             description="Build automation framework untuk mobile + API testing.",
             required_skills=["Python", "Selenium", "Appium", "API Testing"],
             nice_to_have_skills=["K6", "Pytest", "CI/CD"],
             education_min=EducationLevel.D3, experience_years_min=1,
             region_code="3171", salary_min=9_000_000, salary_max=15_000_000),
    ]

    for jd in jobs_raw:
        job = JobPosting(**jd)
        await matcher.embed_job(job)
        await repos.jobs.upsert(job)
    logger.info("Seeded %d job postings", len(jobs_raw))

    # ── Seekers ───────────────────────────────────────────────────────────────
    seekers_raw = [
        dict(email="andi@example.com", name="Andi Pratama",
             full_name="Andi Pratama", headline="Fresh-grad Data Science · analitik perbankan",
             region_code="3171", skills=[
                 Skill(name="Python", level="intermediate", years=2),
                 Skill(name="SQL", level="intermediate", years=2),
                 Skill(name="Statistics", level="advanced", years=3),
             ], salary_min=9_000_000, salary_max=15_000_000,
             resume="S1 Statistika UI 2024. Magang data analyst fintech."),

        dict(email="rina@example.com", name="Rina Pertiwi",
             full_name="Rina Pertiwi", headline="Senior Backend · Go · 6 thn exp",
             region_code="3171", skills=[
                 Skill(name="Go", level="advanced", years=5),
                 Skill(name="PostgreSQL", level="advanced", years=5),
                 Skill(name="gRPC", level="intermediate", years=3),
                 Skill(name="Kafka", level="intermediate", years=2),
                 Skill(name="Kubernetes", level="intermediate", years=2),
             ], salary_min=28_000_000, salary_max=50_000_000,
             resume="S1 Ilmu Komputer ITB 2018. 6 tahun di Bukalapak payment, handle 100K RPS."),

        dict(email="budi@example.com", name="Budi Santoso",
             full_name="Budi Santoso", headline="ML Engineer · NLP & Recommendation Systems",
             region_code="3171", skills=[
                 Skill(name="Python", level="advanced", years=4),
                 Skill(name="PyTorch", level="advanced", years=3),
                 Skill(name="SQL", level="intermediate", years=4),
                 Skill(name="Docker", level="intermediate", years=3),
                 Skill(name="Kubernetes", level="beginner", years=1),
             ], salary_min=20_000_000, salary_max=35_000_000,
             resume="S2 Teknik Informatika UI 2022. Research NLP, 2 paper IJCAI."),

        dict(email="sari@example.com", name="Sari Ningrum",
             full_name="Sari Ningrum", headline="DevOps/SRE · AWS · Terraform",
             region_code="3174", skills=[
                 Skill(name="Kubernetes", level="advanced", years=4),
                 Skill(name="Terraform", level="advanced", years=3),
                 Skill(name="Docker", level="advanced", years=4),
                 Skill(name="Linux", level="advanced", years=5),
                 Skill(name="Prometheus", level="intermediate", years=2),
             ], salary_min=18_000_000, salary_max=30_000_000,
             resume="S1 Teknik Elektro Unpad 2020. 4 tahun SRE di startup series B."),

        dict(email="dian@example.com", name="Dian Kusuma",
             full_name="Dian Kusuma", headline="Product Designer · Growth & Conversion",
             region_code="3171", skills=[
                 Skill(name="Figma", level="advanced", years=4),
                 Skill(name="User Research", level="advanced", years=3),
                 Skill(name="Prototyping", level="advanced", years=4),
                 Skill(name="Design System", level="intermediate", years=2),
             ], salary_min=14_000_000, salary_max=24_000_000,
             resume="S1 DKV ITS 2021. Product designer e-commerce, A/B tested 50+ eksperimen."),
    ]

    for sd in seekers_raw:
        u = await repos.users.upsert(User(
            email=sd["email"],
            password_hash=hash_password("demo123456"),
            role=UserRole.SEEKER,
        ))
        seeker = SeekerProfile(
            user_id=u.id,
            full_name=sd["full_name"],
            headline=sd["headline"],
            region_code=sd["region_code"],
            skills=sd["skills"],
            salary_expectation_min=sd["salary_min"],
            salary_expectation_max=sd["salary_max"],
            resume_text=sd["resume"],
        )
        await matcher.embed_seeker(seeker)
        await repos.seekers.upsert(seeker)

    logger.info("Seeded %d seekers", len(seekers_raw))
    logger.info("Done. Login credentials: password=demo123456 for all demo accounts.")
    logger.info("Employer accounts: hr@bankmandiri.id, hr@tokopedia.com, hr@akulaku.com")
    logger.info("Seeker accounts:   andi@example.com, rina@example.com, budi@example.com, sari@example.com, dian@example.com")


if __name__ == "__main__":
    asyncio.run(main())
