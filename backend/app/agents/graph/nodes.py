"""LangGraph node functions for the KerjaCerdas agent.

Each node is a pure async function: AgentState -> partial state update.
All model names and temperatures are read from settings — never hard-coded.
"""
from __future__ import annotations

import logging
import re

from backend.app.agents.graph.state import AgentState, Intent
from backend.app.db.schemas import CourseRecommendation
from backend.app.ml.matcher import SemanticMatcher

logger = logging.getLogger(__name__)


# ── 1. Router ─────────────────────────────────────────────────────────────────

_MATCH_RE = re.compile(r"(cari|rekomend|cocok|match|lowongan|pekerjaan|kerja)", re.I)
_GAP_RE   = re.compile(r"(skill|gap|kurang|belajar|kursus|upskill|tingkat)", re.I)
_ADV_RE   = re.compile(r"(saran|tips|karier|gaji|negosiasi|interview|cv|resume)", re.I)


async def route_intent(state: AgentState) -> dict:
    msg = (state.get("user_message") or "").strip()
    if not msg:
        intent: Intent = "match_jobs"
    elif _GAP_RE.search(msg):
        intent = "skill_gap"
    elif _ADV_RE.search(msg):
        intent = "advise"
    elif _MATCH_RE.search(msg):
        intent = "match_jobs"
    else:
        intent = "match_jobs"
    return {"intent": intent, "reasoning": f"heuristic: {msg[:80]}"}


# ── 2. Matcher ────────────────────────────────────────────────────────────────

async def run_matcher(state: AgentState) -> dict:
    matcher = SemanticMatcher()
    seeker = state["seeker"]
    jobs   = state.get("candidate_jobs", [])
    matches = await matcher.rank_jobs_for_seeker(seeker, jobs)
    return {"matches": matches}


# ── 3. Skill-gap ──────────────────────────────────────────────────────────────

async def run_skill_gap(state: AgentState) -> dict:
    seeker = state["seeker"]

    # Resolve target job: explicit > top match
    target = None
    candidate_jobs = state.get("candidate_jobs", [])
    if state.get("target_job_id"):
        target = next((j for j in candidate_jobs if j.id == state["target_job_id"]), None)
    if target is None and state.get("matches"):
        top_id = state["matches"][0].job_id
        target = next((j for j in candidate_jobs if j.id == top_id), None)
    if target is None:
        return {"missing_skills": [], "matching_skills": [], "recommended_courses": []}

    # Case-preserving comparison
    seeker_lower = {s.name.lower(): s.name for s in seeker.skills}
    matching_skills: list[str] = []
    missing_skills:  list[str] = []

    for req in target.required_skills:
        if req.lower() in seeker_lower:
            matching_skills.append(seeker_lower[req.lower()])  # original seeker casing
        else:
            missing_skills.append(req)  # job's declared casing

    # Course recommendations — try Gemini first, fall back to catalog
    courses = await _recommend_courses(missing_skills, target)
    return {
        "missing_skills": missing_skills,
        "matching_skills": matching_skills,
        "recommended_courses": courses,
    }


async def _recommend_courses(missing: list[str], job) -> list[CourseRecommendation]:
    """Try Gemini for course suggestions; fall back to local catalog."""
    from backend.app.config.settings import settings
    import os, json

    if not missing:
        return []

    gemini_key = (settings.gemini_api_key
                  or os.environ.get("GEMINI_API_KEY", "")
                  or os.environ.get("GOOGLE_API_KEY", ""))
    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import HumanMessage, SystemMessage
            from backend.app.services.prompt_loader import build_system_prompt

            llm = ChatGoogleGenerativeAI(
                model=settings.gemini_chat_model,
                temperature=settings.skill_gap_temperature,
            )
            sys = build_system_prompt(role="seeker_advisor", task="skill_gap")
            payload = json.dumps({
                "seeker_skills": [],
                "required_skills": [s.name for s in getattr(job, "required_skills", [])]
                                   if hasattr(job, "required_skills") else job.required_skills,
                "missing_skills": missing,
            })
            resp = await llm.ainvoke([
                SystemMessage(content=sys),
                HumanMessage(content=f"Data skill gap:\n{payload}\nKembalikan JSON sesuai schema."),
            ])
            data = json.loads(resp.content)
            return [
                CourseRecommendation(**c)
                for c in data.get("recommended_courses", [])
                if c.get("name")
            ]
        except Exception as exc:
            logger.warning("Gemini skill-gap failed (%s) — using local catalog", exc)

    return _catalog_courses(missing)


