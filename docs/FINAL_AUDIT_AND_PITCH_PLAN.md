# KerjaCerdas Final Audit and Pitch Plan

**Audit date:** 5 September 2026  
**Scope:** repository code, Docker/Replit artefacts, database schema and seed dump, markdown documentation, and the Digdaya final-pitch guideline.  
**Not in scope:** the live Replit deployment, its secrets, database contents, logs, or external integrations. No deployment URL or access was provided, so no live-environment claim has been verified.

## Executive verdict

KerjaCerdas has the foundations of a **functional prototype**, not a production-ready platform. The strongest, demonstrable story is a two-sided recruitment workflow: structured profile or CV data, deterministic hybrid matching, job application tracking, and employer pipeline management. Authentication, role separation, Pydantic request validation, PDF magic-byte validation, rate limiting, and a useful automated-test base are present.

The product should **not** claim live government verification, payment processing, a multi-agent swarm, SSE streaming, Redis-backed operation, zero-data-retention AI, or measured commercial impact. Several polished screens return hard-coded demo content rather than backend data. The most serious defect permits an employer to use another employer's job ID to access the candidate-search and contact-unlock paths.

For the final presentation, show only the core functional workflow and call it a `Functional Prototype with seeded test data`. Do not demo OTP or document verification. First fix the blockers in the next section.

## Must-fix before a live demo

| Priority | Finding and evidence | Risk | Concrete fix and acceptance check |
|---|---|---|---|
| P0 | `POST /employer/jobs/{job_id}/candidates` and `POST /employer/jobs/{job_id}/unlock/{seeker_id}` confirm the caller is an employer but never verify `job.employer_id == current employer.id` (`backend/app/api/routers/employer.py`). The unlock endpoint returns a seeker's account email and accepts any payment token. | Cross-tenant candidate data exposure; invalid monetisation claim. | Add an ownership guard immediately after resolving the job in both endpoints. Disable unlock completely in the demo, or return a clearly labelled fake contact only for a dedicated seeded demo tenant. Add two negative API tests: employer B cannot search or unlock employer A's job. |
| P0 | The Skill Gap page imports no API functions and renders `MOCK_COURSES`, default skills, and default gaps (`frontend/src/components/SkillGapPanel.jsx`). | The key outcome claim is visually simulated. | On mount or user action, call `POST /seeker/skill-gap` for the selected target job, persist the response in Zustand, then render only `matching_skills`, `missing_skills`, course data, hours, and target-job label returned by the API. Show an honest empty/error state. Add component and API integration tests. |
| P0 | Employer sourcing starts with five named `DEMO_CANDIDATES`; although `fetchCandidatesForJob` is imported, it is never called (`frontend/src/components/EmployerCandidates.jsx`). The CV and unlock buttons only show toast messages. | The HR-side shortlist is a simulation while the deck documents it as real. | Replace the constant with API state from `POST /employer/jobs/{id}/candidates`. Keep the real applications pipeline as the primary HR demo. Remove sourcing/unlock from the demo until the guarded API and real UI are connected. |
| P0 | The backend Dockerfile runs `pip install -e ".[dev]"` before copying the `backend` package into the image (`backend/Dockerfile`). | A clean backend image build cannot reliably install the project. | Copy the source before installing it, then build and start `docker compose up --build` from a clean environment. Add this build to CI. |
| P1 | Production compose runs `vite dev` in the frontend container, while FastAPI's production static mount expects `frontend/dist` inside the backend container. Vite also permits `allowedHosts: 'all'` (`frontend/Dockerfile`, `frontend/vite.config.js`, `backend/app/api/main.py`). | Fragile production deployment and unnecessarily broad dev-server exposure. | Build the SPA in a multi-stage image and serve it through nginx/Caddy, or copy the build into the API image and serve it through FastAPI. Restrict allowed hosts to the actual domain. |
| P1 | `database/init.sql` is a large snapshot that diverges from ORM/migrations. For example, the dump's `applications` table lacks `note`, and it does not contain the current policy-based RLS model. Startup uses `create_all` plus ad-hoc alterations instead of Alembic. | Deployment drift; changes cannot be reproduced or safely rolled back. | Make Alembic the only schema authority: run `alembic upgrade head` on deploy; replace the dump with idempotent, fixture-based seed scripts; add a migration for every model change. If RLS is retained, create and test explicit policies or remove the migration until the application identity supports them. |

