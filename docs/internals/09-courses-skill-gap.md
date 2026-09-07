# Courses & Skill-Gap Recommendations

Files:
- `backend/app/db/models.py` — `Course`, `SkillGapResult` tables
- `backend/app/agents/graph/nodes.py` — `_recommend_courses()` and its fallback tiers
- `backend/app/api/routers/seeker.py` — `POST /api/v1/seeker/skill-gap` and `GET /api/v1/seeker/skill-gap/latest`, the actual entry point
- `scripts/seed_courses.py` / `seed_all.py` — catalog seed (31 courses across 12 real Indonesian/international providers)

## Data Model

**`Course`:** `name`, `provider`, `category`, `skills_taught` (JSON array), `duration`, `cost_idr`, **`is_prakerja`** (eligible for the government's Kartu Prakerja training subsidy — a distinctly Indonesian signal: `is_prakerja=true, cost_idr=0` means effectively free for the user), `level`, `description`.

**`SkillGapResult`:** persists a seeker's computed gap analysis + recommended courses — the analysis is reusable across sessions instead of recomputed per chat turn.

## How Recommendations Happen

**Not triggered inside the LangGraph agent flow.** The real entry point is `POST /api/v1/seeker/skill-gap` (`seeker.py`), a standalone endpoint the frontend calls directly — see `05-ai-agent.md` for why: `nodes.py`'s multi-node pipeline (which would have had a `skill_gap` intent/node) was removed as dead code, and `agent.py`'s `/agent/invoke` only ever returns job matches, never `recommended_courses`. `seeker.py` imports `_recommend_courses` from `nodes.py` directly and calls it inline; that's the only place in the codebase the function is used.

The flow, per request:
1. Load the seeker's profile and all active jobs.
2. Rank jobs with `SemanticMatcher.rank_jobs_for_seeker()`.
3. Resolve a target job: the caller's `target_job_id` if given, else the top-ranked match.
4. Compute `missing_skills` / `matching_skills` = the target job's `required_skills` minus/intersected with the seeker's skills, both sides normalized through `_normalize_skill()` (the same canonical map matching uses).
5. Derive a few presentation numbers, none of which are measured outcomes — all clearly-labeled estimates:
   - `match_before` = `max(explicit_skill_match_ratio, the target job's actual hybrid score)`
   - `match_after` = a scenario projection assuming every missing skill gets acquired: `min(match_before + missing_ratio * 0.85, 1.0)`
   - `gap_severity` — `"high"` if ≥50% of required skills are missing, `"medium"` if ≥25%, else `"low"`
   - `estimated_hours` — 10 hours per missing skill, capped at 120
   - `estimated_readiness_months` — `max(1, missing_count // 2)`
6. Get course recommendations (three-tier chain below).
7. Persist a `SkillGapResult` row (best-effort; a persist failure is logged and swallowed, not raised) so `GET /skill-gap/latest` can reload the same result without recomputing.

**Three-tier fallback chain** (`_recommend_courses()` in `nodes.py`):

```
Tier 1 — LLM (Gemini): given missing_skills + target job, recommend
         specific courses with reasoning
   │ (no API key / failure / weak output)
   ▼
Tier 2 — DB lookup: courses WHERE skills_taught ∩ missing_skills ≠ ∅
   │ (no overlap found)
   ▼
Tier 3 — Hardcoded catalog: common skill → provider map (37 skills, nodes.py `_COURSE_CATALOG`)
         (Python → Dicoding, Figma → Binar Academy, …)
```

All three tiers normalize skill names through the matcher's `_normalize_skill` canonical map (`matcher.py`) before comparing, so alias spellings on the job posting ("Node.js") still match a course's `skills_taught` entry ("Node") instead of silently missing and falling through to a lower, less-specific tier.

The tiers trade quality for reliability: the LLM personalizes ("ambil kelas Data Science Hacktiv8 karena targetmu Data Scientist dan bisa dicicil via Prakerja"), the DB tier is correct-but-generic, tier 3 guarantees the UI never renders an empty recommendation slot. Tier 3 entries are honest about their own weakness: price/rating/URL are not real (a Google-search link, `rating=None`, and a `price` string literally reading `"*belum terverifikasi* — cek langsung di situs penyedia"` — "not yet verified, check the provider's site directly") — the catalog only guarantees a course *name and provider exist to look up*, not that KerjaCerdas has verified current pricing or availability.

## Product Logic

The chain **seeker → dream job → gap → course → (eventually) match** is the platform's retention loop for the majority of users who *don't* match well today — a `stretch` band match plus a concrete, often Prakerja-subsidized path to close the gap converts "no results" into a roadmap.

Catalog is currently seed-data (Dicoding, Hacktiv8, Purwadhika, Skill Academy, MySkill, Binar Academy, Apple Developer Academy ID, RevoU, Arkademi, Cakap, Udemy, Coursera ID) with realistic Indonesia-market pricing — **not a live affiliate integration**; see [ROADMAP.md](../ROADMAP.md) §3.1 for the planned Ed-Tech affiliate partnership. A real deployment would sync provider catalogs or let providers self-serve listings.
