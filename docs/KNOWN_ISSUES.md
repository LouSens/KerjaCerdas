# Known Issues & Technical Debt

Engineering debt and open findings, each cited to a file so it can be checked directly against source.

## Architecture

- **Dual domain-model definitions.** Every core entity is defined twice: once as a SQLAlchemy ORM class in `backend/app/db/models.py` (`User`, `SeekerProfile`, `Employer`, `JobPosting`, `Application`, `Course`, …) and again as a same-named Pydantic model in `backend/app/db/schemas.py`. The two `User` definitions don't carry the same fields (`db/schemas.py`'s `User` has no `name` field; the ORM one does) — `backend/app/api/routers/auth.py` carries a workaround for this. Any future field added to one but not the other reproduces the same class of bug.
- **Two schema sources of truth.** `database/init.sql` and `database/kerjacerdas.db` at the repo root are a static schema snapshot, while `backend/alembic/` is the actual migration-managed schema. Two checked-in "sources of truth" for the same schema is a standing drift risk.
- **Two divergent re-embed scripts.** `scripts/reembed.py` and `scripts/re_embed.py` both re-embed stale job/seeker vectors with different implementations. Neither is marked canonical; a fix to one can silently miss the other.

## Database

- **RLS is enabled but has no policies.** `backend/alembic/versions/45d873583ae4_enable_rls_for_supabase.py` turns on row-level security for the relevant tables but defines no `CREATE POLICY` statements — tenant isolation currently relies entirely on the application layer (the per-endpoint `job.employer_id == employer.id` checks in `employer.py`), not the database.

## Frontend

- **`package.json` doesn't declare its own test dependencies.** `vitest`, `@playwright/test`, and `msw` are used directly by the test suite and driven via npm scripts, but are not listed in `devDependencies` — the manifest doesn't describe what the project's own tests need to run.
- **Two lockfiles coexist.** `frontend/package-lock.json` and `frontend/bun.lock` are both present, which risks two contributors resolving different dependency trees from the same `package.json`.
- **Test coverage is thin relative to surface area.** One unit-test file (`api.test.js`) and one e2e spec (`auth.spec.js`, login/register/rate-limit only) exist for 27 component files and a large global store. Matching UI, uploads, and verification flows have no automated coverage.

## Backend

- **No per-domain API versioning.** `backend/app/api/main.py` mounts all 10 routers under one global `/api/v1` prefix — there's no mechanism to version a single router independently if it needs a breaking change later.
- **No lockfile for backend Python dependencies.** `pyproject.toml` declares dependencies with lower-bound-only pins and there is no `poetry.lock`/`uv.lock`/`pdm.lock` — builds aren't reproducible across environments over time.

## Production readiness

- **Production compose runs the Vite dev server**, while FastAPI's production static mount expects a built `frontend/dist`. Build the SPA in a multi-stage image and serve it through the API or a static server instead.
- **VPS deployment is manual.** `release.yml` builds and publishes tagged images to GHCR; pulling and restarting containers on the VPS itself is still a manual step (see the roadmap's automated-deployment item in [`ROADMAP.md`](ROADMAP.md)).

## Next priorities

Ranked highest-leverage first:

1. Consolidate the two re-embed scripts into one canonical implementation.
2. Reconcile the dual domain models — at minimum, add a test that fails if the ORM and Pydantic `User` definitions' field sets diverge.
3. Pick one schema source of truth — retire the root `database/init.sql`/`kerjacerdas.db` snapshot, or regenerate it from Alembic in CI.
4. Define and test RLS policies (or explicitly document that tenant isolation is application-layer only for now).
5. Add `vitest`, `@playwright/test`, and `msw` to `devDependencies`, and drop one of the two lockfiles.
6. Build a multi-stage production image for the frontend instead of running `vite dev` in production compose.