## Architecture and implementation audit

### Actual architecture

```text
React/Vite SPA
  -> FastAPI routers with JWT and role dependencies
  -> SQLAlchemy repositories / PostgreSQL + pgvector
  -> Gemini embedding calls for semantic prefiltering and reranking
  -> one LangGraph node for natural-language response
```

`SemanticMatcher` performs a meaningful hybrid calculation: semantic similarity, explicit skill overlap, location, salary, and experience. It uses pgvector HNSW when available and falls back to an in-process scan. This is a good prototype design, provided the seeded data, score behaviour, and fallback path are explicitly described.

The LangGraph implementation is **one node** (`START -> agent -> END`), and matching happens before it. It is not an autonomous multi-agent swarm, ReAct tool-calling graph, or parallel agent system. Tool binding is explicitly disabled in `backend/app/agents/graph/builder.py`.

### Frontend and product effectiveness

| Area | What works in code | Gap to close |
|---|---|---|
| Authentication and routing | JWT login/register, protected role routes, expiry handling, and React Router deep links are implemented. | Tokens live in `localStorage`; use a strict SPA Content Security Policy and short-lived access token plus refresh/revocation design before a public launch. |
| Seeker profile and CV flow | Seeker profile, PDF upload, parser path, embedding, matching request, save, apply, and application timeline have backend paths. | Test the entire happy path against a fresh seeded database. Do not silently replace empty results with polished fallback job cards. |
| Matching | The backend ranker and match-band logic are real. Agent responses enrich results with job metadata. | The dashboard and result page use `DEMO_MATCHES` when no API matches exist. Replace these with zero states to prevent false evidence. Calibrate score bands with a labelled test set rather than presenting their thresholds as validated. |
| Skill gap | The backend computes direct skill differences, persists a result, and can select recommendations. | The actual visible page is disconnected from it. Implement the P0 UI integration and a verified-course catalogue. |
| Employer workflow | Profile, job creation, employer job list, applications, state transitions, and notes have working paths. | Remove the fake candidate/sourcing experience or wire it to the guarded backend path. Ensure every shown value originates in the selected employer's data. |
| Job-pack parsing | PDF magic bytes, 10 MB cap, parsing, embedding, and posting creation exist. | Parser fallback produces offline stub output. Label it as a fallback and do not call it an AI extraction success unless Gemini actually produced the result. |
| Events and experiments | Deterministic experiment assignment and event writes exist. | No analysis job, dashboard, consent model, retention rule, or model-training loop exists. Treat this as instrumentation groundwork, not closed-loop learning. |

### Security audit

| Severity | Finding | Remediation |
|---|---|---|
| High | Cross-tenant candidate search and contact unlock lack job ownership validation. | Apply P0 ownership guards and tests. Also persist unlocks and payment state only after a verified provider webhook. |
| High if public | Demo payment unlock accepts arbitrary tokens and returns contact data; its in-memory unlock record disappears on restart. | Feature-flag it off outside a closed demo. Do not expose real contact details until payment and consent are implemented. |
| Medium | The SPA has no Content Security Policy. Because bearer tokens persist in local storage, an XSS vulnerability would expose them. API responses have CSP, but the document response does not. | Serve a nonce/hash-based CSP for the SPA, eliminate unsafe inline patterns where possible, and introduce token rotation/revocation. |
| Medium | Uploaded PDFs are loaded wholly into memory and checked only for size and `%PDF-` magic bytes. Parser execution can still face malformed or resource-intensive PDFs. | Enforce body size at proxy level, parse in a constrained worker with CPU/memory/time limits, reject encrypted PDFs unless supported, and add parser-failure telemetry. |
| Medium | Rate limiting is process-local. It weakens linearly as instances increase. | Move counters to Redis/Upstash before autoscaling. Configure a trusted proxy header only at the proxy boundary. |
| Medium | RLS is enabled in an Alembic migration but defines no policies, and migrations are not the deployment path. | Choose one access model, test it against the deployment role, and enforce tenant boundaries in both database and service layers. |
| Low | OpenAPI and interactive docs are public in production. | Disable or protect them in production once the demo is complete. |
| Low | Docker Compose dev exposes Postgres on port 5432 with `postgres/postgres`. | Bind it only to localhost for development and never reuse these credentials in a shared environment. |

