"""
Semantic k-rank matcher.

Pipeline:
  1. Embed the seeker query (RETRIEVAL_QUERY task type).
  2. Cosine-similarity against all job embeddings (RETRIEVAL_DOCUMENT).
  3. Rerank with structured features (region, salary, experience, skill overlap).
  4. Return top-K MatchResult with human-readable Bahasa Indonesia explanations.

Weights are read from settings so they can be tuned via .env without a code change.
"""

from __future__ import annotations

import hashlib
import math
import random
from collections.abc import Iterable

from backend.app.db.schemas import JobPosting, MatchResult, SeekerProfile
from backend.app.services.matching.embeddings.gemini import get_embedder

# ── Helpers ───────────────────────────────────────────────────────────────────


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    n = min(len(a), len(b))
    dot = sum(a[i] * b[i] for i in range(n))
    na = math.sqrt(sum(x * x for x in a[:n])) or 1.0
    nb = math.sqrt(sum(x * x for x in b[:n])) or 1.0
    return dot / (na * nb)


def _skill_overlap(seeker_names: list[str], required: list[str]) -> float:
    """Fraction of required skills the seeker has (case-insensitive)."""
    if not required:
        return 1.0
    s = {x.lower() for x in seeker_names}
    r = {x.lower() for x in required}
    return len(s & r) / len(r)


def _experience_years(seeker: SeekerProfile) -> float:
    """Sum actual years from work experience entries."""
    from datetime import date

    total = 0.0
    for exp in seeker.experience:
        try:
            sy, sm = (int(p) for p in (exp.start_date + "-01").split("-")[:2])
            start = date(sy, sm, 1)
            if exp.end_date:
                ey, em = (int(p) for p in (exp.end_date + "-01").split("-")[:2])
                end = date(ey, em, 1)
            else:
                end = date.today()
            total += max(0, (end - start).days / 365.25)
        except Exception:
            total += 1.0  # safe fallback: count the entry as 1 year
    return total


def _build_seeker_text(p: SeekerProfile) -> str:
    skills = ", ".join(s.name for s in p.skills)
    exp = " | ".join(f"{e.title} di {e.company}" for e in p.experience)
    edu = " | ".join(f"{e.degree.value} {e.major} {e.institution}" for e in p.education)
    return (
        f"{p.headline}\nKeahlian: {skills}\nPengalaman: {exp}\n"
        f"Pendidikan: {edu}\nCatatan: {p.resume_text}"
    )


def _build_job_text(j: JobPosting) -> str:
    return (
        f"{j.title}\n{j.description}\n"
        f"Skill wajib: {', '.join(j.required_skills)}\n"
        f"Nice to have: {', '.join(j.nice_to_have_skills)}\n"
        f"Tanggung jawab: {' | '.join(j.responsibilities)}"
    )


def _band_label(score: float, strong_th: float, possible_th: float) -> str:
    """Map a final score to a confidence band. Single source of truth for the
    Strong / Possible / Stretch cutoffs — used by both the seeker ranking and
    the employer `_assign_bands` so the two sides never drift apart."""
    return "strong" if score >= strong_th else "possible" if score >= possible_th else "stretch"


def _seeker_summary(band: str, matched: list[str], missing: list[str]) -> str:
    """Kind, actionable one-line explanation for the seeker's match card.

    The deliberate mirror image of `_candidate_summary`: built from the same
    skill intersection, but framed as *guidance for the person*, not evidence
    for a recruiter. It encourages on what fits and turns any gap into a
    concrete next step — never a score, never a ranking, never sales urgency.
    Stretch is presented as a reachable goal, with the gap as the first move.
    """
    matched_str = ", ".join(matched[:3])
    missing_str = ", ".join(missing[:2])
    if band == "strong":
        if matched:
            return f"Skill kamu—{matched_str}—nyambung kuat sama kebutuhan tim ini. Posisi yang pas buat kamu lamar."
        return "Profilmu nyambung kuat sama lowongan ini. Posisi yang pas buat kamu lamar."
    if band == "possible":
        base = (
            f"Kamu udah punya pondasi yang cocok lewat {matched_str}."
            if matched
            else "Ada irisan yang cocok antara profilmu dan lowongan ini."
        )
        if missing:
            return f"{base} Lengkapi {missing_str} biar makin siap."
        return f"{base} Tinggal poles dikit lagi."
    # stretch — a reach, framed as a goal; the gap is the first step, no hype
    if missing:
        return (
            f"Lowongan ini sedikit di luar jangkauanmu sekarang—anggap sebagai tujuan. "
            f"Mulai dari {missing_str}, dan ini jadi target yang realistis."
        )
    return (
        "Lowongan ini sedikit menantang buat profilmu sekarang—jadiin tujuan yang bisa kamu kejar."
    )


