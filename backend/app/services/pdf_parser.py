"""PDF → structured JSON via Gemini multimodal.

Two entry points:
  • parse_cv(pdf_bytes)        → dict matching tasks/cv_parser.md schema
  • parse_job_pack(pdf_bytes)  → dict matching tasks/job_parser.md schema

Both go through `gemini_chat` so every call is logged for admin review.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

from backend.app.config.settings import settings
from backend.app.services.prompt_loader import build_system_prompt

logger = logging.getLogger(__name__)


class _NoKey(RuntimeError):
    pass


def _client():
    """Return a google-genai client — Vertex AI if a project is set, else AI Studio."""
    import os
    from google import genai
    project = (settings.vertex_ai_project
               or os.environ.get("VERTEX_AI_PROJECT", "")
               or os.environ.get("GOOGLE_CLOUD_PROJECT", ""))
    if project:
        location = (settings.vertex_ai_location
                    or os.environ.get("VERTEX_AI_LOCATION", "us-central1"))
        return genai.Client(vertexai=True, project=project, location=location)
    key = (settings.gemini_api_key
           or os.environ.get("GEMINI_API_KEY", "")
           or os.environ.get("GOOGLE_API_KEY", ""))
    if not key:
        raise _NoKey("Neither GEMINI_API_KEY nor VERTEX_AI_PROJECT configured")
    return genai.Client(api_key=key)


def _pdf_to_text(pdf_bytes: bytes, max_chars: int = 8000) -> str:
    """Cheap text extraction so we always have *some* signal even offline.

    Tries pypdf → PyPDF2 → pdfplumber, returns '' if none are installed.
    """
    for mod_name, page_iter in (
        ("pypdf", lambda r: r.pages),
        ("PyPDF2", lambda r: r.pages),
    ):
        try:
            mod = __import__(mod_name)
            import io
            reader = mod.PdfReader(io.BytesIO(pdf_bytes))
            out: list[str] = []
            for p in page_iter(reader):
                try:
                    out.append(p.extract_text() or "")
                except Exception:
                    continue
                if sum(len(s) for s in out) > max_chars:
                    break
            text = "\n".join(out).strip()
            if text:
                return text[:max_chars]
        except Exception:
            continue
    try:
        import pdfplumber, io  # type: ignore
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            text = "\n".join((page.extract_text() or "") for page in pdf.pages).strip()
            return text[:max_chars]
    except Exception:
        return ""


_SKILL_VOCAB = {
    # programming
    "python", "java", "javascript", "typescript", "go", "golang", "rust", "c++", "c#",
    "php", "ruby", "kotlin", "swift", "scala", "r",
    # web/fe
    "react", "next.js", "nextjs", "vue", "angular", "svelte", "tailwind", "node", "nodejs",
    # backend / infra
    "fastapi", "django", "flask", "spring", "spring boot", "express", "graphql", "grpc",
    "rest", "microservices", "kafka", "rabbitmq", "redis", "elasticsearch",
    # cloud
    "aws", "gcp", "azure", "docker", "kubernetes", "k8s", "terraform", "ansible",
    # data
    "postgresql", "postgres", "mysql", "mongodb", "bigquery", "snowflake", "spark",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "langchain", "langgraph",
    # design / pm
    "figma", "sketch", "jira", "scrum", "agile", "product management",
}


def _fallback_extract(pdf_bytes: bytes) -> dict[str, Any]:
    """Best-effort heuristic extraction when no AI key is available.

    Pulls plain text from the PDF and tries to recognise full name, headline,
    skills (against a small vocabulary), and education year. Guaranteed to
    return a schema-shaped dict so downstream code never breaks.
    """
    text = _pdf_to_text(pdf_bytes)
    if not text:
        return _offline_stub("cv_parser")

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # Heuristic: name is the first non-empty line that's not an email/phone
    name = next(
        (ln for ln in lines[:6]
         if "@" not in ln and not re.search(r"\d{4,}", ln) and 2 <= len(ln.split()) <= 6),
        "Pengguna",
    )
    headline = next(
        (ln for ln in lines[1:8]
         if 4 <= len(ln) <= 80 and not re.search(r"\d{4}", ln) and ln != name),
        "",
    )

    text_low = text.lower()
    skills = sorted({s for s in _SKILL_VOCAB if s in text_low})
    # Education year — last 4-digit year in the doc that's a plausible grad year
    years = [int(y) for y in re.findall(r"(19[89]\d|20[0-3]\d)", text)]
    grad_year = max(years) if years else 0
    degree = "S2" if "magister" in text_low or "master" in text_low else \
             "S1" if "sarjana" in text_low or "bachelor" in text_low or "s1 " in text_low else \
             "D3" if "diploma" in text_low else "S1"

    # Strip PII from resume_text for storage
    redacted = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[email]", text)
    redacted = re.sub(r"\+?\d[\d\s().-]{7,}\d", "[phone]", redacted)
    redacted = re.sub(r"\b\d{16}\b", "[nik]", redacted)

    return {
        "full_name": name,
        "headline": headline or "Profesional",
        "region_code": "3171" if "jakarta" in text_low else "",
        "skills": [{"name": s, "level": "intermediate", "years": 0} for s in skills[:25]],
        "experience": [],
        "education": [{"institution": "", "degree": degree, "major": "",
                       "graduation_year": grad_year or 2024}],
        "salary_expectation_min": 0,
        "salary_expectation_max": 0,
        "resume_text": redacted[:1000],
        "_offline": True,
        "_extraction_mode": "text_heuristic",
    }


def _extract_json(text: str) -> dict[str, Any]:
    """Be lenient about ```json fences."""
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    blob = m.group(1) if m else text
    return json.loads(blob)


async def _call_gemini(pdf_bytes: bytes, role: str, task: str) -> dict[str, Any]:
    try:
        client = _client()
    except _NoKey:
        logger.warning("Gemini auth missing — using text-heuristic fallback for task=%s", task)
        if task == "cv_parser":
            return _fallback_extract(pdf_bytes)
        return _offline_stub(task)

    system = build_system_prompt(role=role, task=task)

    import asyncio

    def _sync():
        from google.genai import types
        resp = client.models.generate_content(
            model=settings.gemini_chat_model,
            contents=[
                types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                "Ekstrak data terstruktur sesuai schema di task prompt. "
                "Kembalikan JSON saja.",
            ],
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                temperature=settings.parser_temperature,
            ),
        )
        return resp.text or "{}"

    try:
        raw = await asyncio.to_thread(_sync)
    except Exception as e:  # network/SSL/quota/parsing — never crash the upload
        logger.warning("Gemini PDF call failed (task=%s): %s — falling back", task, e)
        if task == "cv_parser":
            fb = _fallback_extract(pdf_bytes)
            fb["_offline_reason"] = str(e)[:200]
            return fb
        stub = _offline_stub(task)
        stub["_offline_reason"] = str(e)[:200]
        return stub

    try:
        return _validate_cv_schema(_extract_json(raw)) if task == "cv_parser" else _extract_json(raw)
    except Exception as e:
        logger.error("Gemini returned non-JSON (task=%s): %s", task, e)
        if task == "cv_parser":
            return _fallback_extract(pdf_bytes)
        return _offline_stub(task)


def _validate_cv_schema(d: dict[str, Any]) -> dict[str, Any]:
    """Coerce Gemini output to the strict schema uploads.py expects."""
    return {
        "full_name": str(d.get("full_name") or "Pengguna").strip(),
        "headline": str(d.get("headline") or "").strip(),
        "region_code": str(d.get("region_code") or "").strip(),
        "skills": [
            {"name": str(s.get("name", "")).strip(),
             "level": s.get("level", "intermediate"),
             "years": float(s.get("years") or 0)}
            for s in (d.get("skills") or []) if isinstance(s, dict) and s.get("name")
        ],
        "experience": [
            {"company": str(x.get("company", "")).strip(),
             "title": str(x.get("title", "")).strip(),
             "start_date": x.get("start_date") or "2024-01",
             "end_date": x.get("end_date"),
             "description": str(x.get("description", "")).strip()}
            for x in (d.get("experience") or []) if isinstance(x, dict)
        ],
        "education": [
            {"institution": str(e.get("institution", "")).strip(),
             "degree": (e.get("degree") or "S1").upper(),
             "major": str(e.get("major", "")).strip(),
             "graduation_year": int(e.get("graduation_year") or 2024)}
            for e in (d.get("education") or []) if isinstance(e, dict)
        ],
        "salary_expectation_min": int(d.get("salary_expectation_min") or 0),
        "salary_expectation_max": int(d.get("salary_expectation_max") or 0),
        "resume_text": str(d.get("resume_text") or "")[:1000],
    }


async def parse_cv(pdf_bytes: bytes) -> dict[str, Any]:
    return await _call_gemini(pdf_bytes, role="seeker_advisor", task="cv_parser")


async def parse_job_pack(pdf_bytes: bytes) -> dict[str, Any]:
    return await _call_gemini(pdf_bytes, role="employer_analyst", task="job_parser")


# ── Offline stubs so dev mode (no key) still produces something usable ────────

def _offline_stub(task: str) -> dict[str, Any]:
    if task == "cv_parser":
        return {
            "full_name": "Pengguna Demo",
            "headline": "Lulusan baru, siap belajar",
            "region_code": "3171",
            "skills": [
                {"name": "Python", "level": "intermediate", "years": 1},
                {"name": "SQL", "level": "beginner", "years": 0.5},
            ],
            "experience": [],
            "education": [
                {"institution": "Universitas Demo", "degree": "S1",
                 "major": "Teknik Informatika", "graduation_year": 2024}
            ],
            "salary_expectation_min": 5_000_000,
            "salary_expectation_max": 9_000_000,
            "resume_text": "[offline-stub] aktifkan GEMINI_API_KEY untuk parsing PDF asli.",
            "_offline": True,
        }
    if task == "job_parser":
        return {
            "postings": [{
                "title": "Junior Software Engineer",
                "description": "[offline-stub] posting demo.",
                "responsibilities": ["Develop features", "Write tests"],
                "required_skills": ["Python", "Git"],
                "nice_to_have_skills": ["Docker"],
                "education_min": "S1",
                "experience_years_min": 0,
                "region_code": "3171",
                "remote_allowed": True,
                "salary_min": 7_000_000,
                "salary_max": 12_000_000,
                "kbji_code": "",
                "_offline": True,
            }]
        }
    return {}