Positive controls found: bcrypt password hashing; production guard for a missing JWT secret; explicit CORS origins rather than a Replit wildcard; role dependencies at router level; request schemas for major mutations; NIK/OTP hashes rather than plaintext persistence; and a thoughtful in-process rate limiter. These do not replace the P0 tenant guard.

## Skill-gap product: turn analysis into an outcome loop

The product should not stop at “these skills are missing.” The core experience should be a closed loop:

```text
Target job
  -> normalize JD and profile skills against one controlled taxonomy
  -> show evidence: matched and missing requirements
  -> choose a concrete learning action per gap
  -> track completion or verified evidence
  -> rerun the same rubric and show the change
  -> surface jobs that are now eligible to apply for
```

Build this with deterministic rules first. Map synonyms such as `PostgreSQL` and `Postgres` to a canonical skill, distinguish required from nice-to-have skills, and show why each gap appears. Store an action-plan item with target skill, selected course or task, URL/provider, expected effort, status, and evidence of completion. Use Gemini only to explain the plan in Indonesian or recommend from a **verified** catalogue; it must not invent providers, prices, ratings, or outcomes.

The first pilot metrics should be:

1. task completion rate within 14 days;
2. percentage of users who rerun an assessment;
3. change in the same deterministic match rubric after completion;
4. application-start and application-completion rates for the target job; and
5. employer acceptance of the resulting shortlist.

Call results `measured` only after a pre-defined pilot. Until then, label them `target` or `estimated` and disclose the calculation.

## Documentation truth audit

The documentation must distinguish `built`, `demo/mock`, and `planned`. The current set mixes them, which violates the final-pitch guideline's transparency rule.

| Documentation claim | Code reality | Required correction |
|---|---|---|
| “Autonomous Multi-Agent Swarm,” four nodes, ReAct, parallel execution | One LangGraph LLM node; tool binding disabled; matching occurs separately. | Rename to “LangGraph-assisted response layer” or implement the stated graph. |
| “SSE streaming completion” | `/agent/invoke` returns a normal JSON response. | Remove streaming references. |
| Dukcapil, SIVIL, DJP, AHU, Fonnte/Twilio integrations and AES-256-GCM | Identity routes are explicit deterministic mocks; production OTP returns 503 with no vendor configured; no AES-GCM implementation was found. | Mark all as mock/planned; remove claims of official integration and encryption at rest unless implemented and evidenced. |
| Pay-to-Unlock revenue, verified contact and 5 free credits | Arbitrary payment token; in-memory state; sourcing UI uses static cards. | Keep only as a future business-model hypothesis. Do not present revenue or margin as operational. |
| Redis cache, scraping, B2G data feeds, fine-tuning feedback loop | Redis is a setting only; no scraper, partner connector, training job, or analytics analysis pipeline found. | Move to roadmap. |
| “MVP fully functional via Docker,” CI/CD, API latency below 200 ms | Backend Dockerfile install order is broken; no CI workflow was found; no reproducible performance evidence is included. | Replace with a build-tested claim only after CI and benchmark evidence exist. |
| Course-provider, course-rating and price claims | UI has a hard-coded course list; backend fallback deliberately labels uncertain facts unverified. | Use a versioned, cited course catalogue or label every item as example/uncertain. |
| BPS 2026 “7.24 million” and “35.36% qualification mismatch” | No source/method is in the repository; current official BPS publication reports national TPT of 4.65% in May 2026. | Do not use the two unsupported values. Put the official BPS source and date in slide notes, and use primary interview/pilot evidence for the specific mismatch problem. |

