# Jobs CRUD & Employer Features

Files:
- `backend/app/api/routers/jobs.py` — public browsing
- `backend/app/api/routers/employer.py` — employer CRUD + candidate tools
- `backend/app/api/routers/seeker.py` — seeker profile endpoints

## Public Browsing (no auth)

| Endpoint | Behavior |
|---|---|
| `GET /api/v1/jobs` | list with filters: region, type, salary range, experience. Each result is enriched with a `verified` flag pulled from the posting employer's `Employer.verified` field via `_is_employer_verified()`. The field becomes `VERIFIED` only when an admin approves the employer's review request (`POST /api/v1/admin/employer-reviews/{employer_id}`); see the `admin_reviewed` badge in [04-trust-and-verification.md](04-trust-and-verification.md#3-employer-trust-badges--servicestrustpolicypy). |
| `GET /api/v1/jobs/{id}` | full job detail |

## Employer Endpoints (`require_employer`)

| Endpoint | Behavior |
|---|---|
| `POST /employer/jobs` | create job → **immediately embeds** via `SemanticMatcher.embed_job` so it's matchable the moment it exists. Accepts an optional `client_ref` idempotency token — a repeat create with the same `(employer_id, client_ref)` returns the already-created job (`created: false`) instead of inserting a duplicate; see Job Pack below for the caller that always sets it. |
| `PATCH /employer/jobs/{id}` | update; **re-embeds only if `description` or `required_skills` changed** — cosmetic edits (salary, title tweaks) skip the Gemini call |
| `DELETE /employer/jobs/{id}` | remove listing |
| `POST /employer/jobs/estimate` | **live pool preview while composing a job**: cheap heuristic (skill overlap + location, no embeddings, no LLM) estimating how many seekers would match. UX: employer sees "≈14 kandidat" update as they type requirements |
| `POST /employer/jobs/{id}/candidates` | reverse matching — ranking of seekers for this job, banded, shuffled within band, **numeric score never shown** (see `01-matching-algorithm.md` §3). Ownership-checked (`_require_owned_job`). Candidates who did **not** apply to this job are **fully anonymised**: `full_name` becomes `"Kandidat #N"` and the headline is blanked. The old `"Someone at {company}"` teaser was removed — company/school plus region and experience was enough to re-identify the person on LinkedIn, which is exactly what the paywall was supposed to prevent. Each row also carries `skill_proof` and `proven_skill_count`. |
| `GET /employer/applications` | applicants for the caller's jobs, ranked by a **live** proof-weighted score (`matcher.score_pair`), each with `skill_proof`, `band`, `match_score_at_apply`, `source` and `email_verified`. On the free Spark tier every applicant is scored and the top `SPARK_RANKED_APPLICANT_LIMIT` (20) **by score** are revealed; the rest return `locked: true` with no personal data. The cap limits how many are opened, not which — ranking by arrival instead would hide a late-applying strong candidate behind the paywall, i.e. demonstrate a queue rather than a ranking on the tier every employer meets first. |
| `GET /employer/applications/{id}/interview-kit` | AI questions aimed at skills that are still only claimed, with a deterministic template fallback. Beacon/Lighthouse only (402 otherwise). |
| `POST /employer/applications/{id}/confirm-skills` | HR ticks "terbukti" after the interview → proof level 1.0 on the candidate's profile + a `skill_evidence` row. Requires the application to be at `interview` or later (409 otherwise); skill names outside the job/candidate are ignored. |
| `GET /employer/jobs/{id}/applicants.csv` | ranked CSV export. Beacon/Lighthouse only. |
| `POST /employer/jobs/{id}/appeal` | appeal a held/rejected posting; a rejected job returns to `held` for admin review. |
| `GET/POST /employer/trust*` | trust badges, strike state, and the "Ditinjau admin" request. |

**Contact details are never sold.** An applicant who applies has already given their contact to that
employer, so it is theirs for free; a candidate who has *not* applied stays anonymous and there is no
endpoint that reveals them. Employers pay per job (Beacon) or per month (Lighthouse) for ranking,
interview kits and export — never for access to a person.

## Moderation & share links

- Every `POST`/content-`PATCH` on a job runs AutoMod (`services/trust/`), which sets
  `moderation_status` (`published` / `held` / `rejected`) plus `moderation_reasons`, and keeps
  non-published jobs inactive. The response carries a ready-to-show `notice` for the poster.
- `public_code` gives each job a `/j/<code>` page and a server-rendered QR poster
  (`GET /api/v1/public/jobs/{code}/qr.svg`, `segno`). Codes are backfilled at startup for older rows.
- Plan limits live in `services/billing/plans.py`: Spark 1 active job, Lighthouse 5, plus any
  Beacon-covered job; a second strike also caps the employer at one active job for 30 days.

## Job Pack Bulk Upload (`backend/app/api/routers/uploads.py`)

`POST /uploads/job-pack` parses a multi-posting PDF via Gemini and returns
the extracted postings — **it creates nothing**. The employer reviews the
list in `JobPackUploader.jsx` and confirms which ones to publish; each
confirmed posting goes through the same `POST /employer/jobs` create call
above, carrying a `client_ref` derived from `sha256(file_hash : local_id :
title : region_code : salary_min : salary_max)`.

**Why parsing itself is cached server-side (`job_pack_parse_cache` table,
keyed by `sha256(employer_id + file bytes)`):** retrying an upload of the
identical file — a lost response, a reloaded tab, a different browser or
device — must return byte-identical postings to the first attempt, because
Gemini extraction isn't perfectly deterministic even at low temperature. A
reworded title or a reformatted salary on a second parse would change the
derived `client_ref`, and the backend would then treat the retry as a
brand-new posting instead of a replay — producing a duplicate vacancy on
confirm. Caching the parse itself (not just deduping the eventual publish)
closes that regardless of what the client's browser state looks like.

## Design Notes

- **Write-time embedding** keeps search always-fresh at the cost of ~100 ms on job-write requests — the right trade at current scale, would move to a queue at high write volume.
- **The estimate endpoint is deliberately dumb.** It exists to be called on every keystroke of the job form; using the real matcher there would mean an embedding call per keystroke. Heuristic ≈ good enough for a ballpark count.
- **Selective re-embedding** on PATCH is a cost micro-optimization that matters: employers tweak salaries and titles constantly; only semantic-field changes invalidate the vector.
- **Ownership checks** on PATCH/DELETE — an employer can only mutate their own listings.

## Seeker Side (`require_seeker`)

Profile CRUD (headline, skills with level/years, experience, education, salary expectations, preferred regions) — every semantic change re-embeds the profile, same pattern as jobs. CV upload (see `03-cv-upload-parsing.md`) is the bulk alternative to manual profile editing.

> **Where the paywall sits.** Ranked applicants are uncapped on every tier including Spark —
> ranking is a free computation, so a cap saved nothing and only hid the candidate ranked 21st from
> the employer who asked for a ranking. The quota sits on **reverse matching** (searching candidates
> who have not applied): Spark 0, Beacon 30, Lighthouse 150 per 30 days
> (`plans.talent_search_limit`). See
> [10-scoring-hr-feedback-and-plans.md](10-scoring-hr-feedback-and-plans.md).
