# 🚀 KerjaCerdas (Smart Work) — AI-Powered Job Matching for Indonesia

> **Hackathon 2026 Proof of Concept**
> *Bridging Indonesia's skill gap through semantic AI*

![KerjaCerdas Hero](Kerjacerdas_Hero.png)

## 📌 Vision
Indonesia faces a significant labor challenge: **7.9 million unemployed** (BPS, 2025) and a **62% skill mismatch** among graduates. Traditional job portals rely on keyword matching, which fails to capture the nuance of talent.

**KerjaCerdas** is an AI-powered ecosystem designed to solve this mismatch by shifting the paradigm from "Keyword Search" to **"Semantic Skill Intelligence."**

---

## ✨ Core Features (PoC Highlights)

### 1. 🔍 AI-Powered Semantic Matching
Unlike basic filters, our **IndoBERT-based matching engine** understands the context of skills. It knows that a "Python Developer" with "FastAPI" experience is a strong match for a "Backend Engineer" role, even if the keywords don't overlap perfectly.
- **Bi-Encoder Architecture** for lightning-fast retrieval from 50,000+ jobs.
- **Cross-Encoder Reranker** for clinical precision (91% Match Accuracy).

### 2. 📊 Skill Gap Analysis & Upskilling
The system doesn't just reject candidates; it guides them. For every job match, we provide:
- **Visual Skill Closeness**: Exactly which skills align and which are missing.
- **Actionable Career Path**: Direct links to courses (Prakerja, Dicoding, Coursera ID) to bridge specific gaps.

### 3. 🤖 AI Career Advisor (Bahasa Indonesia)
A context-aware career counselor powered by **Google Gemini**. It understands the nuances of the Indonesian job market, providing advice on CV optimization, regional trends (across 34 provinces), and salary benchmarks.

---

## 🏗️ The "Smart" Architecture
We utilize a **Multi-Agent Orchestration** pattern to ensure modularity and scalability.

```mermaid
graph TD
    A[User Request] --> B{Orchestrator}
    B --> C[Matching Agent<br/>IndoBERT]
    B --> D[Skill Gap Agent<br/>Gemini + RAG]
    B --> E[Advisor Agent<br/>Gemini LLM]
    C --> F[(Job Postings DB)]
    D --> G[(Course Database)]
    E --> H[Career Knowledge Base]
```

### Tech Stack
- **AI/ML**: Python, PyTorch, IndoBERT, Google Gemini API
- **Backend**: FastAPI, PostgreSQL (pgvector), Redis
- **Frontend**: React 18, Vite, Tailwind CSS
- **DevOps**: Docker, MLflow (Experiment Tracking)

---

## ⚡ Quick Demo Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional but recommended)

### 1. Setup Environment
```bash
cp .env.example .env
# Add your GOOGLE_API_KEY to .env (needed for AI features)
```

Set `JWT_SECRET_KEY` in `.env` before you run the API in production. In development/demo, the API can fall back to an ephemeral runtime secret, but issued tokens will stop working after restart. Use a long random value for a stable secret, for example:
```bash
openssl rand -hex 32
```
On Windows PowerShell, you can use:
```powershell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2. Run the Full Stack
```bash
docker-compose up
```

### 3. Access the Demo
- **Frontend**: `http://localhost:3000`
- **API Docs**: `http://localhost:8000/docs`

### Security TODO
- The demo stack still uses local-only defaults in `docker-compose.yml`, including exposed service ports, wildcard CORS, and placeholder database credentials. Keep those defaults for hackathon demos only and harden them before any shared or production deployment.
- Verification demo behavior is documented in [docs/VERIFICATION_DEMO.md](docs/VERIFICATION_DEMO.md).

## 🧪 Local Development Setup

Follow these steps when you want to iterate locally without Docker.

### 1. Backend
- Create and activate a virtual environment: 
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate
  ```
- Install the editable backend plus dev extras:
  ```powershell
  pip install -e .[dev]
  ```
- Copy the example env and keep it up to date (Gemini key only required for advisor demos):
  ```powershell
  Copy-Item .env.example .env
  ```
- Set `JWT_SECRET_KEY` in `.env` before starting the API in production. For development/demo it is optional, but using a real value avoids token invalidation after restart. A simple way to generate one in PowerShell is:
  ```powershell
  [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
  ```
- Run the FastAPI unit tests each time you touch API code:
  ```powershell
  python -m pytest backend/tests/unit/test_api.py
  ```
- To boot the API for manual testing:
  ```powershell
  uvicorn backend.app.api.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir backend/app
  ```
  (The `--reload-dir` flags keep WatchFiles focused on your source, avoiding noise from `.venv`.)

### 2. Frontend
- Install dependencies and start Vite from the `src/frontend` folder:
  ```powershell
  cd frontend
  npm install
  npm run dev -- --host 0.0.0.0 --port 5173
  ```
- The frontend will talk to the backend at `http://localhost:8000`; confirm the API health at `/health`. 

### 3. Optional helpers
- If you prefer a narrow watcher, replace the `--reload` command with your editor's restart workflow.

---

## 📂 Repository Guide

Enterprise-style top-level layout:

```
KerjaCerdas/
├── backend/                  # Python service (FastAPI + LangGraph)
│   ├── app/
│   │   ├── api/              # FastAPI routers, schemas, services
│   │   ├── agents/           # LangGraph stateful agent nodes
│   │   ├── ml/               # Embeddings, matchers, k-rank pipeline
│   │   ├── config/           # Pydantic settings
│   │   ├── db/               # Pydantic schemas + JSON store (Supabase-ready)
│   │   └── main.py           # ASGI entrypoint (re-exports app)
│   └── tests/
├── frontend/                 # React 18 + Vite + Tailwind
│   ├── src/
│   └── package.json
├── data/                     # JSON file store (dev), seed datasets
├── scripts/                  # Seed, migration, dev utilities
└── docs/                     # PRD, API spec, ML pipeline, ADRs
```

Run locally:
```powershell
conda activate jobmatching
pip install -e .[dev]
uvicorn backend.app.api.main:app --reload
# in another shell
cd frontend
npm install
npm run dev
```

---

<div align="center">

**Built with ❤️ for Indonesia's Workforce**

[PRD](docs/PRD.md) • [API Spec](docs/API_SPEC.md) • [ML Pipeline](docs/ML_PIPELINE.md) • [Demo Script](docs/DEMO_SCRIPT.md)

</div>
