"""Exploratory matching benchmark — short, messy SMK-pemula CVs.

⚠️  DIRECTIONAL SIGNAL, NOT PROOF. One synthetic JD + ~100 synthetic CVs. The
real proof is a recruiter-labelled benchmark. This script exists to probe the
project's #1 technical risk: does semantic embedding actually beat keyword
matching on SHORT, MESSY, SPARSE Indonesian vocational CVs whose skills are
phrased differently from the job description? That lexical-miss case is exactly
where matching's value is most contestable, so the synthetic CVs are modelled to
be deliberately sparse and informal.

Headline metric = LIFT = (semantic top-band recall) − (keyword top-band recall)
on the lexically-varied "good" candidates.

Run:  python -m scripts.benchmark_matching --manual-seconds-per-cv 30

Needs a real GEMINI_API_KEY to be meaningful; without it the embedder is the
offline HashEmbedder (cosine ≈ 0) and a loud NOT-VALID banner is printed.
"""

from __future__ import annotations

import argparse
import asyncio
import time

from backend.app.db.schemas import (
    Education,
    EducationLevel,
    JobPosting,
    SeekerProfile,
    Skill,
)
from backend.app.services.matching.embeddings.gemini import HashEmbedder, get_embedder
from backend.app.services.matching.matcher import SemanticMatcher, _skill_overlap

# Band thresholds mirror backend/app/config/settings.py defaults (scores in 0..1).
STRONG_TH = 0.65
POSSIBLE_TH = 0.45

REGIONS = ["3171", "3578", "3273", "3375"]


def build_job() -> JobPosting:
    """A realistic SMK-target vocational entry role; skills phrased *formally*."""
    return JobPosting(
        employer_id="bench-emp",
        title="Teknisi Jaringan Junior",
        description=(
            "Dibutuhkan teknisi jaringan pemula untuk instalasi dan pemeliharaan "
            "jaringan komputer kantor. Tugas: konfigurasi perangkat jaringan, "
            "pemeliharaan jaringan, dan troubleshooting koneksi."
        ),
        required_skills=[
            "jaringan komputer",
            "konfigurasi jaringan",
            "pemeliharaan jaringan",
            "troubleshooting",
        ],
        region_code="3171",
        education_min=EducationLevel.SMA,
    )


# "good" candidates: genuinely network-capable, but every skill is phrased with
# concrete/synonym vocabulary that shares ZERO literal tokens with the JD skills.
GOOD_SKILL_SETS = [
    ["mikrotik", "setting lan"],
    ["cisco", "konfigurasi router"],
    ["wifi", "perbaikan koneksi internet"],
    ["instalasi kabel utp", "switch"],
    ["oprek mikrotik", "warnet"],
    ["routerboard", "winbox"],
]
GOOD_HEADLINES = [
    "lulusan smk tkj, bisa setting jaringan warnet",
    "anak tkj suka oprek mikrotik sama lan",
    "smk jaringan, paham cisco basic",
    "bisa pasang wifi sama benerin koneksi",
]
GOOD_RESUMES = [
    "magang 3 bln di warnet, install mikrotik sama lan",
    "biasa benerin koneksi kantor, setting router winbox",
    "",  # some have no resume text at all
    "pkl di toko komputer, pasang kabel utp",
]

# distractors: other vocational tracks, unrelated to networking.
DISTRACTORS = [
    {
        "skills": ["memasak", "tata boga"],
        "headline": "lulusan smk tata boga",
        "major": "Tata Boga",
        "resume": "magang di dapur restoran",
    },
    {
        "skills": ["servis motor", "otomotif"],
        "headline": "smk otomotif bisa servis motor",
        "major": "TBSM",
        "resume": "pkl di bengkel motor",
    },
    {
        "skills": ["edit video", "adobe premiere"],
        "headline": "anak multimedia bisa edit video",
        "major": "Multimedia",
        "resume": "",
    },
    {
        "skills": ["pembukuan", "jurnal"],
        "headline": "lulusan akuntansi smk",
        "major": "Akuntansi",
        "resume": "magang input pembukuan",
    },
    {
        "skills": ["desain grafis", "photoshop"],
        "headline": "bisa desain pakai photoshop",
        "major": "DKV",
        "resume": "",
    },
    {
        "skills": ["mengetik cepat", "input data"],
        "headline": "smk administrasi perkantoran",
        "major": "OTKP",
        "resume": "magang arsip kantor",
    },
]


def _smk(major: str) -> Education:
    return Education(
        institution="SMK Negeri Contoh",
        degree=EducationLevel.SMA,
        major=major,
        graduation_year=2024,
    )


