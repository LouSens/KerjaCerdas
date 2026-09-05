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
- **Protected mutation surfaces**:
  - `POST /api/v1/uploads/cv` (`require_seeker`, magic bytes verified)
  - `POST /api/v1/uploads/job-pack` (`require_employer`, magic bytes verified)
  - `POST /api/v1/agent/invoke` (`get_current_user`)
  - `POST /api/v1/verify/identity`, `POST /api/v1/verify/otp/send`, `POST /api/v1/verify/otp/verify` (`get_current_user`)
- **Public surfaces**: `GET /api/v1/jobs`, `GET /health`
- **Authenticated surfaces**: `/api/v1/seeker/*`, `/api/v1/employer/*`, `/api/v1/inquiries`

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

### Information Disclosure
- NIK (National ID) is stored strictly as a one-way SHA-256 hash (`String(64)`), ensuring compliance with Indonesian Personal Data Protection Law (UU-PDP-2022).
- Detailed health check (`GET /health/detailed`) requires authenticated JWT credentials.
- Application logs correlate with opaque user IDs and request IDs; PII is stripped from logs.

### Denial of Service
- Sliding-window rate limiter protects all endpoints (auth: 10 req/60s, agent: 20 req/60s, general: 60 req/60s).
- Rate limiter memory is capped at 10,000 active keys with LRU eviction and amortized stale-lock pruning.
- Gemini LLM calls are protected with fallback model chains and an automatic circuit breaker tripping on consecutive availability errors.
- PyMuPDF fallback extraction runs in `asyncio.to_thread` to prevent CPU-bound operations from blocking the asyncio event loop.
- Database connection pools are bounded (`pool_size=5`, `max_overflow=10`, `pool_timeout=30`) to protect against connection exhaustion on serverless Postgres.

### Elevation of Privilege
- Strictly separated `require_seeker` and `require_employer` dependencies prevent cross-role access.
- Role boundaries are verified from database state on every token validation.
