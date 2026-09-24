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
| Match review | Seeker opens a job card | `SeekerMatchResults.jsx`, `JobDetailModal.jsx`, `ProofUI.jsx` | Explainable score breakdown + per-skill proof status (claimed / quiz / HR-confirmed) |
| Prove a skill | Seeker takes a skill quiz | `SkillProofPage.jsx`, `QuizModal.jsx` → `POST /api/v1/quiz/start` · `/submit` | ✓ Terbukti badge for 180 days; the match score rises at every employer |
| Skill gap | Seeker selects a target job | `SkillGapPanel.jsx` → `POST /api/v1/seeker/skill-gap` | Missing-skill list + course recommendations |
| Apply & track | Seeker applies to a job | `ApplicationsPage.jsx` → `POST /api/v1/seeker/apply` | Milestone timeline (Saved → Applied → Reviewed → Interview → Hired/Rejected) |
| Applicant review | Employer opens the Pelamar tab | `ApplicantList.jsx` → `GET /api/v1/employer/applications` | Applicants ranked by live proof-weighted score, proof badges, pipeline status; **every tier including Spark shows all of them** — ranking is a free computation, so capping it hid candidates without saving anything. Paid tiers add interview kits, CSV export and reverse matching |
| Interview & confirm | Employer shortlists a candidate | `HiringToolsModal.jsx` → `/interview-kit`, `/confirm-skills` | AI questions for still-claimed skills; HR "terbukti" tick becomes the strongest proof |
| Talent pool (anonymous) | Employer opens the Talent pool tab | `TalentSearch.jsx` → `POST /api/v1/employer/jobs/{id}/candidates` | Anonymised ranked candidates — no names, employers, schools or contacts |
| Share a job | Employer copies the link or prints the QR poster | `JobShareModal.jsx` → `GET /api/v1/public/jobs/{code}/qr.svg` | `/j/<code>` link + printable QR for Instagram / WhatsApp / shop poster |
| Public apply | Visitor scans the QR | `PublicJobPage.jsx`, `QuickProfileForm.jsx` → `POST /api/v1/seeker/apply` | Sign up → quick profile or CV → optional quizzes → application with stored score + proof snapshot |
| Job posting | Employer completes the 3-step wizard | `EmployerPostJob.jsx` | Job posted, visible in seeker matching |
| Bulk job import | Employer uploads a multi-job PDF | `JobPackUploader.jsx` → `POST /api/v1/uploads/job-pack` | All positions extracted and shown for review — nothing is published until the employer confirms each one (`POST /employer/jobs` per posting, idempotent via `client_ref`) |
| Email verification | Seeker/employer requests a code | `ProofUI.jsx` → `POST /api/v1/verify/email/send` · `/verify` | Account email verified (the only identity check; no NIK/KTP/ijazah/NPWP) |
| Job moderation | Employer posts or edits a job | AutoMod (`services/trust/`) on `POST/PATCH /employer/jobs` | published / held / rejected + poster notice with the flagged sentence, appeal, strike ladder |
| Report a job | Any signed-in user on a public job page | `ReportJobModal.jsx` → `POST /api/v1/public/jobs/{code}/report` | Reports are **weighted, not counted**. Crossing the weight threshold marks the posting `flagged` and it **stays visible**; only a verdict against the cited rule hides it, and the AI reviewer may act alone on hard rules only |
| Plans & payment | Employer or seeker picks a plan | `UpgradeModal.jsx` → `POST /api/v1/billing/orders` | Pending order + payment instructions; an admin activates it for 30 days |
| Admin operations | Admin (`ADMIN_EMAILS`) | `AdminPanel.jsx` → `/api/v1/admin/*` | Moderation queue, business reviews, plan activation, quiz-bank review, metrics |
| A/B experiment assignment | Any user | `OnboardingWizard.jsx` via `GET /api/v1/experiments/assignments` | Deterministic variant (hash of `user_id`) |

### Layer 2 — System Logic

