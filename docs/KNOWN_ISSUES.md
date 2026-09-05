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

- **Production compose runs the Vite dev server**, while FastAPI's production static mount expects a built `frontend/dist`. Build the SPA in a multi-stage image and serve it through the API or a static server instead. The `.replit` workflow has the same shape: `Start application` runs `npm run dev`, not a production build.
- **VPS deployment is manual.** `release.yml` builds and publishes tagged images to GHCR; pulling and restarting containers on the VPS itself is still a manual step (see the roadmap's automated-deployment item in [`ROADMAP.md`](ROADMAP.md)). Superseded in practice by the Replit deployment plan below, but the Docker/GHCR path still exists in the repo and should either be kept in sync or explicitly marked as the non-Replit path.

## Deployment (Replit + Cloudflare Tunnel)

Findings specific to putting the current codebase behind a Cloudflare Tunnel in front of a Replit deployment — verified against `backend/app/api/middleware/rate_limiter.py`, `backend/app/api/main.py`, and `backend/app/config/settings.py`.

- **The rate limiter and any IP-based logic will misidentify every visitor as the same client once traffic goes through the tunnel.** `_get_client_ip()` in `rate_limiter.py` deliberately reads `request.client.host` (the raw TCP peer) and ignores `X-Forwarded-For` — the code comment explains this is correct for a *direct-to-internet* deployment, because a client can set `X-Forwarded-For` to anything. But `cloudflared` sits between the visitor and the app: every request FastAPI sees will have `request.client.host` equal to the tunnel daemon's local connection, not the visitor's real IP. In practice this means either all traffic gets bucketed into one rate-limit key (one heavy user's requests start 429-ing everyone else), or the sliding-window counters become meaningless. Cloudflare's own edge sets a `CF-Connecting-IP` header that a client cannot forge as long as the app only accepts traffic arriving through the tunnel — `_get_client_ip()` needs a branch that trusts that header (or a configured trusted-proxy header) specifically when the deployment is fronted by the tunnel, not a blanket trust of `X-Forwarded-For`.
- **`/docs`, `/redoc`, and `/openapi.json` are unconditionally public.** Nothing in `main.py` gates `docs_url`/`redoc_url`/`openapi_url` on `settings.is_production`. This was a "low" severity note when the app only lived on a private Replit workspace or a not-yet-linked VPS; once a Cloudflare Tunnel puts the API on the public internet under a real domain, the full route/schema surface (every request/response shape, every endpoint) becomes publicly browsable by default.
- **The production security guards only trip if `APP_ENV=production` is actually set in the deployment's secrets.** `main.py` raises if `JWT_SECRET_KEY` is missing *and* `settings.is_production`, and similarly fails closed on `otp_demo_enabled` in production — but both checks are inert under the default `app_env: str = "development"`. If the Replit deployment's secrets don't explicitly set `APP_ENV=production` (and `JWT_SECRET_KEY`, and `OTP_DEMO_ENABLED=false`), the app will run publicly, through the tunnel, in its dev-mode defaults — ephemeral JWT secret (invalidates every restart, and worse, is *not* a hard failure), OTP codes returned in-band, verbose logging — with no error raised anywhere to signal the misconfiguration.
- **CORS origins need the tunnel's public hostname.** `_replit_origins()` already reads `REPLIT_DEV_DOMAIN`/`REPLIT_DOMAINS` so same-origin Replit access works out of the box, but a Cloudflare Tunnel typically fronts a custom or `trycloudflare.com` domain that isn't either of those — if the SPA and API end up on different origins through the tunnel (as opposed to the SPA being served by the same FastAPI process), that domain needs to be added to `cors_allow_origins` via env var, or credentialed cross-origin requests will be silently rejected by the browser.
- **Process-local state assumes one process.** The rate limiter's in-memory counters and the matcher's in-process query-embedding LRU (`backend/app/services/matching/matcher.py`) both assume a single long-lived process. This is fine on a Replit Reserved-VM-style always-on deployment (one process), but would silently desync (inconsistent rate limits, cold caches) if the deployment ever moves to something that runs more than one instance. Worth a one-line confirmation in the deploy runbook of which Replit deployment type is in use, so this doesn't get revisited by surprise later.

## Next priorities

Ranked highest-leverage first, folding in the Replit + Cloudflare Tunnel deployment findings above:

1. **Fix `_get_client_ip()` to trust `CF-Connecting-IP` (or an explicitly configured trusted-proxy header) when the deployment is behind the Cloudflare Tunnel.** Blocks correct rate limiting the moment the tunnel goes live — highest impact, lowest effort of the deployment items.
2. **Gate `docs_url`/`redoc_url`/`openapi_url` on `settings.is_production`** (or behind auth) before the tunnel exposes the API publicly.
3. **Add a deployment-secrets checklist (or a startup assertion) for `APP_ENV=production`, `JWT_SECRET_KEY`, and `OTP_DEMO_ENABLED=false`** so a missing secret fails loudly instead of silently serving dev-mode defaults to the public internet.
4. **Confirm the Cloudflare Tunnel's public hostname is covered by CORS** if the SPA and API are ever split across origins through the tunnel.
5. Consolidate the two re-embed scripts into one canonical implementation.
6. Reconcile the dual domain models — at minimum, add a test that fails if the ORM and Pydantic `User` definitions' field sets diverge.
7. Pick one schema source of truth — retire the root `database/init.sql`/`kerjacerdas.db` snapshot, or regenerate it from Alembic in CI.
8. Define and test RLS policies (or explicitly document that tenant isolation is application-layer only for now).
9. Add `vitest`, `@playwright/test`, and `msw` to `devDependencies`, and drop one of the two lockfiles.
10. Build a multi-stage production image for the frontend (or a `vite build` step in the Replit deployment) instead of running the Vite dev server as production.
