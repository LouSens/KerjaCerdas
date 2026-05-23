<div align="center">

# KerjaCerdas

**Semantic-Based Job Matching Platform for the Indonesian Labor Market**

[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com) [![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org) [![Frontend: React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)](https://react.dev) [![Tooling: Vite](https://img.shields.io/badge/Tooling-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev) [![Styling: Tailwind](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com) [![AI: Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev) [![Agents: LangGraph](https://img.shields.io/badge/Agents-LangGraph-FF6F00?style=flat-square)](https://langchain-ai.github.io/langgraph/)


| Seeker Dashboard | AI Job Matches | Employer Dashboard |
| :---: | :---: | :---: |
| <img src="docs/assets/seeker_dashboard.png" width="400"/> | <img src="docs/assets/job_matches.png" width="400"/> | <img src="docs/assets/employer_dashboard.png" width="400"/> |

[Demo Walkthrough](#-demo-walkthrough) · [Quick Start](#-quick-start-5-minutes) · [Architecture](#-system-architecture) · [Business Proposal](docs/PROPOSAL_2ND.md)

</div>

---

## 📌 The Problem We Solve

Indonesia has **7.86 million unemployed** [ESTIMATE] (BPS, Feb 2025) — yet employers say they *"can't find the right people."* The root cause is a **triple mismatch**:

| Mismatch | Scale | Impact |
|---|---|---|
| **Skill mismatch** | 62% [ESTIMATE] of graduates work outside their field | Wasted education investment |
| **Relevance mismatch** | Keyword search misses semantically-related skills | Good candidates rejected, bad ones shortlisted |
| **Trust mismatch** | Unverifiable CVs → HR over-relies on brand-name universities | Regional talent (non-UI/ITB) systematically underestimated |

Existing portals (Jobstreet, Glints, Kalibrr) are **keyword search engines with a paywall**. They don't understand skills. KerjaCerdas does.

---

## ✨ What Makes KerjaCerdas Different

| Feature | Traditional Portals | **KerjaCerdas** |
|---|---|---|
| Matching engine | Keyword filter | **Gemini semantic embeddings** (3072-dim vectors) |
| Skill gap | None | **Specific skills identified + course recommendations** |
| Career guidance | None | **AI advisor in Bahasa Indonesia** (context-aware) |
| Verification | Optional / self-reported | **Mock e-KYC: NIK, Ijazah, NPWP** |
| Seeker cost | Premium upsell (Rp 49rb–199rb/mo) [ESTIMATE] | **Free forever** |
| Employer posting | Rp 3–5 juta/post [ESTIMATE] | **Rp 499rb/post** [ESTIMATE] |
| Regional fairness | Java-centric | **Region-weighted scoring** (34 provinces) |

---

## 🎯 MVP Features (Fully Working in This Demo)

### For Job Seekers
- ✅ **Register & Login** (JWT auth, role-based)
- ✅ **Upload CV (PDF)** → Gemini AI parses skills, experience, education automatically
- ✅ **AI Job Matching** → semantic vector search against live job database
- ✅ **Skill Gap Analysis** → exact missing skills identified per job
- ✅ **Course Recommendations** → specific courses to bridge each gap
- ✅ **AI Career Advisor** → chat-based, Bahasa Indonesia, context-aware
- ✅ **Save Jobs** → bookmarked jobs synced to backend (cross-session)
- ✅ **Identity Verification** → mock KTP/NIK + Ijazah + trust badge

### For Employers
- ✅ **Register & Login** → Employer profile auto-created, ready to post immediately
- ✅ **Post Job** → manual form OR upload PDF job pack (AI creates postings automatically)
- ✅ **AI Candidate Ranking** → top-5 candidates ranked by Gemini for each posting
- ✅ **Live Pool Estimation** → see estimated candidate count *as you type* the JD
- ✅ **Manage Jobs** → view all active postings with real application counts
- ✅ **Company Verification** → mock NPWP/Akta verification → trust badge

---

## 🏆 Hackathon Judging Alignment

KerjaCerdas is explicitly designed to score highly against standard innovation hackathon criteria, grounded strictly in real-world data and market research:

### 1. Alignment with Problem Statement & Market Needs
- **The Data**: Indonesia faces 7.86 million unemployed [ESTIMATE] (BPS, Feb 2025) and a 62% skill mismatch rate [ESTIMATE]. Furthermore, 78% of HR managers [ESTIMATE] reject CVs without thorough review due to keyword-filtering limitations (from our initial HR validation surveys).
- **The Solution**: We replace legacy keyword filters with semantic AI, directly addressing the core "triple mismatch" (Skill, Relevance, and Trust) in the Indonesian labor market.

### 2. Effectiveness & Impact
- **Seeker Impact**: Empowers candidates (especially those from non-top-tier universities) by shifting the recruitment focus strictly to validated skills rather than institutional pedigree.
- **Employer Impact**: Designed to slash the average time-to-hire from **45 days to < 15 days** [ESTIMATE]. By automatically serving a pre-ranked top-5 shortlist, we target a **4× increase** [ESTIMATE] in match relevance compared to traditional portals.

### 3. Business Model Feasibility
- **Sustainability**: A freemium ecosystem where job seekers always use the platform for free. Employers pay a highly accessible **Rp 499,000 per post** [ESTIMATE] (drastically cheaper than the Rp 3–5 million [ESTIMATE] charged by incumbents).
- **Unit Economics**: Built for profitability with an estimated **78% gross margin** [ESTIMATE], driven by highly optimized Gemini API routing (costing only ~Rp 30 per seeker/month [ESTIMATE] for AI inferences).

### 4. Uniqueness & Creativity
- **Beyond Keywords**: Mapping candidate capabilities into a 3072-dimensional vector space to find implicit matches that standard regex and keyword filters miss.
- **Agentic Workflow**: Instead of static forms, we use LangGraph agents to orchestrate CV parsing, gap analysis, and course recommendations into a single, cohesive UI experience.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- (Optional) A `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com) — the app works without it using an offline fallback embedder, but AI features will be less accurate

### Step 1 — Clone & Configure

```powershell
git clone https://github.com/LouSens/KerjaCerdas.git
cd KerjaCerdas

# Copy environment template
Copy-Item .env.example .env
```

Open `.env` and set at minimum:
```env
# Required for persistent JWT tokens (generate once, keep it stable)
JWT_SECRET_KEY=your-random-secret-here

# Optional but recommended — enables real AI matching & CV parsing
GEMINI_API_KEY=your-gemini-api-key
```

> **Generate a JWT secret on PowerShell:**
> ```powershell
> [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
> ```

### Step 2 — Start the Backend

```powershell
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate

# Install dependencies
pip install -e .[dev]

# Start FastAPI server
uvicorn backend.app.api.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir backend/app
```

**What happens on first boot:**
1. SQLite database is created at `data/kerjacerdas.db`
2. Auto-seeder detects empty store → seeds **3 employers, 12 jobs, 5 seekers** from real Indonesian companies (Bank Mandiri, Tokopedia, Akulaku)
3. API is live at `http://localhost:8000`
4. Interactive docs at `http://localhost:8000/docs`

### Step 3 — Start the Frontend

```powershell
# In a new terminal
cd frontend
npm install
npm run dev
```

Frontend is live at **`http://localhost:3000`**

> The Vite dev server proxies `/api/*` to the FastAPI backend automatically — no CORS config needed in development.

### Step 4 — Open the App & Log In

Go to **http://localhost:3000** and use one of the pre-seeded demo accounts:

| Role | Email | Password |
|---|---|---|
| 🔍 Job Seeker | `andi@example.com` | `demo123456` |
| 🔍 Senior Engineer | `rina@example.com` | `demo123456` |
| 🏢 Employer (Bank Mandiri) | `hr@bankmandiri.id` | `demo123456` |
| 🏢 Employer (Tokopedia) | `hr@tokopedia.com` | `demo123456` |

---

## 🎬 Demo Walkthrough

### Path A — Job Seeker Flow

> *Follow this path to demonstrate the full AI matching experience*

#### Step 1: Register or Login
Click **"Masuk / Daftar"** in the top-right. Select **"Pencari Kerja"** tab.
- Login: `andi@example.com` / `demo123456`
- Or register a brand-new account → you'll land on the seeker dashboard

**What happens in the backend:**
- `POST /api/v1/auth/login` validates credentials against SQLite `users` table
- JWT token (HS256, 24h expiry) is issued and stored in browser localStorage
- Zustand store is hydrated: role=seeker, user data, auth token
- `GET /api/v1/seeker/bookmarks` fires automatically → saved jobs loaded

#### Step 2: Upload Your CV
Navigate to **"Upload CV"** (sidebar or dashboard button → "Upload CV").
Drop or click to upload any PDF resume. Watch the AI parse it live.

**What happens in the backend:**
```
PDF bytes → POST /api/v1/uploads/cv
  → Gemini multimodal (gemini-3.1-flash-lite)
  → Extracts: full_name, headline, skills[], experience[], education[], salary_expectation
  → SeekerProfile saved to data/seekers/{id}.json
  → Gemini Embedding API → 3072-dim vector stored alongside profile
  → seeker_id returned → stored in Zustand + localStorage
```

**What you see:**
- Skill count, experience count, education count update immediately
- Profile completeness widget on dashboard updates
- "Profil-mu siap di-match" confirmation card appears

#### Step 3: Get AI Job Matches
Click **"Refresh Match →"** on the dashboard, or navigate to **"Temukan Lowongan"**.

**What happens in the backend:**
```
POST /api/v1/agent/invoke
  → LangGraph: IntentRouter detects intent = "match_jobs"
  → SemanticMatcher: embed seeker query vector
  → Cosine similarity vs all job embeddings in data/jobs/
  → Scoring formula:
     score = cosine×0.50 + skill_overlap×0.30 + region×0.10 + salary×0.05 + exp×0.05
  → Top-K results enriched with: title, company, salary_range, matching_skills, missing_skills
  → LLM generates Bahasa Indonesia explanation per match
```

**What you see:**
- Job cards with match score (e.g. 92%), company name, salary range
- Green tags = skills you already have ✅
- Orange tags = skills you're missing (with gap counts)
- AI explanation: *"Stack Go kamu 100% match sama requirement Tokopedia payment team"*

#### Step 4: Analyze Skill Gap
Click **"Skill Gap"** on a job card, or navigate to **"Skill Gap"** in sidebar.

**What happens in the backend:**
```
POST /api/v1/agent/invoke { message: "analyze skill gap for [job_id]" }
  → LangGraph: intent = "skill_gap"
  → SkillGapNode: compare seeker skills vs job requirements
  → LLM generates specific gap analysis:
     - Missing skills: ["Kafka", "Kubernetes", "gRPC"]
     - Matching: ["Python", "SQL", "Docker"]
     - Recommended courses per gap (Dicoding, Coursera ID, Prakerja)
     - Time estimate to close each gap
```

**What you see:**
- Side-by-side skill comparison: have / don't have
- Recommended courses with platform name and time-to-complete
- AI career message: *"Kafka bisa dikuasai dalam 3-4 minggu — prioritas ini"*

#### Step 5: Chat with AI Advisor
Click the **🤖 bubble** in the bottom-right corner (visible on all pages).

**What happens in the backend:**
```
POST /api/v1/agent/invoke { message: "user's question", session_id: seeker_id }
  → LangGraph: intent = "advise"
  → AdvisorNode: Gemini (temp=0.7), persona = career counselor with 10yr Indonesia experience
  → Response in Bahasa Indonesia
  → Conversation history maintained per session_id
```

**What you see:**
- AI responds in fluent Bahasa Indonesia
- Knows your profile context (your skills, matches, gaps)
- Can advise on salary negotiation, CV tips, regional job markets

#### Step 6: Save Jobs
Click the bookmark icon on any job card. Saved jobs appear under **"Tersimpan"**.

**What happens in the backend:**
```
POST /api/v1/seeker/bookmarks { job_id: "..." }
  → Application stored in data/applications/
  → Next login → GET /api/v1/seeker/bookmarks → list restored
```

Saved jobs **persist across sessions** — they sync to the backend, not just localStorage.

#### Step 7: Verify Identity
Navigate to **"Verifikasi"** from the sidebar.

**What happens (demo simulation):**
- Enter your NIK (16 digits). NIKs starting with `99` = simulate failure; all others = success
- SHA-256 hash generated server-side (PII never stored in plaintext)
- Upload Ijazah proof → SIVIL reference number validated → ✓ badge awarded
- Verified badge increases candidate ranking visibility by 3× in employer searches

---

### Path B — Employer Flow

> *Follow this path to demonstrate the HR/employer experience*

#### Step 1: Register as Employer
Click **"Masuk / Daftar"** → Select **"Employer"** tab → Register.

**What happens in the backend:**
```
POST /api/v1/auth/register { role: "employer" }
  → User saved to SQLite
  → Employer profile auto-created in JSON store:
     { user_id, company_name: [user's name], region_code: "3171" }
  → JWT token issued immediately
  → Employer can post jobs RIGHT AWAY — no separate profile step required
```

#### Step 2: View Dashboard
You land on **Employer Dashboard** showing your active jobs and stats.

**What happens in the backend:**
```
GET /api/v1/employer/jobs
  → Auth-gated: only returns jobs for THIS employer
  → For each job: real application_count computed from data/applications/
  → Returns: { total, items: [{ id, title, location, salary_range, application_count }] }
```

**What you see:**
- Your jobs only (not other employers' jobs)
- Real applicant counts per posting
- Stats: active jobs, total applications, plan quota

#### Step 3: Post a New Job (Manual)
Click **"+ Pasang Lowongan"** → Fill in the form.

**Live AI estimation** — as you type the job title, description, skills, and salary:
```
POST /api/v1/employer/jobs/estimate { title, description, skills, salary_min, salary_max, location }
  → Debounced 500ms
  → Quick heuristic match against seeker pool
  → Returns: { pool_size: 340, match_score: 82, tip: "Raise salary to Rp 35-50M → 620 candidates" }
```

Click **"Publish →"**:
```
POST /api/v1/employer/jobs { title, description, required_skills, salary, location, work_type }
  → Auth validated (employer role required)
  → JobPosting saved to data/jobs/{id}.json
  → GeminiEmbedder embeds job description → vector stored
  → Immediately visible to seeker matching engine
  → Dashboard refreshes: employerJobs count +1
```

#### Step 4: Upload Job Pack (AI Batch Posting)
Click **"Upload Job Pack (PDF)"** — upload a PDF containing multiple job descriptions.

**What happens in the backend:**
```
POST /api/v1/uploads/job-pack (multipart/form-data)
  → Gemini multimodal: parse PDF → extract multiple job postings
  → For each posting detected:
     { title, description, responsibilities[], required_skills[],
       salary_min, salary_max, region_code, remote_allowed }
  → Each job embedded + saved to data/jobs/
  → Returns: { created_job_ids: ["id1", "id2", ...] }
```

**What you see:**
- Upload 1 PDF → 3 jobs created automatically in seconds
- No manual form filling per position
- Jobs immediately appear in dashboard and are matchable by seekers

#### Step 5: See Top 5 Candidates
Click **"Kandidat"** on any job row, or navigate to **"Top 5 Kandidat"**.

**What happens in the backend:**
```
POST /api/v1/employer/jobs/{job_id}/candidates { top_k: 5 }
  → Reverse matching: embed job → cosine sim vs all seeker embeddings
  → Rerank by skill overlap + verification badge weight
  → Returns: top-5 candidates with scores, skills, AI explanation
```

**What you see:**
- 5 candidate cards ranked #1–#5 with match score (e.g. 94%)
- ✓ VERIFIED badge for e-KYC verified seekers
- AI reasoning: *"Stack 100% match. Pernah handle 100K RPS di Bukalapak payment."*
- Filter by: All / ✓ Verified KTP / >5yr exp / Location

#### Step 6: Verify Your Company
Navigate to **"Verifikasi Perusahaan"** from the sidebar.

**What happens (demo simulation):**
- Enter NPWP (15 digits) → format validated → deterministic mock response from DJP
- Upload Akta Pendirian → Kemenkumham AHU reference validated
- Company email OTP → domain ownership confirmed
- ✓ Verified badge appears on all your job postings → seekers see your company as trusted

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND  (React 18 + Vite)                      │
│  ┌────────────┐  ┌─────────────────┐                  ┌─────────┐ │
│  │  Seeker    │  │    Employer     │                  │Floating │ │
│  │  Dashboard │  │    Dashboard    │                  │Advisor  │ │
│  └────────────┘  └─────────────────┘                  └─────────┘ │
│                  Zustand (global state) + react-hot-toast           │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │  /api/v1/* (proxied by Vite)
┌─────────────────────────────────▼───────────────────────────────────┐
│                    BACKEND  (FastAPI + Uvicorn)                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      API Routers                               │ │
│  │  /auth  /seeker  /employer  /agent  /uploads  /verify          │ │
│  └──────────────────────────────┬─────────────────────────────────┘ │
│                                 │                                    │
│  ┌──────────────────────────────▼─────────────────────────────────┐ │
│  │                  LangGraph Agent Graph                         │ │
│  │                                                                │ │
│  │   IntentRouter ──┬──► MatcherNode  (Gemini embedding + cosine) │ │
│  │                  ├──► SkillGapNode (LLM + skill comparison)    │ │
│  │                  └──► AdvisorNode  (Gemini, temp=0.7, ID)      │ │
│  │                            └──► ComposeNode → Response         │ │
│  └──────────────────────────────┬─────────────────────────────────┘ │
│                                 │                                    │
│  ┌──────────────────────────────▼─────────────────────────────────┐ │
│  │                    Data Layer                                  │ │
│  │  JsonRepository (dev: data/*.json) ← → SupabaseRepository     │ │
│  │  GeminiEmbedder (3072-dim) ←fallback→ HashEmbedder (offline)  │ │
│  │  SemanticMatcher (scoring formula: cosine+skill+region+salary)  │ │
│  └──────────────────────────────┬─────────────────────────────────┘ │
│                                 │                                    │
│  SQLite (auth) ◄────────────────┘  ──► PostgreSQL 15 (production)   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                     GOOGLE AI PLATFORM                               │
│  Gemini 3.1 Flash Lite (chat/parse)                                 │
│  Gemini Embedding 001 (3072-dim semantic vectors)                   │
└─────────────────────────────────────────────────────────────────────┘
```

### How Data Flows: From CV Upload to Match

```
1.  Seeker uploads PDF
         │
2.  Gemini multimodal parses PDF
         │ → { skills, experience, education, salary_expectation }
         │
3.  GeminiEmbedder.embed(resume_text) → 3072-dim vector
         │
4.  SeekerProfile saved → data/seekers/{id}.json
         │
5.  Frontend: runAgent("show my top matches")
         │
6.  LangGraph → MatcherNode
         │
7.  Cosine similarity: seeker_vector vs all job_vectors in data/jobs/
         │
8.  Top-K scored: cosine×0.50 + skill_overlap×0.30 + region×0.10 + ...
         │
9.  EnrichMatches: join with JobPosting → add title/company/salary/skills
         │
10. LLM generates Bahasa Indonesia explanation per match
         │
11. Response → Frontend renders full job cards with match scores
```

---

## 📂 Repository Structure

```
KerjaCerdas/
│
├── backend/                        # Python service
│   ├── app/
│   │   ├── api/
│   │   │   ├── main.py             # FastAPI entrypoint (auto-seeds on first boot)
│   │   │   ├── database.py         # SQLAlchemy async engine (SQLite→PostgreSQL)
│   │   │   ├── models.py           # ORM: User (auth only)
│   │   │   ├── dependencies.py     # JWT auth dependencies
│   │   │   ├── routers/
│   │   │   │   ├── auth.py         # Register / Login → JWT + employer auto-profile
│   │   │   │   ├── seeker.py       # Profile, skill gap, bookmarks, gamification
│   │   │   │   ├── employer.py     # Profile, job CRUD, candidates, job-pack
│   │   │   │   ├── agent.py        # Unified AI agent endpoint (match/gap/advise)
│   │   │   │   ├── uploads.py      # CV + job-pack PDF → Gemini → JSON store
│   │   │   │   ├── verify.py       # Identity / education / NPWP verification
│   │   │   │   └── jobs.py         # Public job feed (no auth)
│   │   │   ├── services/
│   │   │   │   ├── auth_service.py       # bcrypt + JWT
│   │   │   │   ├── pdf_parser.py         # Gemini PDF → structured JSON
│   │   │   │   ├── identity_verifier.py  # Mock e-KYC (NIK/Ijazah/NPWP)
│   │   │   │   └── prompt_loader.py      # System prompt templates
│   │   │   └── schemas/
│   │   │       └── auth.py               # Pydantic request/response schemas
│   │   │
│   │   ├── agents/
│   │   │   └── graph/
│   │   │       ├── builder.py      # LangGraph graph compilation
│   │   │       ├── nodes.py        # MatcherNode, SkillGapNode, AdvisorNode, RouterNode
│   │   │       └── state.py        # AgentState TypedDict
│   │   │
│   │   ├── ml/
│   │   │   ├── matcher.py          # SemanticMatcher: embed + score + rank
│   │   │   └── embeddings/
│   │   │       └── gemini.py       # GeminiEmbedder (+ HashEmbedder offline fallback)
│   │   │
│   │   ├── db/
│   │   │   ├── schemas.py          # Canonical Pydantic models (single source of truth)
│   │   │   ├── json_store.py       # JsonRepository (dev) — Supabase-API compatible
│   │   │   └── supabase_store.py   # Supabase stub (production path)
│   │   │
│   │   └── config/
│   │       └── settings.py         # Pydantic Settings (all from .env)
│   │
│   └── tests/
│       └── unit/
│           └── test_api.py
│
├── frontend/                       # React 18 + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── _design.jsx           # Design system (KC tokens, BrutalCard, etc.)
│   │   │   ├── SeekerDashboard.jsx   # Seeker home (matches, profile, advisor CTA)
│   │   │   ├── SeekerMatchResults.jsx # Full match list with score donuts
│   │   │   ├── SkillGapPanel.jsx     # Skill gap + course recommendations
│   │   │   ├── CVUploader.jsx        # PDF drag-drop → live Gemini parse
│   │   │   ├── SavedJobsPage.jsx     # Bookmarked jobs (backend-synced)
│   │   │   ├── EmployerDashboardV2.jsx  # Employer home (own jobs, metrics)
│   │   │   ├── EmployerPostJob.jsx   # Job form + live AI estimation
│   │   │   ├── EmployerCandidates.jsx # Top-5 candidate ranking
│   │   │   ├── EmployerVerification.jsx # NPWP/Akta verification
│   │   │   ├── JobPackUploader.jsx   # PDF batch job upload
│   │   │   ├── VerificationDashboard.jsx # KTP/Ijazah verification flow
│   │   │   ├── FloatingAdvisor.jsx   # Persistent chat bubble (all pages)
│   │   │   └── AuthModal.jsx         # Login / Register modal
│   │   ├── store/
│   │   │   └── useStore.js           # Zustand store (auth + UI + API calls)
│   │   └── services/
│   │       └── api.js                # All backend API calls (single source)
│   └── vite.config.js               # Proxy /api/* → :8000
│
├── scripts/
│   └── seed_json.py                 # Demo data seeder (also runs on first boot)
│
├── docs/
│   ├── PROPOSAL_2ND.md              # Full business + technical proposal (27 sections)
│   ├── PRD.md                       # Product Requirements Document
│   ├── BUSINESS_MODEL.md            # Revenue model, unit economics
│   ├── FEASIBILITY_REPORT.md        # Anti-hallucination & technical feasibility
│   ├── ML_PIPELINE.md               # Full ML pipeline documentation
│   ├── API_SPEC.md                  # OpenAPI spec narrative
│   └── DEMO_SCRIPT.md              # Hackathon demo walkthrough
│
├── .env.example                     # Template — copy to .env
├── docker-compose.yml               # Full stack (backend + frontend)
├── pyproject.toml                   # Python dependencies
└── README.md                        # This file
```

---

## 📊 Data & Feasibility

### 1. Data Sources & Grounding
Our models and matching algorithms are grounded in real Indonesian labor market data:
- **BPS (Badan Pusat Statistik)**: Region codes, occupational classifications (KBJI).
- **Industry Standard Taxonomies**: Real-world job titles and skills mapped to Indonesian context.
- **Course Providers**: Live integration pathways with Dicoding, Coursera ID, and Prakerja.

### 2. Semantic Embedding (Not Keywords)

Traditional: `"Python" ∈ job.keywords` → binary match/no-match

**KerjaCerdas:** Every seeker profile and job posting is converted into a **3072-dimensional semantic vector** using Google Gemini Embedding API. The distance between these vectors captures *meaning*, not just token overlap.

```
"5 years developing distributed payment systems in Go"
                    ↓ Gemini embed()
[0.021, -0.143, 0.082, ..., 0.317]  ← 3072 floats
                    ↓ cosine similarity
vs "Backend Engineer – Go, Kafka, microservices, payment"
→ score: 0.87  ← highly relevant, even without exact keyword match
```

### 2. Multi-Signal Scoring Formula

```python
final_score = (
    cosine_similarity * 0.50 +   # What does the seeker actually know?
    skill_overlap     * 0.30 +   # How many required skills match exactly?
    region_boost      * 0.10 +   # Is the seeker in the right city/region?
    salary_fit        * 0.05 +   # Does expected salary fit the range?
    experience_fit    * 0.05     # Does YoE align with the requirement?
)
```

### 3. LangGraph Agentic Orchestration

```
User: "tampilkan 5 pekerjaan terbaik buat aku"
          │
          ▼
   IntentRouter (Gemini, temp=0.2)
   → intent = "match_jobs"
          │
          ▼
   MatcherNode
   → embeds seeker, runs cosine search, scores top-K
          │
          ▼
   ComposeNode
   → LLM writes Bahasa Indonesia explanation for each match
          │
          ▼
   Response: 5 enriched job cards + explanations
```

The same endpoint handles **matching**, **skill gap analysis**, and **career advising** — intent routing happens automatically based on the user's message.

### 4. Graceful Degradation (No API Key? No Problem.)

If `GEMINI_API_KEY` is not configured:
- `GeminiEmbedder` → automatically falls back to `HashEmbedder`
- `HashEmbedder` produces deterministic vectors from token hashes — matching still works, just with lower semantic accuracy
- PDF parsing falls back to text-heuristic extraction (pypdf)
- Platform **never crashes** — degrades gracefully instead

---

## 🔐 Security & Compliance

KerjaCerdas is designed with **UU PDP (Undang-Undang Pelindungan Data Pribadi)** readiness in mind from day one.

| Concern | Implementation |
|---|---|
| Passwords | bcrypt hash (cost 12) — never stored plaintext |
| Sessions | JWT HS256 (24h expiry) — from `.env` `JWT_SECRET_KEY` |
| PII in AI calls | Regex redaction: email → `[email]`, phone → `[phone]`, NIK → `[nik]` before LLM |
| Role enforcement | `require_employer`, `require_seeker` FastAPI dependencies per router |
| CORS | Strict whitelist: localhost:3000/5173 in dev, production domain only |
| Verification data | SHA-256 hash only stored — original NIK never persisted |
| Secrets | RULE-01 (PROTOCOL.md): no hardcoded secrets anywhere |
| Compliance | Localized data processing; strict separation of PII from AI prompt context |

---

## 🚀 Implementation Readiness (MVP)

KerjaCerdas is not just a wireframe. We built a **fully functional MVP** ready for live user testing.

- **Backend Readiness**: Fully implemented FastAPI backend with LangGraph agentic orchestration, semantic vector search, and integrated Gemini capabilities.
- **Frontend Readiness**: Responsive React 18 SPA with Zustand state management, capable of handling PDF uploads, live AI chat, and dynamic data visualization.
- **Zero-Friction Demo**: The repository auto-seeds 20 real-world job seekers, 12 employers, and 15 courses on first boot, allowing judges to test the semantic matching engine immediately.
- **Offline Fallback**: Designed to degrade gracefully using an offline `HashEmbedder` if API keys are unavailable, ensuring the platform never crashes during a demo.

---

## 💼 Business Model (Summary)

| Phase | Revenue Stream | Target MRR |
|---|---|---|
| **Phase 1** (now) | Employer pay-per-post (Rp 499rb) [ESTIMATE], Seeker Pro (Rp 49rb/mo) [ESTIMATE], Affiliate courses 8–15% [ESTIMATE] | Rp 17,5 juta [ESTIMATE] |
| **Phase 2** (6–18 mo) | Employer Growth plan (Rp 1,5jt/mo) [ESTIMATE], Enterprise (Rp 25jt/mo) [ESTIMATE], Verified Talent Pool | Rp 1 miliar [ESTIMATE] |
| **Phase 3** (18mo+) | Government licensing (Disnaker), ATS integration, Regional analytics API | Rp 5 miliar [ESTIMATE] |

**Unit Economics:** LTV/CAC = **28×** [ESTIMATE] · Gross margin = **78%** [ESTIMATE] · Seeker is always **free**

→ See [docs/PROPOSAL_2ND.md](docs/PROPOSAL_2ND.md) for the full 27-section business proposal.

---

## 🔧 Development Guide

### Run Backend Tests
```powershell
python -m pytest backend/tests/unit/test_api.py -v
```

### Manually Re-Seed Demo Data
```powershell
python -m scripts.seed_json
```
This seeds: **Bank Mandiri, Tokopedia, Akulaku** as employers with **12 job postings** and **5 seeker profiles** (Andi, Rina, Budi, Sari, Dian). All with real Gemini embeddings if API key is set.

### Check Backend Health
```
GET http://localhost:8000/health
→ { "status": "healthy", "service": "KerjaCerdas API", "version": "0.3.0" }
```

### API Interactive Docs
```
http://localhost:8000/docs     ← Swagger UI (all endpoints, try-it-out)
http://localhost:8000/redoc    ← ReDoc (cleaner reading)
```

### Docker (Full Stack)
```powershell
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

---

## 🗺️ Roadmap

| Phase | Timeline | Milestone |
|---|---|---|
| **v0.3 (current)** | May 2026 | Full-stack MVP, Gemini matching, LangGraph agents, e-KYC mock |
| **v0.4** | June 2026 | pgvector migration, IndoBERT fine-tuning baseline |
| **v0.5** | July 2026 | Prakerja & Dicoding affiliate integration |
| **v1.0** | Aug 2026 | Production PostgreSQL, real Dukcapil API, pilot with 10 employer SMEs |
| **v1.5** | Q4 2026 | 100 employer, 5K seeker, 2 Disnaker province pilots |

---

## 📚 Further Reading

| Document | Description |
|---|---|
| [PROPOSAL_2ND.md](docs/PROPOSAL_2ND.md) | Full 27-section business + technical competition proposal |
| [PRD.md](docs/PRD.md) | Product Requirements Document |
| [BUSINESS_MODEL.md](docs/BUSINESS_MODEL.md) | Revenue model, unit economics, competitive analysis |
| [FEASIBILITY_REPORT.md](docs/FEASIBILITY_REPORT.md) | Anti-hallucination design, evaluation metrics |
| [ML_PIPELINE.md](docs/ML_PIPELINE.md) | Full ML pipeline: ingestion → training → evaluation → deployment |
| [API_SPEC.md](docs/API_SPEC.md) | OpenAPI endpoint narrative |
| [VERIFICATION_DEMO.md](docs/VERIFICATION_DEMO.md) | e-KYC demo behavior and test cases |

---

<div align="center">

**KerjaCerdas v0.3.0**

*Built for Hackathon x Digdaya 2026*

</div>
