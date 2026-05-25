"""LangGraph node functions for the KerjaCerdas agent.

Each node is a pure async function: AgentState → partial state update.
All model names and temperatures are read from settings — never hard-coded.

Data flow through the graph (nodes share AgentState keys):
  router      → sets intent
  matcher     → sets matches[], matching_skills[], missing_skills[]
  skill_gap   → reads matches (from matcher), sets missing_skills, recommended_courses
  advisor     → reads matches + missing_skills + recommended_courses for full context
  compose     → formats final_response from all of the above
"""
from __future__ import annotations

import logging
import re

from backend.app.agents.graph.state import AgentState, Intent
from backend.app.db.schemas import CourseRecommendation

logger = logging.getLogger(__name__)


# ── 1. Router ─────────────────────────────────────────────────────────────────

_MATCH_RE = re.compile(r"(cari|rekomend|cocok|match|lowongan|pekerjaan|kerja)", re.I)
_GAP_RE   = re.compile(r"(skill|gap|kurang|belajar|kursus|upskill|tingkat)", re.I)
_ADV_RE   = re.compile(r"(saran|tips|karier|gaji|negosiasi|interview|cv|resume)", re.I)


async def route_intent(state: AgentState) -> dict:
    """Classify user intent from the message using lightweight regex."""
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
    """Embed seeker + cosine-rank all candidate jobs.

    Writes:
      matches[]           — ranked MatchResult list
      matching_skills[]   — skills the seeker already has (vs top job)
      missing_skills[]    — skills they're missing (vs top job)

    Both skill lists are derived here for the simplest case so skill_gap and
    advisor nodes have something to work with even if they're not the primary
    intent path.
    """
    from backend.app.services.matching.matcher import SemanticMatcher
    matcher = SemanticMatcher()
    seeker  = state["seeker"]
    jobs    = state.get("candidate_jobs", [])
    matches = await matcher.rank_jobs_for_seeker(seeker, jobs)

    # Pre-compute skill overlap vs top match so downstream nodes don't repeat this
    matching_skills: list[str] = []
    missing_skills:  list[str] = []
    if matches and jobs:
        job_index = {j.id: j for j in jobs}
        top_job = job_index.get(matches[0].job_id)
        if top_job:
            seeker_lower = {s.name.lower(): s.name for s in (seeker.skills or [])}
            for req in (top_job.required_skills or []):
                if req.lower() in seeker_lower:
                    matching_skills.append(seeker_lower[req.lower()])
                else:
                    missing_skills.append(req)

    return {
        "matches": matches,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
    }


# ── 3. Skill-gap ──────────────────────────────────────────────────────────────

async def run_skill_gap(state: AgentState) -> dict:
    """Compute detailed skill gap between seeker and target job.

    Reads:  matches[] (from matcher node), target_job_id (optional)
    Writes: missing_skills[], matching_skills[], recommended_courses[]

    Uses matches[] populated by the preceding run_matcher call, so the gap is
    always anchored to a real job from the current session — no stale data.
    """
    seeker = state["seeker"]
    candidate_jobs = state.get("candidate_jobs", [])

    # Resolve target: explicit > top match already in state
    target = None
    if state.get("target_job_id"):
        target = next((j for j in candidate_jobs if j.id == state["target_job_id"]), None)
    if target is None and state.get("matches"):
        top_id = state["matches"][0].job_id
        target = next((j for j in candidate_jobs if j.id == top_id), None)
    if target is None:
        # No match context — return whatever matcher pre-computed
        return {
            "missing_skills": state.get("missing_skills", []),
            "matching_skills": state.get("matching_skills", []),
            "recommended_courses": [],
        }

    # Case-preserving comparison
    seeker_lower = {s.name.lower(): s.name for s in (seeker.skills or [])}
    matching_skills: list[str] = []
    missing_skills:  list[str] = []

    for req in (target.required_skills or []):
        if req.lower() in seeker_lower:
            matching_skills.append(seeker_lower[req.lower()])
        else:
            missing_skills.append(req)

    # Course recommendations — Gemini > JSON store courses > hardcoded catalog
    courses = await _recommend_courses(missing_skills, target)
    return {
        "missing_skills": missing_skills,
        "matching_skills": matching_skills,
        "recommended_courses": courses,
    }


