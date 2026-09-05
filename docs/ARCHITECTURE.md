# Architecture

## System Overview

```
React 18 SPA (Vite, React Router, Zustand)
  → FastAPI routers, JWT + role-based auth, rate limiting
  → SQLAlchemy async repositories → PostgreSQL 16 + pgvector (HNSW)
  → Google Gemini (embeddings + generation)
  → one LangGraph node (START → agent_node → END) for natural-language response synthesis
```

Matching, skill-gap computation, and intent routing run as procedural Python in the API layer (`backend/app/agents/graph/nodes.py`), invoked directly by routers. They are not wired as LangGraph graph nodes. This is a deliberate design choice for the system's current scale: a single LangGraph node keeps the response layer simple to reason about and debug, while the deterministic matching and skill-gap logic stays independently testable outside of any graph orchestration. Tool-calling (`bind_tools()`) is disabled due to a `google-generativeai`/Pydantic v2 schema incompatibility, documented in `backend/app/agents/graph/builder.py`.

## Three-Layer View

### Layer 1 — User Experience

| Flow | User → Action | Interface | Output |
|---|---|---|---|
| CV-based matching | Seeker uploads a PDF CV | `CVUploader.jsx` → `POST /api/v1/uploads/cv` | Parsed profile, auto-navigate to match results |
| Match review | Seeker opens a job card | `SeekerMatchResults.jsx`, `JobDetailModal.jsx` | 5-factor Explainable AI score breakdown |
| Skill gap | Seeker selects a target job | `SkillGapPanel.jsx` → `POST /api/v1/seeker/skill-gap` | Missing-skill list + course recommendations |
| Apply & track | Seeker applies to a job | `ApplicationsPage.jsx` → `POST /api/v1/seeker/apply` | Milestone timeline (Saved → Applied → Reviewed → Interview → Hired/Rejected) |
| Employer sourcing | Employer opens Candidates tab for a job | `EmployerCandidates.jsx` → `POST /api/v1/employer/jobs/{id}/candidates` | Ranked shortlist with confidence bands (Strong/Possible/Stretch) |
| Job posting | Employer completes the 3-step wizard | `EmployerPostJob.jsx` | Job posted, visible in seeker matching |
| Bulk job import | Employer uploads a multi-job PDF | `JobPackUploader.jsx` → `POST /api/v1/uploads/job-pack` | All positions extracted and published |
| Identity/OTP verification | Seeker/employer submits KTP, ijazah, NPWP, or phone number | `VerificationDashboard.jsx`, `EmployerVerification.jsx` | Verification result (demo mode — see Verification below) |
| Pay-to-Unlock | Employer unlocks a candidate's contact | `EmployerCandidates.jsx` unlock action | Contact info revealed (demo mode — no payment gateway wired yet) |
| A/B experiment assignment | Any user | `OnboardingWizard.jsx` via `GET /api/v1/experiments/assignments` | Deterministic variant (hash of `user_id`) |

### Layer 2 — System Logic

| Capability | Input | Processing | Algorithm/Model | Output |
|---|---|---|---|---|
| CV parsing | PDF bytes, magic-byte validated (`%PDF-`), 10 MB cap | Gemini multimodal extraction | Gemini 3.1 Flash | Structured skills/experience/education JSON |
| Embedding | Seeker/job text | Task-typed embedding calls (`RETRIEVAL_QUERY` / `RETRIEVAL_DOCUMENT`) | Gemini embedding model, 768-dim (MRL-truncated from 3072) | Vector stored in a `pgvector` column |
| Vector search | Seeker embedding | HNSW ANN search (`ef_construction=64, m=16`), in-process scan fallback if the index is unavailable | pgvector HNSW | Top-K nearest job candidates |
| Hybrid ranking | Vector similarity + structured profile/job fields | `SemanticMatcher` reranking (`backend/app/services/matching/matcher.py`) | `0.45` cosine + `0.25` skill overlap + `0.15` experience + `0.10` education + `0.05` recency | Ranked `MatchResult` list with band label and per-factor breakdown |
| Skill gap | Seeker skill set, target job's required skills | Deterministic set-difference, then Gemini-generated course narration | Set difference + Gemini text generation | Missing-skill list, action plan, course recommendations |
| Intent routing | Advisor chat message | Gemini LLM classification with a regex fallback | Gemini 3.1 Flash / regex | Routes procedurally to matcher, skill-gap, or advisor logic |
| NL response synthesis | Structured result from whichever path ran | Single LangGraph node invocation | Gemini via LangGraph `agent_node` | Natural-language response, JSON (not streamed) |
| Employer resource ownership | Employer's job/candidate mutation requests | Per-endpoint check `job.employer_id == employer.id` | Deterministic guard at every mutating call site in `employer.py` | 403/404 on cross-tenant access |
| A/B experiment analysis | Logged events (`job_viewed`, `cv_uploaded`, `apply_submitted`, …) | — | — | Event capture only (`POST /api/v1/events/track`); no aggregation job, dashboard, or retraining loop yet |

