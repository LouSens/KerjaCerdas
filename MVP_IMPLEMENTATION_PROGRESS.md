# MVP v0.4.0 Implementation Progress

This document tracks the execution of the `MVP_IMPROVEMENT_ROADMAP.md` implementation.

## ✅ Completed Tasks

### Backend Engineering
- [x] **Background Task for Embedding:** Modified `POST /seeker/profile` to run `embed_seeker` asynchronously using `BackgroundTasks`, reducing latency from ~3s to <200ms.
- [x] **In-Memory Cache for Job Corpus:** Added 5-minute TTL cache in `jobs.py` and used it in `/agent/invoke` to reduce database hits.
- [x] **Detailed Health Check:** Upgraded `/health/detailed` to ping the database and verify Gemini API key presence.
- [x] **Event Tracking Foundation:** Created `Event` ORM model and `POST /events/track` endpoint for closed-loop data moat.
- [x] **A/B Testing Framework:** Created `GET /experiments/assignments` for deterministic, stateless feature flagging.
- [x] **Optional Auth Dependency:** Added `get_current_user_optional` for endpoints that serve both logged-in and anonymous users (like events).
- [x] **Structured Logging:** Created `backend/app/config/logging.py` with structlog JSON formatter for production. `configure_logging()` called in `main.py`; graceful stdlib fallback if structlog not installed.

### Agentic AI System
- [x] **Token Efficiency Gate:** Added pre-ranking check in `invoke_agent`; if max cosine < 0.10, skips LLM execution and returns an early exit message.
- [x] **Hallucination Guard:** Implemented post-LLM cross-referencing to strip `job_id`s that don't exist in the database.
- [x] **Observability Fields:** Added `fallback_used`, `band_distribution`, `routing_confidence`, and `hallucinated_ids_removed` to `AgentInvokeResponse`.

### Deployment & CI/CD
- [x] **Production Docker Compose:** Created `docker-compose.prod.yml` with security hardening, no hardcoded secrets, resource limits, and health checks.
- [x] **CI/CD Pipeline:** Created `.github/workflows/ci-cd.yml` with 4 gates (Lint/Quality, Unit Tests, Integration Tests, Latency Benchmark) and automated deployment to Railway/Vercel.

### Frontend & UX
- [x] **A/B Testing Integration:** `fetchExperimentAssignments` added to `api.js`; `loadExperiments()` + `getExperiment()` + `trackEvent()` added to Zustand store. Called post-login for both seeker and employer.
- [x] **Event Tracking Integration:** `trackEvent` API function added (fire-and-forget). `useStore.trackEvent()` wraps it with session_id + ab_variant. Hooked into `job_viewed` (SeekerMatchResults) and `onboarding_*` events (OnboardingWizard).
- [x] **Onboarding Wizard:** `OnboardingWizard.jsx` — 3-step flow (Welcome → CV Upload → First Match). Triggered automatically for new seekers with no CV. A/B tested via `onboarding_flow` experiment.
- [x] **Empty States:** Added actionable empty state in `SeekerMatchResults` when profile exists but `matches = []`: shows stats, CTA to run AI match, and CV update button.
- [x] **Mobile-First CSS Audit:** Added `mobile-bottom-nav` CSS class + `@media (max-width: 768px)` rules. `MobileBottomNav` component exported from `Sidebar.jsx`. Desktop sidebar hides on mobile via `desktop-sidebar` class.

---

## ⏳ Pending / In-Progress Tasks

### 1. Frontend & UX
- [ ] **Real-time Score Preview:** Client-side estimation for skill additions.

### 2. Backend & Database
- [x] **Alembic Setup:** Initialize Alembic for database migrations.
- [x] **pgvector Index Tuning:** Add explicit SQL script/migration for HNSW index with optimized parameters.
- [ ] **Expanded Seed Data:** Create a script to generate 200+ mock jobs and 100+ mock seekers.

### 3. Business & Integrations
- [ ] **Payment Gateway Integration:** Midtrans Snap integration for B2B Pay-to-Unlock.
- [ ] **Email Notifications:** Triggers for application received / contact unlocked.
