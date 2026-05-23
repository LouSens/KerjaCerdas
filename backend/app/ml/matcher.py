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

import math
from typing import Iterable

from backend.app.db.schemas import JobPosting, MatchResult, SeekerProfile
from backend.app.ml.embeddings.gemini import get_embedder


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


def _explain(
    job: JobPosting,
    seeker_skill_names: list[str],
    cos: float,
    skill_overlap: float,
    region_ok: bool,
    salary_ok: bool,
) -> str:
    """Human-readable explanation, preserving original skill casing."""
    s_lower = {x.lower() for x in seeker_skill_names}
    matched = [s for s in job.required_skills if s.lower() in s_lower]
    missing  = [s for s in job.required_skills if s.lower() not in s_lower]
    parts = [f"skill cocok {len(matched)}/{len(job.required_skills)}"]
    if region_ok:
        parts.append("lokasi sesuai")
    if salary_ok:
        parts.append("gaji masuk ekspektasi")
    if missing:
        parts.append(f"perlu tambah: {', '.join(missing[:3])}")
    return "; ".join(parts)


# ── Matcher ───────────────────────────────────────────────────────────────────

class SemanticMatcher:
    def __init__(self) -> None:
        self.embedder = get_embedder()
        # Weights from settings — lazy-loaded once
        self._w: dict | None = None

    def _weights(self) -> dict:
        if self._w is None:
            from backend.app.config.settings import settings as s
            total = (s.matching_cosine_weight + s.matching_skill_weight
                     + s.matching_region_weight + s.matching_salary_weight
                     + s.matching_experience_weight)
            self._w = {
                "cosine":     s.matching_cosine_weight / total,
                "skill":      s.matching_skill_weight / total,
                "region":     s.matching_region_weight / total,
                "salary":     s.matching_salary_weight / total,
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
    ) -> list[MatchResult]:
        from backend.app.config.settings import settings
        if top_k is None:
            top_k = settings.matching_top_k

        query_vec = await self.embedder.embed(
            _build_seeker_text(seeker), task_type="RETRIEVAL_QUERY"
        )
        seeker_skill_names = [s.name for s in seeker.skills]
        years_exp = _experience_years(seeker)
        w = self._weights()

        scored: list[MatchResult] = []
        for j in jobs:
            if not j.is_active:
                continue

            cos    = cosine(query_vec, j.embedding or [])
            skill  = _skill_overlap(seeker_skill_names, j.required_skills)

            region_ok = (
                j.region_code == seeker.region_code
                or j.region_code in (seeker.preferred_regions or [])
                or (j.remote_allowed and seeker.open_to_remote)
            )

            if seeker.salary_expectation_min == 0:
                salary_ok = True
            else:
                salary_ok = (
                    j.salary_max >= seeker.salary_expectation_min
                    and j.salary_min <= max(seeker.salary_expectation_max, j.salary_max)
                )

            # Experience: how many years has seeker vs what job requires
            exp_score = min(1.0, years_exp / max(j.experience_years_min, 1))

            score = (
                w["cosine"]     * max(cos, 0.0)
                + w["skill"]    * skill
                + w["region"]   * float(region_ok)
                + w["salary"]   * float(salary_ok)
                + w["experience"] * exp_score
            )

            scored.append(MatchResult(
                job_id=j.id,
                seeker_id=seeker.id,
                score=round(score, 4),
                cosine=round(cos, 4),
                skill_overlap=round(skill, 4),
                region_match=bool(region_ok),
                salary_in_range=bool(salary_ok),
                rank=0,
                explanation=_explain(j, seeker_skill_names, cos, skill, region_ok, salary_ok),
            ))

        scored.sort(key=lambda m: m.score, reverse=True)
        for i, m in enumerate(scored[:top_k], start=1):
            m.rank = i
        return scored[:top_k]

    async def rank_seekers_for_job(
        self,
        job: JobPosting,
        seekers: Iterable[SeekerProfile],
        top_k: int | None = None,
    ) -> list[dict]:
        """Reverse matching: given a job, rank seekers by fit. Used by employer dashboard."""
        from backend.app.config.settings import settings
        if top_k is None:
            top_k = settings.matching_top_k

        query_vec = await self.embedder.embed(
            _build_job_text(job), task_type="RETRIEVAL_QUERY"
        )
        scored: list[dict] = []
        for s in seekers:
            cos   = cosine(query_vec, s.embedding or [])
            skill = _skill_overlap([sk.name for sk in s.skills], job.required_skills)
            score = round(0.60 * max(cos, 0.0) + 0.40 * skill, 4)
            scored.append({
                "seeker_id":   s.id,
                "full_name":   s.full_name,
                "headline":    s.headline,
                "skills":      [sk.name for sk in s.skills],
                "region_code": s.region_code,
                "score":       score,
                "skill_overlap": round(skill, 4),
                "missing_skills": [r for r in job.required_skills
                                   if r.lower() not in {sk.name.lower() for sk in s.skills}],
            })
        scored.sort(key=lambda x: x["score"], reverse=True)
        for i, item in enumerate(scored[:top_k], 1):
            item["rank"] = i
        return scored[:top_k]