| Capability | Input | Processing | Algorithm/Model | Output |
|---|---|---|---|---|
| CV parsing | PDF bytes, magic-byte validated (`%PDF-`), 10 MB cap | Gemini multimodal extraction | `gemini-3.1-flash-lite` (fallback chain in `settings.py`) | Structured skills/experience/education JSON |
| Embedding | Seeker/job text | Task-typed embedding calls (`RETRIEVAL_QUERY` / `RETRIEVAL_DOCUMENT`) | Gemini embedding model, 768-dim (MRL-truncated from 3072) | Vector stored in a `pgvector` column |
| Vector search | Seeker embedding | Below 500 active rows: every row scored directly (no ANN — more correct at this scale, see internals/01). Above it: HNSW ANN search (`ef_construction=64, m=16`), in-process scan fallback if the index is unavailable | pgvector HNSW | Top-K nearest job candidates |
| Hybrid ranking | Vector similarity + structured profile/job fields + **skill proof levels** | `SemanticMatcher` reranking (`matcher.py`) with proof weights from `matching/evidence.py` | `0.35` cosine + `0.40` proof-weighted skills (proof deliberately outweighs text similarity — cosine is what keyword stuffing inflates) (claimed 0.30 / quiz 0.85 / HR-confirmed 1.00; required skills 80%, nice-to-have 20%) + `0.15` experience + `0.10` education vs `education_min`. The old flat `0.05` recency term was removed — it was identical for every candidate | Ranked `MatchResult` list with band, per-factor breakdown and per-skill proof status |
| Skill quiz grading | 5 random questions, per-attempt shuffled options, server-side deadline | Answer-key comparison for grading (no AI call, attempt costs Rp0). Questions sourced from JSON seed banks. | Deterministic grading | Pass (≥4/5) sets the skill's proof to quiz for 180 days |
| Job moderation | Job title/description/responsibilities/salary | Fixed rules (fee-charging = reject; age/appearance/gender/off-platform contact/salary outlier = hold) + optional AI scam check that may only *hold* | `services/trust/automod.py` | Verdict + reasons with the flagged excerpt and a fix, feeding the poster notice and the strike ladder |
| PII redaction | Any text heading to an LLM | Fixed-rule removal of emails, phone numbers and 16-digit NIKs **before** the call (prompt instructions are only a second layer). Text-based CVs are extracted locally and redacted; only scanned PDFs go as documents | `services/privacy/redact.py`, wired into `llm_factory` and `pdf_parser` | Redacted prompt |
| Cost accounting | Every chat/parse call | Tokens logged to `ai_logs` (task, model, in/out) | `GET /admin/metrics` × Gemini price list × USD/IDR | Measured Rupiah cost per action |
| Skill gap | Seeker skill set, target job's required skills | Deterministic set-difference, then Gemini-generated course narration | Set difference + Gemini text generation | Missing-skill list, action plan, course recommendations |
| Button intent | Advisor chat message + optional `explicit_intent` from a UI button (`match_jobs` / `advise`) | No classification: the matcher always runs, and the intent is passed to the model as a hint line | — | Hint in the prompt; the response `intent` field is hardcoded |
| NL response synthesis | Seeker name, profile skill list and the message (not the match list) | Single LangGraph node invocation | Gemini via LangGraph `agent_node` | Natural-language response, JSON (not streamed) |
| Employer resource ownership | Employer's job/candidate mutation requests | Per-endpoint check `job.employer_id == employer.id` | Deterministic guard at every mutating call site in `employer.py` | 403/404 on cross-tenant access |
| A/B experiment analysis | Logged events (`job_viewed`, `cv_uploaded`, `apply_submitted`, …) | — | — | Event capture only (`POST /api/v1/events/track`); no aggregation job, dashboard, or retraining loop yet |

### Layer 3 — Technical Architecture

| Layer | Component | Notes |
|---|---|---|
| Frontend | React 18 + Vite + React Router + Zustand, persisted to `localStorage` (key `kerjacerdas-v4`) | SPA with JWT-aware route guards, 40+ components (the public job page renders outside the authenticated shell) |
| Backend | FastAPI (async), JWT auth, role-based dependencies, custom sliding-window `RateLimiterMiddleware` (in-memory by default) | 15 routers under one `/api/v1` prefix |
| Database | PostgreSQL 16 + `pgvector` (HNSW), Alembic migrations | Alembic-managed schema; an RLS migration exists but defines no policies yet |
| Model/API | Google Gemini (3.1 Flash) for embeddings + generation | Live calls, with an offline fallback stub on failure |
| External integration | Curated static course catalogue (35+ items); transactional email via Resend (optional); QR posters rendered in-process with `segno` | No identity-verification vendor is used at all (no Dukcapil/SIVIL/DJP). Payment gateways (Midtrans/Xendit) are planned; today plan orders are paid by QRIS/transfer and activated by an admin |
| Infrastructure | Docker Compose (dev + `docker-compose.prod.yml`), GitHub Actions CI (`ci.yml`) + release image publishing (`release.yml`) | CI runs backend lint, audit, and a build gate; container images publish to GHCR on tagged release |
| Testing | 29 backend test files (pytest, `backend/tests/unit/` + `backend/tests/integration/`); 5 frontend unit files (`api.test.js`, `hasMeaningfulProfile.test.js`, `seekerSearchFilters.test.js`, `proofUI.test.jsx`, `adminMetrics.test.jsx`) plus `auth.spec.js` e2e | Backend covers scoring/proof weights, quizzes, AutoMod + strikes + reports, plans/entitlements, public links and admin metrics (`test_v2_*.py`) plus the existing auth/security suites. Frontend component coverage is still thin relative to the 41-component UI |

