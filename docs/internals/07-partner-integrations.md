# Partner & Course Integrations

> **Status check against the code:** despite the "Strategic Focus" framing this doc previously had, there is **no live integration with any external course/LMS provider** (Dicoding, Kartu Prakerja, Coursera, or otherwise) anywhere in the backend. What exists is (a) a seed-data course catalog and in-process recommendation logic — covered in full in `09-courses-skill-gap.md` — and (b) a generic partnership-inquiry intake form. This doc only covers (b) plus what NOT to claim about (a).

Files:
- `backend/app/api/routers/inquiries.py` — partnership inquiry intake (`POST /api/v1/inquiries`) and admin listing/status endpoints
- `backend/app/db/models.py` — `Course` table (seed data only, no provider API client) and `PartnershipInquiry` table
- see `09-courses-skill-gap.md` for the actual skill-gap → course recommendation logic, which lives in `backend/app/agents/graph/nodes.py`, **not** in `matcher.py`

## What's actually built

1. **Course catalog** — a `Course` table (provider, `skills_taught`, duration, `is_prakerja`, cost) populated once by `scripts/seed_courses.py`/`seed_all.py` with 31 hand-written rows across 12 real Indonesian/international provider *names* (Dicoding, Hacktiv8, Purwadhika, Skill Academy, MySkill, Binar Academy, Apple Developer Academy ID, RevoU, Arkademi, Cakap, Udemy, Coursera ID). No provider's actual API is called to fetch, sync, verify, or deep-link into a real course — the URLs/prices/`is_prakerja` flags are seed-data the KerjaCerdas team entered by hand. **[BUILT — static seed data, not a live catalog sync]**

2. **Skill-to-course matching** — three-tier fallback logic (Gemini reasoning → DB lookup against the seed catalog → a hardcoded skill→course map) in `backend/app/agents/graph/nodes.py`'s `_recommend_courses()`, called from `POST /api/v1/seeker/skill-gap` (`seeker.py`). See `09-courses-skill-gap.md` for the full mechanism. **[BUILT]** — but "matching" here means comparing a missing-skill string against the seed catalog's `skills_taught` field, not any real provider integration.

3. **Partnership inquiries** — `POST /api/v1/inquiries` lets any authenticated-or-anonymous caller (`get_current_user_optional`) submit a category/name/organization/email/message, persisted to the `partnership_inquiries` table. This is the actual mechanism behind "training/enterprise partners can reach out" — it's a contact form with a DB row, not an integration. **[BUILT]**
   - `GET /api/v1/inquiries` and `PATCH /api/v1/inquiries/{id}` (admin listing/status-update) both call `_require_admin_routes_enabled()`, which 404s the route unless `settings.admin_routes_enabled` is true — and that setting **defaults to `False`** because there is no admin-role/auth layer in the codebase yet. In the shipped default configuration, submitted inquiries can be written but **not read back through the API** — someone has to query the DB directly today. **[BUILT, DEMO MODE — admin surface is disabled by default]**

## What is not built

- No Dicoding, Kartu Prakerja, Coursera, or any other LMS/course-provider API client exists in this codebase.
- No automated catalog sync, no affiliate-link tracking, no provider-side enrollment webhook.
- No admin UI/route is reachable by default to triage partnership inquiries (see above).

`ROADMAP.md` §3.1 tracks a planned Ed-Tech affiliate partnership as future work — treat any "integration" language for Dicoding/Prakerja as **[PLANNED]**, not built.