def _candidate_summary(required: list[str], matched: list[str], missing: list[str]) -> str:
    """Grounded, neutral Matched/Missing summary for the employer candidate card.

    Derived from the structured skill comparison (set intersection on the
    required skills vs. the seeker's listed skills) — NOT from the embedding
    score. That separation is what lets us show it honestly: it states "skills
    present vs. skills absent", never a hiring verdict or a call to action.
    """
    total = len(required)
    parts: list[str] = []
    if matched:
        parts.append(
            f"Sesuai pada {len(matched)} dari {total} skill wajib: {', '.join(matched[:4])}."
        )
    elif total:
        parts.append(
            "Belum ada skill wajib yang cocok eksplisit; kecocokan berbasis kesamaan profil."
        )
    else:
        parts.append("Lowongan ini tidak mencantumkan skill wajib spesifik.")
    if missing:
        parts.append(f"Belum terlihat di profil: {', '.join(missing[:4])}.")
    elif total:
        parts.append("Seluruh skill wajib terpenuhi.")
    return " ".join(parts)


def _assign_bands(
    candidates: list[dict],
    job_id: str,
    strong_th: float,
    possible_th: float,
) -> list[dict]:
    """Bucket ranked candidates into Strong/Possible/Stretch, then shuffle within
    each band so tiny score deltas don't imply a false hierarchy.

    The shuffle is seeded by a stable hash of the job id: ordering is stable per
    job across requests, but unbiased across candidates inside the same band.
    Embodies the product rule "AI orders attention; the human still decides" —
    the system groups candidates by fit instead of handing back a finalized
    top-N ranking.
    """
    for c in candidates:
        c["band"] = _band_label(c["score"], strong_th, possible_th)
    rng = random.Random(int(hashlib.sha256(job_id.encode()).hexdigest()[:8], 16))
    out: list[dict] = []
    for band in ("strong", "possible", "stretch"):
        group = [c for c in candidates if c["band"] == band]
        rng.shuffle(group)
        out.extend(group)
    for i, c in enumerate(out, start=1):
        c["rank"] = i
    return out


# ── Matcher ───────────────────────────────────────────────────────────────────


