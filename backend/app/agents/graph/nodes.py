"""Course-recommendation helpers used by the skill-gap endpoint.

Historically this module held a full set of LangGraph node functions
(route_intent, run_matcher, run_skill_gap, run_advisor, compose_response) for
a multi-node agent pipeline that was never wired into the graph (see
builder.py) — the agent router (backend/app/api/routers/agent.py) reimplements
matching/routing/composition inline instead, and skill-gap analysis lives in
backend/app/api/routers/seeker.py. Those unused functions were removed;
`_recommend_courses` (and the catalog it falls back to) is the one piece that
was actually still called, from `seeker.py`.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import quote_plus

from backend.app.db.schemas import CourseRecommendation
from backend.app.utils import content_to_text

logger = logging.getLogger(__name__)


async def _recommend_courses(missing: list[str], job) -> list[CourseRecommendation]:
    """Try Gemini first, then JSON store courses, then hardcoded catalog."""
    import json
    import os

    from backend.app.config.settings import settings

    if not missing:
        return []

    gemini_key = (
        settings.gemini_api_key
        or os.environ.get("GEMINI_API_KEY", "")
        or os.environ.get("GOOGLE_API_KEY", "")
    )
    if gemini_key:
        try:
            from langchain_core.messages import HumanMessage, SystemMessage

            from backend.app.services.llm_factory import build_chat_llm
            from backend.app.services.prompt_loader import build_system_prompt

            llm = build_chat_llm(
                temperature=settings.skill_gap_temperature,
            )
            sys = build_system_prompt(role="seeker_advisor", task="skill_gap")
            payload = json.dumps(
                {
                    "missing_skills": missing,
                    "target_job": getattr(job, "title", ""),
                }
            )
            resp = await llm.ainvoke(
                [
                    SystemMessage(content=sys),
                    HumanMessage(
                        content=(
                            f"Rekomendasikan kursus spesifik untuk gap ini:\n{payload}\n"
                            'Kembalikan JSON: {"recommended_courses": [{"name":...,"provider":...,"duration":...}]}'
                        )
                    ),
                ]
            )
            raw = content_to_text(resp.content).strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = re.sub(r"```[a-z]*\n?", "", raw).rstrip("`").strip()
            data = json.loads(raw)
            result = [
                CourseRecommendation(**c)
                for c in data.get("recommended_courses", [])
                if c.get("name")
            ]
            if result:
                return result
        except Exception as exc:
            logger.warning("Gemini skill-gap failed (%s) — checking course store", exc)

    # Try JSON store courses before falling back to hardcoded catalog
    store_courses = await _store_courses(missing)
    if store_courses:
        return store_courses

    return _catalog_courses(missing)


async def _store_courses(missing: list[str]) -> list[CourseRecommendation]:
    """Match missing skills against the courses seeded into data/courses/*.json."""
    try:
        from backend.app.db.postgres_store import get_repositories

        repos = get_repositories()
        all_courses = await repos.courses.list()
        missing_lower = {s.lower() for s in missing}
        results: list[CourseRecommendation] = []
        seen: set[str] = set()
        for course in all_courses:
            taught = {t.lower() for t in (getattr(course, "skills_taught", None) or [])}
            if taught & missing_lower and course.name not in seen:
                seen.add(course.name)
                raw_price = getattr(course, "price", 0)
                price_str = "Gratis" if not raw_price else f"Rp {raw_price:,}"
                results.append(
                    CourseRecommendation(
                        name=course.name,
                        provider=getattr(course, "provider", ""),
                        duration=getattr(course, "duration", ""),
                        url=getattr(course, "url", None),
                        price=price_str,
                        rating=getattr(course, "rating", 4.5),
                        description=getattr(course, "description", ""),
                        category=getattr(course, "category", "tech"),
                    )
                )
        return results[:5]  # cap at 5 recommendations
    except Exception as exc:
        logger.debug("Course store lookup failed: %s", exc)
        return []


_COURSE_CATALOG: dict[str, tuple[str, str, str]] = {
    "python": ("Python untuk Data Science", "Dicoding", "1 bulan"),
    "sql": ("SQL untuk Analisis Data", "Dicoding", "1 bulan"),
    "javascript": ("Belajar Dasar JavaScript", "Dicoding", "1 bulan"),
    "react": ("Kelas Pengembangan Web React", "Dicoding", "2 bulan"),
    "docker": ("Docker & Container Fundamentals", "Hacktiv8", "3 minggu"),
    "kubernetes": ("Kubernetes for Developers", "Coursera ID", "2 bulan"),
    "go": ("Go Programming Language", "Udemy", "1 bulan"),
    "machine learning": ("Machine Learning Specialization", "Coursera ID", "3 /bulan"),
    "pytorch": ("Deep Learning with PyTorch", "Coursera ID", "3 bulan"),
    "tensorflow": ("TensorFlow Developer Certificate", "Coursera ID", "3 bulan"),
    "tableau": ("Visualisasi Data Tableau", "Skill Academy", "3 minggu"),
    "power bi": ("Power BI untuk Bisnis", "MySkill", "1 bulan"),
    "figma": ("UI Design with Figma", "Binar Academy", "2 bulan"),
    "flutter": ("Flutter App Development", "Dicoding", "2 bulan"),
    "kotlin": ("Android Dev with Kotlin", "Binar Academy", "3 bulan"),
    "spark": ("Big Data with Apache Spark", "Purwadhika", "6 minggu"),
    "kafka": ("Streaming Data with Kafka", "Udemy", "3 minggu"),
    "airflow": ("Data Pipeline with Airflow", "Purwadhika", "4 minggu"),
    "sap": ("SAP for Supply Chain", "Pintaria", "6 bulan"),
    "bahasa inggris": ("English for Careers", "Cakap", "3 bulan"),
    "akuntansi": ("Akuntansi Praktis UMKM", "Arkademi", "2 bulan"),
    "excel": ("Excel & Power BI Bisnis", "MySkill", "1 bulan"),
    "digital marketing": ("Digital Marketing Bersertifikat", "Skill Academy", "1 bulan"),
    "aws": ("AWS Cloud Practitioner", "Coursera ID", "2 bulan"),
    "grpc": ("gRPC — Build Modern APIs", "Udemy", "2 minggu"),
    "fastapi": ("FastAPI — Building APIs with Python", "Udemy", "3 minggu"),
    "statistics": ("Statistics for Data Science", "Coursera ID", "2 bulan"),
    "statistika": ("Statistika untuk Analisis Data", "Dicoding", "1 bulan"),
    "android": ("Android Development with Kotlin", "Dicoding", "2/bulan"),
    "ios": ("iOS Development with Swift", "Apple Developer Academy ID", "9 bulan"),
    "terraform": ("Infrastructure as Code — Terraform", "Coursera ID", "1 bulan"),
    "linux": ("Linux Fundamentals", "Dicoding", "3 minggu"),
    "design system": ("Design System Mastery", "Binar Academy", "1 bulan"),
    "user research": ("User Research & UX Methods", "Coursera ID", "6 minggu"),
    "supply chain": ("Supply Chain Management", "Coursera ID", "2 bulan"),
    "bahasa indonesia": ("Bahasa Indonesia Profesional", "Cakap", "1 bulan"),
    "komunikasi": ("Komunikasi Profesional di Tempat Kerja", "Skill Academy", "3 minggu"),
}


def _catalog_courses(missing: list[str]) -> list[CourseRecommendation]:
    """Fallback catalog lookup using case-insensitive partial match, prioritizing Dicoding."""
    results: list[CourseRecommendation] = []
    seen: set[str] = set()

    for skill in missing:
        entry = _COURSE_CATALOG.get(skill.lower())
        if entry and entry[0] not in seen:
            seen.add(entry[0])
            # Keep the catalogued provider — overwriting it misattributed
            # every curated course (e.g. Coursera ID) to Dicoding.
            name, provider, dur = entry
        else:
            # Dynamically generate mock course recommendation for missing skill
            name = f"Dicoding Academy — Menjadi {skill.title()} Developer"
            provider = "Dicoding"
            dur = "1 bulan"

        # Catalog entries carry no verified URL, price or rating, so the copy
        # stays provider-neutral and the estimate is flagged as unverified
        # (guardrails.md: "prefix uncertain facts with *belum terverifikasi*").
        url = f"https://www.google.com/search?q={quote_plus(name + ' ' + provider)}"
        price = "*belum terverifikasi* — cek langsung di situs penyedia"
        rating = None
        desc = (
            f"Kursus {skill.title()} dari {provider}. Detail harga, durasi dan "
            "sertifikasi *belum terverifikasi* — konfirmasi di situs penyedia."
        )

        results.append(
            CourseRecommendation(
                name=name,
                provider=provider,
                duration=dur,
                url=url,
                price=price,
                rating=rating,
                description=desc,
                category="tech",
            )
        )

    if not results:
        results.append(
            CourseRecommendation(
                name="Dicoding Academy — Menjadi Web Developer Expert",
                provider="Dicoding",
                duration="3 bulan",
                url="https://www.dicoding.com/",
                price="Rp 500.000",
                rating=4.9,
                description="Kurikulum terlengkap di Indonesia untuk menguasai pemrograman web backend maupun frontend berstandar internasional.",
                category="tech",
            )
        )
    return results[:5]
