# Threat Model

## Project Overview

KerjaCerdas is an AI-powered job matching platform for Indonesia. A FastAPI backend (port 8000) serves a React/Vite frontend (port 5000). Core features: user registration/login, seeker CV upload and profile management, employer job posting, semantic AI matching via Google Gemini embeddings, and a LangGraph ReAct agent for conversational job search. The application is not yet deployed to production.

## Assets

- **User credentials** — email/bcrypt-hashed passwords in PostgreSQL. Compromise enables account takeover.
- **Seeker profiles** — full name, skills, salary expectations, resume text, embedding vectors. Contains PII; drives AI match results.
- **Employer profiles and job postings** — company identity, job descriptions, salary bands. Business-sensitive; integrity critical for trust.
- **JWT signing secret** — signs all access tokens. Compromise allows minting arbitrary tokens for any user/role.
- **Gemini API key** — paid AI service. Exposure enables cost abuse.
- **Application logs** — currently contain email addresses and client IPs; inadvertent PII store.

## Trust Boundaries

- **Browser → Backend API** — all requests cross here. The backend must authenticate and authorise every mutating or data-returning request. The client is fully untrusted.
- **Backend → PostgreSQL** — ORM (SQLAlchemy) with parameterised queries; low SQL injection risk.
- **Backend → Google Gemini API** — outbound calls with API key. Key must never appear in responses or logs.
- **Public / Authenticated boundary** — job listings and health endpoints are intentionally public; all profile, upload, agent, and verification endpoints must require a valid JWT. Several currently do not (see findings).
- **Seeker / Employer role boundary** — enforced via `require_seeker` / `require_employer` dependencies on the seeker and employer routers. Upload and agent endpoints currently bypass this boundary entirely.

## Scan Anchors

- **Production entry points**: `backend/app/api/main.py` (app factory + middleware), `backend/app/api/routers/` (all route definitions)
- **Highest-risk areas**: `uploads.py` (no auth — CRITICAL), `agent.py` (no auth — HIGH), `middleware/rate_limiter.py` (IP spoofing bypass — HIGH), `scripts/auth_utils.py` (hardcoded hash — HIGH)
- **Public surfaces**: `GET /api/v1/jobs`, `GET /health`, `GET /health/detailed`, `GET /api/v1/karirhub/listings`
- **Authenticated surfaces**: `/api/v1/seeker/*`, `/api/v1/employer/*`, `/api/v1/experiments/assignments`
- **Currently unauthenticated but should be**: `POST /api/v1/uploads/cv`, `POST /api/v1/uploads/job-pack`, `POST /api/v1/agent/invoke`, `POST /verify/identity`, `POST /verify/education`, `POST /verify/npwp`
- **Dev-only scripts**: `backend/scripts/` — seed scripts must never run against production DB

## Threat Categories

### Spoofing

JWT tokens are issued at login and validated on every protected request via `decode_access_token`. The signing algorithm is HS256 with a server-side secret. In development, the secret is ephemeral (regenerated each restart), which invalidates all tokens on restart but does not affect production.

**Guarantee required**: `JWT_SECRET_KEY` MUST be set to a stable, high-entropy value in any persistent deployment. The app already enforces this in `is_production` mode but Task #4 (set permanent JWT secret) is pending.

### Tampering

Several mutating endpoints (`/uploads/cv`, `/uploads/job-pack`) accept a caller-supplied `user_id` with no ownership verification. This allows any caller to overwrite any user's data. Seeker and employer profile endpoints correctly bind mutations to `current_user.id` from the validated JWT.

**Guarantee required**: All endpoints that write user data MUST derive the `user_id` from the authenticated JWT, not from request body/form fields.

### Information Disclosure

- Email addresses and client IPs appear in application logs.
- The `/health/detailed` endpoint reveals database connectivity status, Gemini key presence, and internal scoring thresholds to unauthenticated callers.
- JWT payloads contain `email` in plaintext (JWTs are not encrypted).
- The AI agent endpoint (`/agent/invoke`) returns ranked job data, skill gaps, and company salary bands to unauthenticated callers.

**Guarantee required**: Logs MUST use only opaque user IDs for correlation. PII MUST NOT appear in log statements. The detailed health endpoint MUST require auth or be removed. JWT payload MUST contain only the minimum necessary claims (`sub`, `role`, `exp`, `iat`).

### Denial of Service

The in-memory rate limiter is the primary DoS control. Its per-IP limits are bypassed by setting a custom `X-Forwarded-For` header, allowing unlimited requests against auth and agent endpoints.

The agent endpoint triggers LangGraph graph execution and multiple Gemini API calls per request. Without authentication, a single attacker can exhaust the Gemini API quota.

**Guarantee required**: The rate limiter MUST NOT trust `X-Forwarded-For` from untrusted clients. In production, only the value set by the Replit reverse proxy (a trusted hop) should be used. Authentication on `/agent/invoke` is the most effective control.

### Elevation of Privilege

The `/uploads/cv` and `/uploads/job-pack` endpoints accept a caller-supplied `user_id` with no authentication, allowing any user to act as any other user. The seeder scripts hardcode a known bcrypt hash and will reset any existing user's password if accidentally run against production.

**Guarantee required**: Upload endpoints MUST require `Depends(get_current_user)` and derive the target `user_id` from the JWT. Seeder scripts MUST be guarded against production execution (e.g. `APP_ENV != production` check).
