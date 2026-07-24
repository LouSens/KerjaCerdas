# Jobs CRUD & Employer Features

Files:
- `backend/app/api/routers/jobs.py` — public browsing
- `backend/app/api/routers/employer.py` — employer CRUD + candidate tools
- `backend/app/api/routers/seeker.py` — seeker profile endpoints

## Public Browsing (no auth)

| Endpoint | Behavior |
|---|---|
| `GET /api/v1/jobs` | list with filters: region, type, salary range, experience. Each result is enriched with a `verified` flag pulled from the posting employer's verification status (see `04-identity-verification.md`) |
| `GET /api/v1/jobs/{id}` | full job detail |

## Employer Endpoints (`require_employer`)

| Endpoint | Behavior |
|---|---|
| `POST /employer/jobs` | create job → **immediately embeds** via `SemanticMatcher.embed_job` so it's matchable the moment it exists |
| `PATCH /employer/jobs/{id}` | update; **re-embeds only if `description` or `required_skills` changed** — cosmetic edits (salary, title tweaks) skip the Gemini call |
| `DELETE /employer/jobs/{id}` | remove listing |
| `POST /employer/jobs/estimate` | **live pool preview while composing a job**: cheap heuristic (skill overlap + location, no embeddings, no LLM) estimating how many seekers would match. UX: employer sees "≈14 kandidat" update as they type requirements |
| `POST /employer/jobs/{id}/candidates` | reverse matching — full ranking of seekers for this job, banded, shuffled within band, **numeric score never shown** (see `01-matching-algorithm.md` §3) |

## Design Notes

- **Write-time embedding** keeps search always-fresh at the cost of ~100 ms on job-write requests — the right trade at current scale, would move to a queue at high write volume.
- **The estimate endpoint is deliberately dumb.** It exists to be called on every keystroke of the job form; using the real matcher there would mean an embedding call per keystroke. Heuristic ≈ good enough for a ballpark count.
- **Selective re-embedding** on PATCH is a cost micro-optimization that matters: employers tweak salaries and titles constantly; only semantic-field changes invalidate the vector.
- **Ownership checks** on PATCH/DELETE — an employer can only mutate their own listings.

## Seeker Side (`require_seeker`)

Profile CRUD (headline, skills with level/years, experience, education, salary expectations, preferred regions) — every semantic change re-embeds the profile, same pattern as jobs. CV upload (see `03-cv-upload-parsing.md`) is the bulk alternative to manual profile editing.
