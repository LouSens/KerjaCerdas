# KerjaCerdas — Internals Overview

> Internal documentation set.
> Each file explains how one feature works behind the scenes, with file paths into the codebase.

## Documentation Map

| Doc | Feature |
|---|---|
| [01-matching-algorithm.md](01-matching-algorithm.md) | Semantic job↔seeker matching (the core) + research directions |
| [02-authentication.md](02-authentication.md) | Registration, login, JWT, rate limiting, input sanitization |
| [03-cv-upload-parsing.md](03-cv-upload-parsing.md) | PDF CV upload, Gemini extraction, profile auto-fill |
| [04-identity-verification.md](04-identity-verification.md) | e-KYC (NIK SHA-256), education (SIVIL), NPWP & Database-backed OTP verification |
| [05-ai-agent.md](05-ai-agent.md) | LangGraph agent, tools, memory, prompts, telemetry |
| [06-jobs-employer-features.md](06-jobs-employer-features.md) | Job CRUD, candidate pool estimate, reverse matching |
| [07-partner-integrations.md](07-partner-integrations.md) | Course & LMS ecosystem integrations (Dicoding, Prakerja) |
| [08-events-experiments.md](08-events-experiments.md) | Analytics events + deterministic A/B testing |
| [09-courses-skill-gap.md](09-courses-skill-gap.md) | Course catalog + 3-tier skill-gap recommendations |

## High-Level Architecture

```
┌──────────────┐     ┌───────────────────────────────────────────┐
│ React (Vite) │────▶│ FastAPI  backend/app/api/main.py          │
│ frontend/    │     │  /api/v1/{auth,seeker,employer,jobs,      │
└──────────────┘     │   uploads,verify,agent,inquiries,events,  │
                     │   experiments}                            │
                     └───────┬───────────────────┬───────────────┘
                             │                   │
                ┌────────────▼─────────┐  ┌──────▼───────────────────┐
                │ PostgreSQL + pgvector│  │ Google Gemini            │
                │ vector(768) columns  │  │ · gemini-embedding-001   │
                │ users/jobs/seekers/  │  │   (768-dim, MRL)         │
                │ otps/events/inquiries│  │ · gemini-3.1-flash-lite  │
                └──────────────────────┘  │   (chat/agent/parsing)   │
                                          └──────────────────────────┘
```

- **One process** serves both API and (in production) the built SPA from `frontend/dist` (gated on `REPLIT_DEPLOYMENT`/`SERVE_FRONTEND`).
- **Single DB session factory** (`backend/app/db/session.py` delegates to `backend/app/api/database.py`) with explicit connection pooling limits.
- **All AI calls go through Gemini**: embeddings for matching, chat for the agent/explanations, native PDF ingestion for CV parsing.
- **Middleware stack**: Request Logging (`X-Request-ID`) → Security Headers → CORS → Rate Limiter (sliding window + LRU eviction) → Request Size Guard (10MB) → Router.
- **Auth**: JWT (HS256) with role-based dependencies (`require_seeker` / `require_employer`).