Files needing priority revision: `README.md`, `docs/PROPOSAL.md`, `docs/PRODUCT_FEATURES.md`, `docs/DEMO_GUIDE.md`, `docs/TECHNICAL_ROADMAP.md`, `docs/API_SPEC.md`, and `threat_model.md`.

## Validation results

| Check | Result |
|---|---|
| Frontend unit tests | Passed: 13 tests in one file. They cover the API client only, not the live user journeys. |
| Frontend production build | Passed. Build emits a 497.5 kB JavaScript bundle before gzip; code-split larger routes before public launch. |
| Backend Ruff | Passed: lint and format checks. |
| Backend pytest | Not runnable in this workspace because the active Python 3.12 environment has no FastAPI or pytest installed. This is an environment/reproducibility gap, not a passing result. |
| End-to-end browser tests | Not run against a live Replit deployment because no deployment URL/access was supplied. |

## Readiness plan

### Before presentation

1. Fix the candidate ownership guards.
2. Connect Skill Gap and employer sourcing to their actual APIs, or hide the screens from the demo.
3. Remove all fallback demo cards on core screens. Seed one deterministic seeker, employer, job, and application lifecycle instead.
4. Repair Docker build order; run a clean compose build; capture its command output and current commit hash.
5. Execute a scripted eight-step demo rehearsal and record successful completion, response time, and failures in a small test table.
6. Revise documentation and the deck with only defensible claims.

### Pilot gate, before public launch

1. Implement payment, consent, durable unlock audit records, and vendor webhooks.
2. Add distributed rate limiting, monitoring, alerts, database backups, migration automation, CSP, and secure file-processing isolation.
3. Run a labelled matching evaluation and usability test with a pre-registered sample and success metrics.
4. Establish the course taxonomy and partnership/affiliate validation before monetising recommendations.

## Ten-minute final pitch deck

Use fourteen slides because the participant guideline explicitly requires this structure. Put one verifiable point on each slide. Place sources, demo dataset version, and the definitions of `built`, `simulated`, and `planned` in speaker notes or a small visible footer.

| # | Slide | Evidence and message | Time |
|---|---|---|---:|
| 1 | Solution at a glance | KerjaCerdas helps early-career job seekers understand fit and next skills, while helping small employers triage applicants. Align to Problem Statement 2: digital job creation. State: functional prototype with seeded test data. | 0:15 |
| 2 | Problem and why it matters | One official labour-market statistic with source/date plus one clearly labelled interview/survey finding. Do not use the unsupported 7.24m or 35.36% values. | 0:35 |
| 3 | Problem validation and root cause | Show the validation method, sample, date, and direct anonymised findings. If none exists, say validation is the next pilot gate. Root cause: job requirements and candidate skills lack a shared, actionable view. | 0:30 |
| 4 | Solution and core use case | Show a single flow: CV/profile -> match to target job -> evidence of fit/gaps -> apply or learning action -> HR updates outcome. Avoid a feature dump. | 0:35 |
| 5 | Value proposition and differentiation | Compare against manual keyword search and generic job portals on explainability, actionability, and HR triage. Do not claim superiority without benchmark data. | 0:25 |
| 6 | Prototype and current product state | Mark each core function as built: auth, profile/CV input, matching, apply, application timeline, job posting, employer application pipeline. Mark skill-gap UI wiring and sourcing UI as “being completed” until P0 fixes land. | 0:45 |
| 7 | How the technology works | Diagram the actual architecture: React -> FastAPI -> PostgreSQL/pgvector -> Gemini embeddings; one LangGraph response node. Explain hybrid ranking in plain language. | 0:40 |
| 8 | Technical testing and performance | Show completed test results and the scripted demo test table. State limits: no live load test, backend tests awaiting a reproducible environment, no live external verification. | 0:35 |
| 9 | Impact and evidence of effectiveness | Use only a measurement plan until pilot data exists: task completion, re-assessment, match-rubric change, apply completion, and HR shortlist acceptance. Label all proposed values as targets. | 0:35 |
| 10 | Market, user and offtaker validation | Define seeker as user, SME/HR as adopter/decision maker, and training provider as possible partner. Present completed interviews/LOIs only if you can show them. | 0:35 |
| 11 | Adoption and sustainability path | Show a narrow pilot: one job family, five employers, 100 seekers, one verified course catalogue. Payments and official verification remain later phases. | 0:25 |
| 12 | Team and execution readiness | Map each named member to an owned artefact already in the repository or validation work. Avoid generic roles. | 0:25 |
| 13 | Roadmap to implementation | Milestones: P0 demo integrity, pilot instrumentation/taxonomy, pilot test, then security and payment readiness. Put exit criteria beside each milestone. | 0:30 |
| 14 | Key risks and next priorities | Name data quality, adoption, AI reliability, privacy, and infrastructure risk with one mitigation each. Close with the pilot decision sought from judges. | 0:20 |