## Verification, Trust & Payments

v2 removed every mock identity check. What the platform verifies, it verifies itself:

- **Email (OTP):** a 6-digit code to the account's own address, delivered via Resend when
  `RESEND_API_KEY` is set. Without a provider the code is only returned in the response while OTP demo
  mode is on — never in production by default; otherwise the endpoint fails closed.
- **Skills:** timed skill quizzes graded server-side (badge valid 180 days), then employer confirmation
  after an interview. Honest limit: a remote quiz is not cheat-proof, so the interview kit asks the
  candidate to explain their own answers, and HR confirmation is the final gate.
- **Employers:** email verified → company-domain email → "Ditinjau admin" (an admin checks public
  proof links by hand). Plus AutoMod on every posting, candidate reports, and a strike ladder.
- **Not collected at all:** NIK/KTP, ijazah numbers, NPWP — the columns were dropped from the
  database (UU PDP data minimisation). Employers check identity documents at the interview.
- **Payments:** `[BUILT, MANUAL PAYMENT]` — QRIS/bank transfer confirmed by an admin, who activates the
  plan for 30 days. A gateway (Midtrans/Xendit: QRIS 0.7%, VA Rp4,000, cards 2.9% + Rp2,000, no setup
  fee) is a roadmap item, not wired in this build.

## Built vs. Planned

**Built and demonstrable end-to-end:**
- Auth (JWT, bcrypt, role routing)
- CV upload → Gemini extraction → embedding → pgvector HNSW matching → explainable, **proof-weighted** score breakdown
- Skill quizzes with ✓ Terbukti badges, HR skill confirmation, and proof that survives profile edits / CV re-uploads
- Job links + printable QR posters, public apply page, AutoMod + poster notices + appeals + strikes + candidate reports
- Email OTP verification, plan limits (Spark/Beacon/Lighthouse/Prism), admin panel, measured AI cost per action
- Skill gap analysis (deterministic gap + Gemini-narrated recommendations)
- Application submission and milestone tracking
- Employer job posting (single + bulk PDF pack), applications pipeline, candidate sourcing/shortlisting with tenant-ownership guards
- A/B assignment + event logging (instrumentation only)
- CI (lint, backend audit, build gate) and tagged-release container publishing

**Manual / draft, clearly labeled in-product:**
- Plan payments: QRIS or bank transfer activated by an admin (no gateway yet)
- Starter quiz bank ships as a draft (`reviewed=false`) pending review by HR practitioners
- Email OTP falls back to returning the code in the response when no email provider is configured (never in production)

**On the roadmap, not yet built:**
- Vertex AI VPC / Zero Data Retention inference
- Production payment gateway (Midtrans/Xendit)
- Score calibration against real interview/hire outcomes (the data is being recorded now via `application_status_events`)
- Matching-algorithm improvements (skill taxonomy, multi-vector embeddings, dynamic reranking) — see [Roadmap](ROADMAP.md)

**Not planned:**
- A multi-node LangGraph topology, ReAct tool-calling, or any multi-agent architecture. The single-node design above is a deliberate fit for the system's current scale, not a stepping stone toward one.
- An A/B experiment analysis dashboard and model fine-tuning feedback loop
- Automated VPS deployment from CI (the release workflow publishes images; deployment to the VPS is manual)

Architectural debt and open bugs are tracked inline as code comments at the relevant call sites (e.g. `backend/app/api/routers/employer.py`) rather than in a separate standing document.


## Migrations

Alembic only — never `create_all()`. Current head: **`b1d3f5a7c902`** (v3), which
adds `skill_questions.source` / `review_note` (question provenance: `human` | `ai_auto` |
`ai_draft`), `job_reports.rule_cited` / `upheld` (which published rule was alleged, and how the
accusation ended), `quiz_attempts.proof_eligible` (whether that draw may award a badge), and
`application_status_events.reason_code` / `reason_note` (mandatory rejection feedback). Its parent
is `a2b4c6d8e0f1` (v2 proof-of-skill). Every column is defaulted or nullable, so the upgrade is safe
on populated tables and the downgrade is a clean drop; CI runs the round-trip.

### Job moderation states

| State | Publicly visible | How it is reached |
|---|---|---|
| `published` | yes | AutoMod found nothing, or an admin published it |
| `flagged` | **yes** | weighted community reports crossed the threshold — under review, not removed |
| `held` | no | soft rule, first-job review, or a confirmed hard-rule violation |
| `rejected` | no | hard rule at posting time, or an admin decision (+ strike) |

`policy.set_moderation()` keeps the invariant that anything outside
`policy.VISIBLE_STATUSES` is also `is_active = False`.
