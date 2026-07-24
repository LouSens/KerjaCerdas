# Courses & Skill-Gap Recommendations

Files:
- `backend/app/db/models.py` — `Course`, `SkillGapResult` tables
- `backend/app/agents/graph/nodes.py` — recommendation logic (agent-triggered)
- `backend/scripts/seed_courses.py` / `seed_all.py` — catalog seed (15 real Indonesian providers)

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
Tier 3 — Hardcoded catalog: common skill → provider map
         (Python → Dicoding, Figma → Binar Academy, …)
```

The tiers trade quality for reliability: the LLM personalizes ("ambil Bangkit ML path karena targetmu Data Scientist dan gratis via Prakerja"), the DB tier is correct-but-generic, tier 3 guarantees the UI never renders an empty recommendation slot.

## Product Logic

The chain **seeker → dream job → gap → course → (eventually) match** is the platform's retention loop for the majority of users who *don't* match well today — a `stretch` band match plus a concrete, often Prakerja-subsidized path to close the gap converts "no results" into a roadmap.

Catalog is currently seed-data (Bangkit, Hacktiv8, Purwadhika, RevoU, Dicoding, Skill Academy, Cakap, …) with realistic pricing; a real deployment would sync provider catalogs or let providers self-serve listings.
