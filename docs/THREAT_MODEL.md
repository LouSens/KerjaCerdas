# Threat Model

## Project Overview

KerjaCerdas is an AI-powered job matching platform for Indonesia. A FastAPI backend (port 8000) serves a React/Vite frontend (port 5000 / 3000). Core features: user registration/login, seeker CV upload and profile management, employer job posting, semantic AI matching via Google Gemini embeddings, and a single-node LangGraph response layer (`START → agent_node → END`) that generates natural-language text for conversational job search. Routing between matcher/skill-gap/advisor logic is procedural Python, not graph edges, and tool-calling (`bind_tools()`) is currently disabled — see [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full architecture. This is not a ReAct or multi-agent tool-calling agent.

## Assets

- **User credentials** — email and bcrypt-hashed passwords stored in PostgreSQL.
- **Seeker profiles** — full name, skills, salary expectations, resume text, pgvector embeddings (768-dim). NIK is stored strictly as a SHA-256 hash.
- **Employer profiles and job postings** — company identity, job descriptions, salary bands.
- **JWT signing secret** — signs HS256 access tokens. Gated to high-entropy configuration in production.
- **Gemini API key** — paid AI service, protected by fallback chains and circuit breakers.
- **Verification & OTP records** — PostgreSQL-backed `otps` table with expiration timestamps and attempt limits.

## Trust Boundaries

- **Browser → Backend API** — all mutating and sensitive data endpoints require valid JWT authentication via Bearer token.
- **Backend → PostgreSQL** — SQLAlchemy async ORM with parameterized queries, atomic upserts (`ON CONFLICT DO UPDATE`), and connection pooling limits.
- **Backend → Google Gemini API** — outbound calls with API key via `llm_factory.py` with multi-model fallback chain and circuit breaker.
- **Public / Authenticated boundary** — job listings (`GET /jobs`) and health endpoints (`GET /health`) are public; all profile, upload, agent, and verification endpoints require a validated JWT.
- **Seeker / Employer role boundary** — strictly enforced via `require_seeker` and `require_employer` dependencies on respective routers.

## Scan Anchors

- **Production entry points**: `backend/app/api/main.py` (app factory + middleware stack: `log_requests` → `security_headers` → `CORSMiddleware` → `RateLimiterMiddleware` → `RequestSizeMiddleware`)
- **Protected mutation surfaces** (illustrative, not exhaustive — every router under `/api/v1/{seeker,employer}/*` requires `get_current_user` plus a role guard):
  - `POST /api/v1/uploads/cv` (`require_seeker`, magic bytes verified)
  - `POST /api/v1/uploads/job-pack` (`require_employer`, magic bytes verified)
  - `POST /api/v1/agent/invoke` (`get_current_user` — no anonymous path)
  - `POST/PATCH/DELETE /api/v1/employer/jobs*`, `POST /api/v1/employer/jobs/{id}/unlock/{seeker_id}` (`require_employer` + per-resource `_require_owned_job` ownership check)
  - `POST /api/v1/seeker/apply`, `POST /api/v1/seeker/bookmarks` (`require_seeker`)
  - `POST /api/v1/verify/identity`, `POST /api/v1/verify/otp/send`, `POST /api/v1/verify/otp/verify` (`get_current_user`)
- **Public surfaces**: `GET /api/v1/jobs*` (listing, detail, `/regions`, `/industries`), `GET /health`, `POST /api/v1/inquiries` (public contact-form submission)
- **Optional-auth surfaces** (work for both anonymous and logged-in callers via `get_current_user_optional`; identity is used only for bucketing, never required): `GET /api/v1/experiments/*`, `POST /api/v1/events/track`
- **Authenticated surfaces**: `/api/v1/seeker/*`, `/api/v1/employer/*`, `/api/v1/agent/invoke` (no anonymous path — unlike most matching-adjacent code, this endpoint always requires a valid JWT), `/api/v1/verify/*`
- **Authenticated + admin-gated surface**: `GET /api/v1/inquiries` and `PATCH /api/v1/inquiries/{id}` require a valid JWT (any role) **and** `settings.admin_routes_enabled` (off by default — `ADMIN_ROUTES_ENABLED` env var). There is no dedicated admin role yet; with the flag off, both routes 404 for every caller. See `inquiries.py::_require_admin_routes_enabled`.

## Threat Categories & Mitigations

### Spoofing
- JWT tokens are issued at login and validated on every protected request via `decode_access_token`.
- Hardcoded demo password bypasses have been completely removed from `auth.py`. All users must verify against salted bcrypt password hashes.
- `window.useStore` exposure removed in frontend to prevent token extraction via XSS.

### Tampering
- All upload and profile mutation endpoints derive the target `user_id` directly from the authenticated JWT claims, preventing caller-supplied ID spoofing.
- Atomic `ON CONFLICT (id) DO UPDATE` in database repository prevents TOCTOU race conditions.
- Uploaded PDFs are validated against `%PDF-` binary magic bytes in addition to MIME-type headers.
- **Indirect Prompt Injection & XSS Guard on Documents:** All extracted fields from Gemini Multimodal / PyMuPDF (full name, headline, skills, work history, job responsibilities) pass through `clean_extracted_text()` to neutralize embedded jailbreak triggers (`ignore previous instructions`, `DAN mode`, `system:`) and malicious HTML tags before database persistence or evaluation.
- **Cross-tenant employer resource ownership:** every mutating job/candidate endpoint in `employer.py` (`PATCH`/`DELETE /employer/jobs/{id}`, `POST /employer/jobs/{id}/candidates`, `POST /employer/jobs/{id}/unlock/{seeker_id}`) is routed through a single `_require_owned_job()` helper that asserts `job.employer_id == caller's employer.id` before touching the row (403/404 otherwise). The router's docstring notes this consolidates a real historical cross-tenant finding — hand-repeating the ownership check per endpoint had previously let it be forgotten on a new one.
- **Application pipeline state machine:** `PATCH /employer/applications/{id}/status` validates transitions against `APPLICATION_TRANSITIONS` (`db/schemas.py`) — the pipeline only moves forward and `hired`/`rejected`/`withdrawn` are terminal, so a hire cannot be silently walked back to `applied` nor a rejection flipped to `hired`. An employer is further restricted to `EMPLOYER_SETTABLE_STATUSES` — `saved`/`withdrawn` remain the seeker's own state to set.
- **Idempotent mutation via `client_ref`:** `POST /employer/jobs` (and the job-pack upload it's paired with) accepts a caller-supplied `client_ref`; a unique index on `(employer_id, client_ref)` plus an `IntegrityError` catch means a retried create (lost response, reload) returns the already-created row instead of inserting a duplicate posting.

### Information Disclosure
- NIK (National ID) is never persisted at all, not even hashed — `/verify/identity` computes a SHA-256 `verification_hash` for the response only; `SeekerProfile.nik` is never written by any code path. Only the pass/fail outcome (`nik_verified: pending|failed`) is stored, satisfying UU-PDP-2022 by having nothing retained to disclose.
- Detailed health check (`GET /health/detailed`) requires authenticated JWT credentials.
- Application logs correlate with opaque user IDs and request IDs; PII is stripped from logs.

### Denial of Service
- Sliding-window rate limiter protects all endpoints, keyed per `(ip, route bucket)` rather than per raw URL (so an attacker can't dodge the default bucket by varying the path, e.g. walking `/api/v1/jobs/<uuid>`). Route-specific buckets: auth login/register 10 req/60s, agent invoke 20 req/60s, CV/job-pack upload 10 req/60s each, seeker skill-gap 20 req/60s, employer/jobs (incl. reverse-match `/candidates` and the live `/estimate` preview) 30 req/60s, verify/identity 10 req/60s, OTP verify 10 req/60s. **OTP send is the tightest bucket at 5 req/60s per IP** — deliberately kept low because it is the one endpoint that costs real money per call once a real SMS/WhatsApp vendor is wired in (a stolen token must not be usable to SMS-bomb a phone number). Every other route shares one 300 req/60s default bucket per IP.
- Rate limiter memory is capped at 10,000 `(ip, bucket)` keys — bounded to `len(route_rules)+1` entries per IP, so no request pattern can grow the tracking map — with LRU eviction (never evicting a counter that's currently at its limit, so eviction itself can't hand out a free bypass) and amortized stale-lock pruning.
- The rate limiter's `X-Real-IP`-based client identification is trusted only when the request also carries a shared-secret header (`PROXY_SHARED_SECRET`) proving it came through this deployment's own Nginx — see the Proxy topology caveat below.
- **Proxy topology caveat:** the limiter keys on `request.client.host` unless the request carries a shared-secret header (`PROXY_SHARED_SECRET`) proving it came through this deployment's own Nginx. If a production deployment routes browser traffic through Nginx (`docker-compose.prod.yml` topology 2) without setting that secret, every real client collapses into one shared bucket per route — a single busy or malicious client can exhaust it for everyone else. The app logs a startup warning when `APP_ENV=production` and the secret is unset, but can't hard-fail: a deployment where the browser calls the API directly (topology 1) is correct to leave it unset.
- Gemini LLM calls are protected with fallback model chains and an automatic circuit breaker tripping on consecutive availability errors.
- PyMuPDF fallback extraction runs in `asyncio.to_thread` to prevent CPU-bound operations from blocking the asyncio event loop.
- Database connection pools are bounded (`pool_size=5`, `max_overflow=10`, `pool_timeout=30`) to protect against connection exhaustion on serverless Postgres.

### Elevation of Privilege
- Strictly separated `require_seeker` and `require_employer` dependencies prevent cross-role access.
- Role boundaries are verified from database state on every token validation.
- **No admin role exists yet.** `GET/PATCH /api/v1/inquiries` — the one surface that would otherwise expose cross-user data (every organization's partnership-inquiry name/email/message) — is gated behind `settings.admin_routes_enabled` (off by default) rather than a real permission check, since `get_current_user` alone only proves the caller is *some* authenticated seeker or employer. This is a stopgap, not a permission system: anyone with `ADMIN_ROUTES_ENABLED=true` and any valid JWT can reach it. Treat this flag as a deployment-time secret-equivalent, not a per-user grant.
- **e-KYC/education verification is explicitly capped at `PENDING`, never `VERIFIED`**, by design: the NIK/ijazah checks in `verify.py` validate *format* only (16-digit NIK not "99"-prefixed; a diploma number that isn't an obvious placeholder) and never confirm the submitted credential belongs to the submitting user. Persisting a format-only pass as `VERIFIED` would let any authenticated seeker mint a durable "verified" badge with zero identity evidence behind it — see `verify_identity`'s docstring for the full reasoning.