### Layer 3 — Technical Architecture

| Layer | Component | Notes |
|---|---|---|
| Frontend | React 18 + Vite + React Router + Zustand, persisted to `localStorage` (key `kerjacerdas-v4`) | SPA with JWT-aware route guards, 27 components |
| Backend | FastAPI (async), JWT auth, role-based dependencies, custom sliding-window `RateLimiterMiddleware` (in-memory by default; Redis-backed and instance-shared when `RATE_LIMIT_BACKEND=redis` + `REDIS_URL` are set) | 10 routers under one `/api/v1` prefix |
| Database | PostgreSQL 16 + `pgvector` (HNSW), Alembic migrations | Alembic-managed schema; an RLS migration exists but defines no policies yet |
| Model/API | Google Gemini (3.1 Flash) for embeddings + generation | Live calls, with an offline fallback stub on failure |
| External integration | Curated static course catalogue (35+ items); demo-mode OTP/NIK/NPWP checks | Government/e-KYC and payment integrations (Dukcapil, SIVIL, DJP, WhatsApp/SMS OTP, Midtrans/Xendit) require external contracts and are not wired in this build |
| Infrastructure | Docker Compose (dev + `docker-compose.prod.yml`), GitHub Actions CI (`ci.yml`) + release image publishing (`release.yml`) | CI runs backend lint, audit, and a build gate; container images publish to GHCR on tagged release |
| Testing | 24 backend test files (pytest); 2 frontend test files (`api.test.js` unit, `auth.spec.js` e2e) | Covers auth and the API client; component/integration coverage for matching UI, uploads, and verification flows is thin relative to the 27-component frontend |

## Verification & Payments — Demo Mode

Identity, credential, and payment flows are implemented as clearly labeled demo endpoints rather than live integrations:

- **KTP/NIK, ijazah, NPWP:** format-only checks (16-digit NIK, pattern-matched NPWP) — no live Dukcapil/SIVIL/DJP calls.
- **Phone OTP:** the verification code is returned directly in the API response (`otp_demo_enabled`) rather than sent through a real SMS/WhatsApp gateway.
- **Pay-to-Unlock:** the unlock endpoint accepts any payment token; no payment gateway is wired.

These are demo-mode by design so the surrounding product flow (verification badges, unlock UX) can be exercised end-to-end without external vendor contracts. See [Roadmap](ROADMAP.md) for the production integration plan.

## Built vs. Planned

**Built and demonstrable end-to-end:**
- Auth (JWT, bcrypt, role routing)
- CV upload → Gemini extraction → embedding → pgvector HNSW matching → Explainable AI score breakdown
- Skill gap analysis (deterministic gap + Gemini-narrated recommendations)
- Application submission and milestone tracking
- Employer job posting (single + bulk PDF pack), applications pipeline, candidate sourcing/shortlisting with tenant-ownership guards
- A/B assignment + event logging (instrumentation only)
- CI (lint, backend audit, build gate) and tagged-release container publishing

**Demo mode, clearly labeled in-product:**
- KTP/ijazah/NPWP/akta verification (format-only checks)
- Phone OTP (demo mode returns the code in-band)
- Pay-to-Unlock (accepts any token; no payment gateway)

**On the roadmap, not yet built:**
- Redis-backed semantic cache. (Distributed rate limiting is implemented in code — see `RateLimiterMiddleware`'s `rate_limit_backend` setting — but not yet activated: it needs `REDIS_URL` provisioned in the deployment, see [Known Issues](KNOWN_ISSUES.md).)
- Vertex AI VPC / Zero Data Retention inference
- Production e-KYC and payment gateway integrations
- Matching-algorithm improvements (skill taxonomy, multi-vector embeddings, dynamic reranking) — see [Roadmap](ROADMAP.md)

**Not planned:**
- A multi-node LangGraph topology, ReAct tool-calling, or any multi-agent architecture. The single-node design above is a deliberate fit for the system's current scale, not a stepping stone toward one.
- An A/B experiment analysis dashboard and model fine-tuning feedback loop
- Automated VPS deployment from CI (the release workflow publishes images; deployment to the VPS is manual)

See [Known Issues](KNOWN_ISSUES.md) for architectural debt and open bugs.
