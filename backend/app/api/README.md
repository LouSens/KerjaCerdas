# ⚙️ KerjaCerdas API

> **The Engine Behind the Match**

This directory contains the FastAPI-powered backend that orchestrates the AI agents, manages the database, and serves the frontend.

## 🚀 Tech Stack
- **Framework**: FastAPI (High-performance async Python API)
- **Database**: PostgreSQL with `pgvector` for semantic search (via `backend/app/db/postgres_store.py`)
- **Rate limiting**: sliding-window middleware, in-process by default (see `docs/ARCHITECTURE.md`)
- **Validation**: Pydantic v2
- **Documentation**: Swagger UI & Redoc (auto-generated)

## 🤖 AI Pipeline

This is not a multi-agent orchestrator. It's procedural code inline in `routers/agent.py` (matching, a token gate, a hallucination guard) plus **one** LangGraph node (`START → agent_node → END`) that makes a single Gemini call to synthesize the final natural-language reply. There is no orchestrator/agent-to-agent handoff and no tool-calling loop — see `docs/ARCHITECTURE.md` for the full architecture and roadmap.

1. **Matching** (every chat message): `SemanticMatcher` — pgvector HNSW search + structured hybrid reranking. There is no intent classifier; a UI button's intent is only passed to the model as a hint.
2. **Token gate**: if no job carries any relevance signal, a templated reply is returned without calling the LLM.
3. **Response synthesis**: the single LangGraph node calls Gemini to phrase the reply in Bahasa Indonesia. The match cards go to the UI separately; job IDs not in the DB are stripped.
4. **Skill gap** (separate endpoint, `POST /api/v1/seeker/skill-gap`): deterministic set-difference + Gemini-narrated course recommendations via `nodes.py`'s `_recommend_courses`.

## 🛠️ Development Setup

### Prerequisites
- Python 3.11+
- virtualenv (recommended)

### 1. Setup Environment
```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -e .[dev]
```

Set `JWT_SECRET_KEY` in your `.env` file before starting the API in production. In development/demo, the API can generate an ephemeral runtime secret, but tokens will become invalid after restart. Generate a strong value with:
```bash
openssl rand -hex 32
```
or on PowerShell:
```powershell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2. Run Locally
```bash
uvicorn backend.app.api.main:app --reload --port 8000
```
Interactive documentation: `http://localhost:8000/docs`

## 📂 Key Endpoints

Full contract (all 10 routers, request/response schemas, rate limits, error codes): [`docs/API_SPEC.md`](../../../docs/API_SPEC.md). Most-used during a demo:
- `POST /api/v1/uploads/cv`: Parse a seeker's PDF CV into a structured profile + embedding.
- `POST /api/v1/agent/invoke`: AI-ranked job matches, skill gap, or career-advisor chat (routed procedurally — see above).
- `POST /api/v1/seeker/skill-gap`: Deterministic skill-gap computation for a target job.
- `POST /api/v1/employer/jobs/{id}/candidates`: Reverse-match candidates for an employer's job (ownership-guarded).
- `GET /health`: System liveness check.