Reserve **2 minutes 40 seconds within slides 6 and 7** for the live demonstration. This produces a 10-minute run. The live sequence should be: seeded seeker profile -> match evidence -> choose a target job -> actual skill-gap result after its UI is wired -> submit application -> switch to the seeded employer -> show the real application and move it to `reviewed`. Do not switch accounts to show candidate sourcing, OTP, document verification, or payment unlocks.

## Anticipated Q&A

| Likely question | Defensible answer |
|---|---|
| Is this a live product or a mock-up? | “It is a functional prototype. The matching, job application, and employer pipeline run against seeded data. Government verification and payments are intentionally not part of this demo.” |
| How do you know matching is better? | “We do not claim a production accuracy rate yet. The next pilot uses a labelled reviewer set and measures shortlist acceptance against the same baseline process.” |
| Why use AI instead of keyword search? | “The current system combines embedding similarity with explicit skill, location, salary, and experience checks. The displayed skill evidence makes the result reviewable.” |
| Is the skill-gap recommendation trustworthy? | “The gap itself is a deterministic comparison of the selected job’s requirements and the profile. Provider recommendations must come from a verified catalogue; model-generated narration does not create facts.” |
| How do you protect personal data? | “Role-based API access, JWTs, hashed passwords, hashed NIK/OTP values, request validation, and rate limits are implemented. We identified a tenant-ownership guard as a release blocker and are fixing it before any public use.” |
| Why not show OTP or document verification? | “Those endpoints are explicitly mocked because official providers require contracts and compliance controls. Showing them would not strengthen the proof of the core job-matching outcome.” |
| Who pays, and when? | “We are validating the employer workflow before charging. Pay-to-unlock is a hypothesis, not live revenue, until payment, consent, and durable audit records are in place.” |
| What happens when Gemini fails? | “Matching has a deterministic fallback path. The UI should clearly disclose a degraded response rather than present AI output as successful.” |
| What is your next experiment? | “A tightly scoped pilot with a defined job family, 100 seekers, and five employers, measuring task completion, re-assessment, application completion, and HR shortlist acceptance.” |

## Sources for presentation

Use the BPS May 2026 labour release for the national TPT figure, with its publication date in the slide note: https://www.bps.go.id/id/pressrelease/2026/08/05/2606/tingkat-pengangguran-terbuka--tpt--sebesar-4-65-persen---rata-rata-upah-buruh-sebesar-3-39-juta-rupiah-.html

Every claimed interview, test result, pilot result, course partnership, price, and business-model result needs its own source, collection date, sample/method, and status label before entering the deck.