async def _recommend_courses(missing: list[str], job) -> list[CourseRecommendation]:
    """Try Gemini first, then JSON store courses, then hardcoded catalog."""
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
                "missing_skills": missing,
                "target_job": getattr(job, "title", ""),
            })
            resp = await llm.ainvoke([
                SystemMessage(content=sys),
                HumanMessage(content=(
                    f"Rekomendasikan kursus spesifik untuk gap ini:\n{payload}\n"
                    "Kembalikan JSON: {\"recommended_courses\": [{\"name\":...,\"provider\":...,\"duration\":...}]}"
                )),
            ])
            raw = resp.content.strip()
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
        from backend.app.db.json_store import get_repositories
        repos = get_repositories()
        all_courses = await repos.courses.list()
        missing_lower = {s.lower() for s in missing}
        results: list[CourseRecommendation] = []
        seen: set[str] = set()
        for course in all_courses:
            taught = {t.lower() for t in (getattr(course, "skills_taught", None) or [])}
            if taught & missing_lower and course.name not in seen:
                seen.add(course.name)
                results.append(CourseRecommendation(
                    name=course.name,
                    provider=getattr(course, "provider", ""),
                    duration=getattr(course, "duration", ""),
                ))
        return results[:5]  # cap at 5 recommendations
    except Exception as exc:
        logger.debug("Course store lookup failed: %s", exc)
        return []


_COURSE_CATALOG: dict[str, tuple[str, str, str]] = {
    "python":             ("Python untuk Data Science",          "Dicoding",                     "1 bulan"),
    "sql":                ("SQL untuk Analisis Data",            "Dicoding",                     "1 bulan"),
    "javascript":         ("Belajar Dasar JavaScript",           "Dicoding",                     "1 bulan"),
    "react":              ("Kelas Pengembangan Web React",       "Dicoding",                     "2 bulan"),
    "docker":             ("Docker & Container Fundamentals",    "Hacktiv8",                     "3 minggu"),
    "kubernetes":         ("Kubernetes for Developers",          "Coursera ID",                  "2 bulan"),
    "go":                 ("Go Programming Language",            "Udemy",                        "1 bulan"),
    "machine learning":   ("Machine Learning Specialization",    "Coursera ID",                  "3 bulan"),
    "pytorch":            ("Deep Learning with PyTorch",         "Coursera ID",                  "3 bulan"),
    "tensorflow":         ("TensorFlow Developer Certificate",   "Coursera ID",                  "3 bulan"),
    "tableau":            ("Visualisasi Data Tableau",           "Skill Academy",                "3 minggu"),
    "power bi":           ("Power BI untuk Bisnis",              "MySkill",                      "1 bulan"),
    "figma":              ("UI Design with Figma",               "Binar Academy",                "2 bulan"),
    "flutter":            ("Flutter App Development",            "Dicoding",                     "2 bulan"),
    "kotlin":             ("Android Dev with Kotlin",            "Binar Academy",                "3 bulan"),
    "spark":              ("Big Data with Apache Spark",         "Purwadhika",                   "6 minggu"),
    "kafka":              ("Streaming Data with Kafka",          "Udemy",                        "3 minggu"),
    "airflow":            ("Data Pipeline with Airflow",         "Purwadhika",                   "4 minggu"),
    "sap":                ("SAP for Supply Chain",               "Pintaria",                     "6 bulan"),
    "bahasa inggris":     ("English for Careers",                "Cakap",                        "3 bulan"),
    "akuntansi":          ("Akuntansi Praktis UMKM",             "Arkademi",                     "2 bulan"),
    "excel":              ("Excel & Power BI Bisnis",            "MySkill",                      "1 bulan"),
    "digital marketing":  ("Digital Marketing Bersertifikat",    "Skill Academy",                "1 bulan"),
    "aws":                ("AWS Cloud Practitioner",             "Coursera ID",                  "2 bulan"),
    "grpc":               ("gRPC — Build Modern APIs",           "Udemy",                        "2 minggu"),
    "fastapi":            ("FastAPI — Building APIs with Python","Udemy",                        "3 minggu"),
    "statistics":         ("Statistics for Data Science",        "Coursera ID",                  "2 bulan"),
    "statistika":         ("Statistika untuk Analisis Data",     "Dicoding",                     "1 bulan"),
    "android":            ("Android Development with Kotlin",    "Dicoding",                     "2 bulan"),
    "ios":                ("iOS Development with Swift",         "Apple Developer Academy ID",   "9 bulan"),
    "terraform":          ("Infrastructure as Code — Terraform", "Coursera ID",                  "1 bulan"),
    "linux":              ("Linux Fundamentals",                 "Dicoding",                     "3 minggu"),
    "design system":      ("Design System Mastery",              "Binar Academy",                "1 bulan"),
    "user research":      ("User Research & UX Methods",         "Coursera ID",                  "6 minggu"),
    "supply chain":       ("Supply Chain Management",            "Coursera ID",                  "2 bulan"),
    "bahasa indonesia":   ("Bahasa Indonesia Profesional",       "Cakap",                        "1 bulan"),
    "komunikasi":         ("Komunikasi Profesional di Tempat Kerja", "Skill Academy",            "3 minggu"),
}