class SemanticMatcher:
    def __init__(self) -> None:
        self.embedder = get_embedder()
        # Weights from settings — lazy-loaded once
        self._w: dict | None = None

    def _weights(self) -> dict:
        if self._w is None:
            from backend.app.config.settings import settings as s

            total = (
                s.matching_cosine_weight
                + s.matching_skill_weight
                + s.matching_region_weight
                + s.matching_salary_weight
                + s.matching_experience_weight
            )
            self._w = {
                "cosine": s.matching_cosine_weight / total,
                "skill": s.matching_skill_weight / total,
                "region": s.matching_region_weight / total,
                "salary": s.matching_salary_weight / total,
                "experience": s.matching_experience_weight / total,
            }
        return self._w

    # ── Indexing ──────────────────────────────────────────────────────────────

    async def embed_job(self, job: JobPosting) -> JobPosting:
        from backend.app.config.settings import settings

        job.embedding = await self.embedder.embed(
            _build_job_text(job), task_type="RETRIEVAL_DOCUMENT"
        )
        job.embedding_model = settings.gemini_embed_model
        return job

    async def embed_seeker(self, seeker: SeekerProfile) -> SeekerProfile:
        from backend.app.config.settings import settings

        seeker.embedding = await self.embedder.embed(
            _build_seeker_text(seeker), task_type="RETRIEVAL_DOCUMENT"
        )
        seeker.embedding_model = settings.gemini_embed_model
        return seeker

    # ── Query / ranking ───────────────────────────────────────────────────────

    async def rank_jobs_for_seeker(
        self,
        seeker: SeekerProfile,
        jobs: Iterable[JobPosting],
        top_k: int | None = None,
        filters: dict | None = None,
    ) -> list[MatchResult]:
        from backend.app.config.settings import settings

        if top_k is None:
            top_k = settings.matching_top_k
        if filters is None:
            filters = {}

        query_vec = await self.embedder.embed(
            _build_seeker_text(seeker), task_type="RETRIEVAL_QUERY"
        )
        seeker_skill_names = [s.name for s in seeker.skills]

        scored: list[MatchResult] = []
        for j in jobs:
            if not j.is_active:
                continue

            cos = cosine(query_vec, j.embedding or [])
            skill = _skill_overlap(seeker_skill_names, j.required_skills)

            s_lower = {x.lower() for x in seeker_skill_names}
            matched = [s for s in j.required_skills if s.lower() in s_lower]
            missing = [s for s in j.required_skills if s.lower() not in s_lower]

            # 1. Base Score (Semantic + Skill Only)
            base_score = 0.60 * max(cos, 0.0) + 0.40 * skill

            # 2. Hybrid AI Boosts (Only applied if user actively sets filters)
            loc_boost = 0.0
            region_ok = False
            if filters.get("location"):
                target_loc = filters["location"].lower()
                if j.region_code.lower() == target_loc or target_loc in [
                    r.lower() for r in (seeker.preferred_regions or [])
                ]:
                    loc_boost = 0.15
                    region_ok = True

            sal_boost = 0.0
            salary_ok = False
            if filters.get("salary_min"):
                target_sal = int(filters["salary_min"])
                if j.salary_max >= target_sal:
                    sal_boost = 0.10
                    salary_ok = True

            exp_boost = 0.0
            if filters.get("experience_min"):
                target_exp = int(filters["experience_min"])
                if j.experience_years_min <= target_exp:
                    exp_boost = 0.10

            score = base_score + loc_boost + sal_boost + exp_boost
            band = _band_label(
                score,
                settings.band_strong_threshold,
                settings.band_possible_threshold,
            )

            scored.append(
                MatchResult(
                    job_id=j.id,
                    seeker_id=seeker.id,
                    score=round(score, 4),
                    cosine=round(cos, 4),
                    skill_overlap=round(skill, 4),
                    region_match=region_ok,
                    salary_in_range=salary_ok,
                    rank=0,
                    band=band,
                    # Kind, seeker-facing framing — the mirror of the employer's
                    # neutral `_candidate_summary`. No score, no rank, no urgency.
                    explanation=_seeker_summary(band, matched, missing),
                )
            )

        # Group strong -> possible -> stretch, then shuffle within each band so a
        # tiny score delta never reads as a strict "you're #4" ranking. Seeded by
        # the seeker id so ordering is stable per seeker across requests.
        scored.sort(key=lambda m: m.score, reverse=True)
        top = scored[:top_k]
        rng = random.Random(int(hashlib.sha256(seeker.id.encode()).hexdigest()[:8], 16))
        ordered: list[MatchResult] = []
        for band in ("strong", "possible", "stretch"):
            group = [m for m in top if m.band == band]
            rng.shuffle(group)
            ordered.extend(group)
        for i, m in enumerate(ordered, start=1):
            m.rank = i
        return ordered

    async def rank_seekers_for_job(
        self,
        job: JobPosting,
        seekers: Iterable[SeekerProfile],
        top_k: int | None = None,
        filters: dict | None = None,
    ) -> list[dict]:
        """Reverse matching: given a job, rank seekers by fit. Used by employer dashboard."""
        from backend.app.config.settings import settings

        if top_k is None:
            top_k = settings.matching_top_k
        if filters is None:
            filters = {}

        query_vec = await self.embedder.embed(_build_job_text(job), task_type="RETRIEVAL_QUERY")
        scored: list[dict] = []
        for s in seekers:
            cos = cosine(query_vec, s.embedding or [])
            skill = _skill_overlap([sk.name for sk in s.skills], job.required_skills)

            # Hybrid AI Boost based on filters
            loc_boost = 0.0
            if (
                filters.get("location")
                and filters["location"].lower() == (s.region_code or "").lower()
            ):
                loc_boost = 0.15

            exp_boost = 0.0
            if filters.get("experience_min"):
                years_exp = _experience_years(s)
                if years_exp >= int(filters["experience_min"]):
                    exp_boost = 0.10

            score = round(0.60 * max(cos, 0.0) + 0.40 * skill + loc_boost + exp_boost, 4)
            seeker_skill_lower = {sk.name.lower() for sk in s.skills}
            matched_skills = [r for r in job.required_skills if r.lower() in seeker_skill_lower]
            missing_skills = [r for r in job.required_skills if r.lower() not in seeker_skill_lower]
            scored.append(
                {
                    "seeker_id": s.id,
                    "full_name": s.full_name,
                    "headline": s.headline,
                    "skills": [sk.name for sk in s.skills],
                    # Matched = required skills the seeker actually has (the JD ∩ CV
                    # intersection), so the card shows fit, not the full skill dump.
                    "matching_skills": matched_skills,
                    "missing_skills": missing_skills,
                    "region_code": s.region_code,
                    # `score` stays in the payload as an internal engine output — the
                    # band is the headline; the employer card never paints the number.
                    "score": score,
                    "skill_overlap": round(skill, 4),
                    "explanation": _candidate_summary(
                        job.required_skills, matched_skills, missing_skills
                    ),
                }
            )
        scored.sort(key=lambda x: x["score"], reverse=True)
        # Band first: this assigns each candidate a band + rank and shuffles
        # within band so the recruiter never reads a tiny score delta as a strict
        # ranking. `explanation` already holds the neutral `_candidate_summary`.
        top_candidates = _assign_bands(
            scored[:top_k],
            job.id,
            settings.band_strong_threshold,
            settings.band_possible_threshold,
        )

        # When a key is configured, upgrade the evidentiary one-liner with an LLM
        # eval. Still employer-facing decision support — never the seeker framing.
        import os

        # Resolve the key the same way the embedder does. langchain's
        # ChatGoogleGenerativeAI does NOT read settings.gemini_api_key — it only
        # picks up GOOGLE_API_KEY/GEMINI_API_KEY from the env or an explicit
        # api_key param. Pass it explicitly so the LLM summary doesn't fall back.
        gemini_key = (
            settings.gemini_api_key
            or os.environ.get("GEMINI_API_KEY", "")
            or os.environ.get("GOOGLE_API_KEY", "")
        )

        if gemini_key:
            try:
                from langchain_core.messages import HumanMessage
                from langchain_google_genai import ChatGoogleGenerativeAI

                llm = ChatGoogleGenerativeAI(
                    model=settings.gemini_chat_model,
                    temperature=0.1,
                    api_key=gemini_key,
                )

                prompt = f"Anda adalah HR Assistant AI untuk platform KerjaCerdas.\nBerikan evaluasi SUPER SINGKAT (maks 1 kalimat, 10-15 kata) untuk masing-masing kandidat berikut ini berdasarkan kriteria loker: {job.title}\n"
                prompt += f"Skill Wajib Loker: {', '.join(job.required_skills)}\n\n"
                for c in top_candidates:
                    prompt += f"ID: {c['seeker_id']}\nSkill Kandidat: {', '.join(c['skills'])}\n"

                prompt += "\nFormat balasan HARUS (tanpa markdown blok, 1 baris per ID):\n[ID]: [evaluasi 1 kalimat]"

                response = await llm.ainvoke([HumanMessage(content=prompt)])
                # response.content may be a list of parts (Gemini streaming) or a plain str.
                raw_content = response.content
                if isinstance(raw_content, list):
                    raw_content = " ".join(
                        p if isinstance(p, str) else p.get("text", "") for p in raw_content
                    )
                lines = raw_content.split("\n")
                for c in top_candidates:
                    for line in lines:
                        if c["seeker_id"] in line and ":" in line:
                            parts = line.split(":", 1)
                            c["explanation"] = parts[1].strip()

            except Exception as e:
                import logging

                logging.getLogger(__name__).warning("LLM summary generation failed: %s", e)

        return top_candidates