_COURSE_CATALOG: dict[str, tuple[str, str, str]] = {
    "python":          ("Python untuk Data Science",          "Dicoding",         "1 bulan"),
    "sql":             ("SQL untuk Analisis Data",            "Dicoding",         "1 bulan"),
    "javascript":      ("Belajar Dasar JavaScript",           "Dicoding",         "1 bulan"),
    "react":           ("Kelas Pengembangan Web React",       "Dicoding",         "2 bulan"),
    "docker":          ("Docker & Container Fundamentals",    "Hacktiv8",         "3 minggu"),
    "kubernetes":      ("Kubernetes for Developers",          "Coursera ID",      "2 bulan"),
    "go":              ("Go Programming Language",            "Udemy",            "1 bulan"),
    "machine learning": ("Machine Learning Specialization",   "Coursera ID",      "3 bulan"),
    "pytorch":         ("Deep Learning with PyTorch",         "Coursera ID",      "3 bulan"),
    "tensorflow":      ("TensorFlow Developer Certificate",   "Coursera ID",      "3 bulan"),
    "tableau":         ("Visualisasi Data Tableau",           "Skill Academy",    "3 minggu"),
    "power bi":        ("Power BI untuk Bisnis",              "MySkill",          "1 bulan"),
    "figma":           ("UI Design with Figma",               "Binar Academy",    "2 bulan"),
    "flutter":         ("Flutter App Development",            "Dicoding",         "2 bulan"),
    "kotlin":          ("Android Dev with Kotlin",            "Binar Academy",    "3 bulan"),
    "spark":           ("Big Data with Apache Spark",         "Purwadhika",       "6 minggu"),
    "kafka":           ("Streaming Data with Kafka",          "Udemy",            "3 minggu"),
    "airflow":         ("Data Pipeline with Airflow",         "Purwadhika",       "4 minggu"),
    "sap":             ("SAP for Supply Chain",               "Pintaria",         "6 bulan"),
    "bahasa inggris":  ("English for Careers",                "Cakap",            "3 bulan"),
    "akuntansi":       ("Akuntansi Praktis UMKM",             "Arkademi",         "2 bulan"),
    "excel":           ("Excel & Power BI Bisnis",            "MySkill",          "1 bulan"),
    "digital marketing": ("Digital Marketing Bersertifikat",  "Skill Academy",    "1 bulan"),
    "aws":             ("AWS Cloud Practitioner",             "Coursera ID",      "2 bulan"),
}


def _catalog_courses(missing: list[str]) -> list[CourseRecommendation]:
    seen: set[str] = set()
    results: list[CourseRecommendation] = []
    for skill in missing:
        entry = _COURSE_CATALOG.get(skill.lower())
        if entry and entry[0] not in seen:
            seen.add(entry[0])
            results.append(CourseRecommendation(name=entry[0], provider=entry[1], duration=entry[2]))
    if not results:
        results.append(CourseRecommendation(
            name="Bangkit Academy — Tech Generalist Path",
            provider="Bangkit (Kominfo + GoTo + Traveloka)",
            duration="6 bulan",
        ))
    return results


# ── 4. Advisor (Gemini chat) ──────────────────────────────────────────────────

_FALLBACK_ADVICE = (
    "Lengkapi skill dan pengalaman di profil kamu, "
    "lalu jalankan Job Matching agar kami bisa memberikan saran yang lebih spesifik."
)


async def run_advisor(state: AgentState) -> dict:
    from backend.app.config.settings import settings
    import os

    msg = state.get("user_message", "")
    gemini_key = (settings.gemini_api_key
                  or os.environ.get("GEMINI_API_KEY", "")
                  or os.environ.get("GOOGLE_API_KEY", ""))
    if not gemini_key:
        return {"advisor_response": _build_fallback(state)}

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage, SystemMessage
        from backend.app.services.prompt_loader import build_system_prompt

        llm = ChatGoogleGenerativeAI(
            model=settings.gemini_chat_model,
            temperature=settings.advisor_temperature,
        )
        sys_prompt = build_system_prompt(role="seeker_advisor")
        context = _profile_context(state)
        resp = await llm.ainvoke([
            SystemMessage(content=sys_prompt),
            HumanMessage(content=f"{context}\n\nPertanyaan: {msg}"),
        ])
        return {"advisor_response": resp.content}

    except Exception as exc:
        logger.warning("Gemini advisor failed (%s) — using fallback", exc)
        return {"advisor_response": _build_fallback(state)}


def _profile_context(state: AgentState) -> str:
    s = state.get("seeker")
    if not s:
        return ""
    skills = ", ".join(sk.name for sk in (s.skills or []))
    exp_years = sum(1 for _ in s.experience)
    return (
        f"Profil pengguna: {s.full_name}, region {s.region_code}, "
        f"skill: {skills or 'belum diisi'}, {exp_years} posisi pengalaman."
    )


def _build_fallback(state: AgentState) -> str:
    matches = state.get("matches") or []
    if matches:
        top = matches[0]
        return (
            f"Rekomendasi teratas untuk kamu: job #{top.job_id[:8]}… "
            f"(skor {top.score:.0%}). {top.explanation}"
        )
    return _FALLBACK_ADVICE


# ── 5. Compose ────────────────────────────────────────────────────────────────

async def compose_response(state: AgentState) -> dict:
    intent = state.get("intent", "match_jobs")

    if intent == "match_jobs":
        matches = state.get("matches", [])
        if not matches:
            text = "Belum ada lowongan yang cocok. Lengkapi profil atau upload CV agar matching lebih akurat."
        else:
            lines = [f"Top {min(len(matches), 5)} rekomendasi lowongan:"]
            for m in matches[:5]:
                lines.append(f"  {m.rank}. Job {m.job_id[:8]}… — {m.score:.0%} ({m.explanation})")
            text = "\n".join(lines)

    elif intent == "skill_gap":
        missing = state.get("missing_skills", [])
        matching = state.get("matching_skills", [])
        courses = state.get("recommended_courses", [])
        if not missing and not matching:
            text = "Jalankan Job Matching terlebih dahulu agar analisis skill gap punya target."
        elif not missing:
            text = "Semua skill wajib sudah kamu miliki! Pertimbangkan melamar sekarang."
        else:
            text = (
                f"Skill sudah cocok: {', '.join(matching) or '—'}. "
                f"Masih perlu: {', '.join(missing)}."
            )
            if courses:
                text += f" Kursus rekomendasi: {courses[0].name} ({courses[0].provider})."

    else:
        text = state.get("advisor_response", _FALLBACK_ADVICE)

    return {"final_response": text}
