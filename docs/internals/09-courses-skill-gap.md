# Courses & Skill-Gap Recommendations

Files:
- `backend/app/db/models.py` — `Course`, `SkillGapResult` tables
- `backend/app/agents/graph/nodes.py` — recommendation logic (agent-triggered)
- `scripts/seed_courses.py` / `seed_all.py` — catalog seed (32 courses across 12 real Indonesian/international providers)

## Data Model

**`Course`:** `name`, `provider`, `category`, `skills_taught` (JSON array), `duration`, `cost_idr`, **`is_prakerja`** (eligible for the government's Kartu Prakerja training subsidy — a distinctly Indonesian signal: `is_prakerja=true, cost_idr=0` means effectively free for the user), `level`, `description`.

**`SkillGapResult`:** persists a seeker's computed gap analysis + recommended courses — the analysis is reusable across sessions instead of recomputed per chat turn.

## How Recommendations Happen

Triggered inside the agent flow (`skill_gap` intent, or alongside matching). The gap itself falls out of the matcher for free: `missing_skills` = required minus matched (already computed for every match explanation — see `01-matching-algorithm.md`).

**Three-tier fallback chain:**

```
Tier 1 — LLM (Gemini): given missing_skills + target job, recommend
         specific courses with reasoning
   │ (no API key / failure / weak output)
   ▼
Tier 2 — DB lookup: courses WHERE skills_taught ∩ missing_skills ≠ ∅
   │ (no overlap found)
   ▼
Tier 3 — Hardcoded catalog: common skill → provider map (36 skills, nodes.py `_COURSE_CATALOG`)
         (Python → Dicoding, Figma → Binar Academy, …)
```

All three tiers normalize skill names through the matcher's `_normalize_skill` canonical map (`matcher.py`) before comparing, so alias spellings on the job posting ("Node.js") still match a course's `skills_taught` entry ("Node") instead of silently missing and falling through to a lower, less-specific tier.

The tiers trade quality for reliability: the LLM personalizes ("ambil kelas Data Science Hacktiv8 karena targetmu Data Scientist dan bisa dicicil via Prakerja"), the DB tier is correct-but-generic, tier 3 guarantees the UI never renders an empty recommendation slot.

## Product Logic

The chain **seeker → dream job → gap → course → (eventually) match** is the platform's retention loop for the majority of users who *don't* match well today — a `stretch` band match plus a concrete, often Prakerja-subsidized path to close the gap converts "no results" into a roadmap.

Catalog is currently seed-data (Dicoding, Hacktiv8, Purwadhika, Skill Academy, MySkill, Binar Academy, Apple Developer Academy ID, RevoU, Arkademi, Cakap, Udemy, Coursera ID) with realistic Indonesia-market pricing — **not a live affiliate integration**; see [ROADMAP.md](../ROADMAP.md) §3.1 for the planned Ed-Tech affiliate partnership. A real deployment would sync provider catalogs or let providers self-serve listings.