def build_seekers(n: int = 100, n_good: int = 20) -> list[tuple[SeekerProfile, bool]]:
    out: list[tuple[SeekerProfile, bool]] = []
    for i in range(n):
        is_good = i < n_good
        if is_good:
            skills = GOOD_SKILL_SETS[i % len(GOOD_SKILL_SETS)]
            headline = GOOD_HEADLINES[i % len(GOOD_HEADLINES)]
            resume = GOOD_RESUMES[i % len(GOOD_RESUMES)]
            major = "Teknik Komputer dan Jaringan"
        else:
            d = DISTRACTORS[i % len(DISTRACTORS)]
            skills, headline, resume, major = d["skills"], d["headline"], d["resume"], d["major"]
        seeker = SeekerProfile(
            user_id=f"bench-u-{i:03d}",
            full_name=f"Kandidat {i:03d}",
            headline=headline,
            region_code=REGIONS[i % len(REGIONS)],
            skills=[Skill(name=s) for s in skills],
            education=[_smk(major)],
            resume_text=resume,
            salary_expectation_min=4_000_000,
            salary_expectation_max=5_500_000,
        )
        out.append((seeker, is_good))
    return out


def _band(score: float) -> str:
    return "strong" if score >= STRONG_TH else "possible" if score >= POSSIBLE_TH else "stretch"


def _recall_in_strong(score_by_id: dict[str, float], good_ids: set[str]) -> float:
    if not good_ids:
        return 0.0
    hits = sum(1 for gid in good_ids if _band(score_by_id.get(gid, 0.0)) == "strong")
    return hits / len(good_ids)


async def run(manual_seconds_per_cv: float) -> None:
    job = build_job()
    labeled = build_seekers()
    seekers = [s for s, _ in labeled]
    good_ids = {s.id for s, g in labeled if g}

    embedder = get_embedder()
    using_hash = isinstance(embedder, HashEmbedder)

    matcher = SemanticMatcher()
    await matcher.embed_job(job)
    for s in seekers:
        await matcher.embed_seeker(s)

    t0 = time.perf_counter()
    ranked = await matcher.rank_seekers_for_job(job, seekers, top_k=len(seekers))
    ai_seconds = time.perf_counter() - t0

    sem_score = {r["seeker_id"]: float(r["score"]) for r in ranked}
    kw_score = {
        s.id: _skill_overlap([sk.name for sk in s.skills], job.required_skills) for s in seekers
    }

    sem_recall = _recall_in_strong(sem_score, good_ids)
    kw_recall = _recall_in_strong(kw_score, good_ids)
    lift = sem_recall - kw_recall

    n = len(seekers)
    manual_seconds = n * manual_seconds_per_cv
    reduction = (1 - ai_seconds / manual_seconds) if manual_seconds else 0.0

    print("=" * 72)
    print("KerjaCerdas - matching benchmark (EXPLORATORY / DIRECTIONAL, NOT PROOF)")
    print("Case: short, messy SMK-pemula CVs; good candidates use skill vocab")
    print("      that shares zero literal tokens with the JD (lexical-miss case).")
    print("=" * 72)
    if using_hash:
        print()
        print("!!! RESULTS NOT VALID FOR LIFT: ran on HashEmbedder (cosine ~ 0).   !!!")
        print("!!! Set GEMINI_API_KEY to measure real embedding lift.             !!!")
        print()
    print(
        f"embedder           : {type(embedder).__name__} (model={getattr(embedder, 'model', '?')})"
    )
    print(f"candidates         : {n}  (good={len(good_ids)}, distractors={n - len(good_ids)})")
    print(f"JD required_skills : {job.required_skills}")
    print("-" * 72)
    print("HEADLINE - top-band (Strong) recall of the lexically-varied good CVs:")
    print(f"  keyword-only baseline : {kw_recall:6.1%}")
    print(f"  semantic (hybrid)     : {sem_recall:6.1%}")
    print(f"  >>> LIFT (sem - kw)   : {lift:+6.1%}")
    print("-" * 72)
    print(f"time-to-shortlist (AI rank of {n} CVs): {ai_seconds * 1000:.0f} ms")
    print(f"illustrative manual baseline @ {manual_seconds_per_cv:.0f}s/CV: {manual_seconds:.0f}s")
    print(f"  (ASSUMPTION, not a measured human time) -> reduction ~ {reduction:.0%}")
    print("=" * 72)
    print("Interpretation: positive lift on this messy text = the semantic step")
    print("adds real value where keyword matching fails. ~0 lift = the risk has")
    print("bitten (or you're on HashEmbedder). Use this score distribution to")
    print("calibrate band thresholds in settings.py before trusting the bands.")
    print("=" * 72)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="KerjaCerdas matching benchmark (exploratory / directional)."
    )
    parser.add_argument(
        "--manual-seconds-per-cv",
        type=float,
        default=30.0,
        help="Illustrative manual screening time per CV (an assumption, not measured).",
    )
    args = parser.parse_args()
    asyncio.run(run(args.manual_seconds_per_cv))


if __name__ == "__main__":
    main()