def _catalog_courses(missing: list[str]) -> list[CourseRecommendation]:
    """Hardcoded catalog fallback — always returns at least one result."""
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
    return results[:5]


# ── 4. Advisor (Gemini chat) ──────────────────────────────────────────────────

_FALLBACK_ADVICE = (
    "Lengkapi skill dan pengalaman di profil kamu, "
    "lalu jalankan Job Matching agar kami bisa memberikan saran yang lebih spesifik."
)


async def run_advisor(state: AgentState) -> dict:
    """Career advisor node — reads full state context from preceding nodes.

    The advisor has access to:
      - seeker profile (skills, experience, region)
      - matches[] (from run_matcher / advisor_pre_match)
      - missing_skills[] + recommended_courses[] (from run_skill_gap if present)

    This gives contextual, personalized advice rather than generic responses.
    """
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
        # Build rich context from all prior nodes
        context = _build_rich_context(state)
        resp = await llm.ainvoke([
            SystemMessage(content=sys_prompt),
            HumanMessage(content=f"{context}\n\nPertanyaan: {msg}"),
        ])
        return {"advisor_response": resp.content}

    except Exception as exc:
        logger.warning("Gemini advisor failed (%s) — using fallback", exc)
        return {"advisor_response": _build_fallback(state)}


def _build_rich_context(state: AgentState) -> str:
    """Build a rich context string from all state keys populated by prior nodes."""
    lines: list[str] = []

    s = state.get("seeker")
    if s:
        skills = ", ".join(sk.name for sk in (s.skills or []))
        exp = sum(1 for _ in (s.experience or []))
        lines.append(
            f"Profil: {s.full_name}, region {s.region_code}, "
            f"skill: {skills or 'belum diisi'}, {exp} posisi pengalaman."
        )

    matches = state.get("matches") or []
    if matches:
        top3 = matches[:3]
        job_lines = [f"  #{m.rank} job_id={m.job_id[:8]} skor={m.score:.0%} — {m.explanation}"
                     for m in top3]
        lines.append("Top match:\n" + "\n".join(job_lines))

    missing = state.get("missing_skills") or []
    matching = state.get("matching_skills") or []
    if matching or missing:
        lines.append(
            f"Skill sudah dimiliki: {', '.join(matching) or '—'}. "
            f"Masih perlu dipelajari: {', '.join(missing) or '—'}."
        )

    courses = state.get("recommended_courses") or []
    if courses:
        course_names = ", ".join(f"{c.name} ({c.provider})" for c in courses[:3])
        lines.append(f"Kursus direkomendasikan: {course_names}.")

    return "\n".join(lines) if lines else ""


def _build_fallback(state: AgentState) -> str:
    matches = state.get("matches") or []
    missing = state.get("missing_skills") or []
    if matches and missing:
        return (
            f"Match teratas kamu adalah job #{matches[0].job_id[:8]}… "
            f"(skor {matches[0].score:.0%}). "
            f"Skill yang perlu diperkuat: {', '.join(missing[:3])}."
        )
    if matches:
        top = matches[0]
        return (
            f"Rekomendasi teratas: job #{top.job_id[:8]}… "
            f"(skor {top.score:.0%}). {top.explanation}"
        )
    return _FALLBACK_ADVICE


# ── 5. Compose ────────────────────────────────────────────────────────────────

async def compose_response(state: AgentState) -> dict:
    """Format the final human-readable response from all node outputs."""
    intent = state.get("intent", "match_jobs")

    if intent == "match_jobs":
        matches = state.get("matches", [])
        if not matches:
            text = "Belum ada lowongan yang cocok. Lengkapi profil atau upload CV agar matching lebih akurat."
        else:
            lines = [f"Top {min(len(matches), 5)} rekomendasi lowongan:"]
            for m in matches[:5]:
                expl = m.explanation or ""
                lines.append(f"  {m.rank}. Job {m.job_id[:8]}… — {m.score:.0%}{' — ' + expl if expl else ''}")
            # Append quick skill gap hint if we computed it
            missing = state.get("missing_skills", [])
            if missing:
                lines.append(f"\nUntuk job teratas, skill yang perlu ditingkatkan: {', '.join(missing[:3])}.")
            text = "\n".join(lines)

    elif intent == "skill_gap":
        missing  = state.get("missing_skills", [])
        matching = state.get("matching_skills", [])
        courses  = state.get("recommended_courses", [])
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
                course_list = " | ".join(f"{c.name} ({c.provider})" for c in courses[:3])
                text += f"\nKursus rekomendasi: {course_list}."

    else:  # advise / fallback
        text = state.get("advisor_response", _FALLBACK_ADVICE)

    return {"final_response": text}
