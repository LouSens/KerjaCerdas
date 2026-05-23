# ⚙️ KerjaCerdas API

> **The Engine Behind the Match**

This directory contains the FastAPI-powered backend that orchestrates the AI agents, manages the database, and serves the frontend.

## 🚀 Tech Stack
- **Framework**: FastAPI (High-performance Python API)
- **Database**: PostgreSQL with `pgvector` for semantic search
- **Task Queue/Cache**: Redis
- **Validation**: Pydantic v2
- **Documentation**: Swagger UI & Redoc (auto-generated)

## 🤖 AI Orchestration
The API is built on a **Multi-Agent** architecture:
1. **Orchestrator**: Routes requests and ensures Protocol compliance.
2. **Matching Agent**: Interfaces with the **IndoBERT** models for semantic job-skill relevance.
3. **Skill Gap Agent**: Performs RAG-enhanced analysis using **Google Gemini**.
4. **Advisor Agent**: Provides conversational career advice in Bahasa Indonesia.

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
uvicorn src.api.main:app --reload --port 8000
```
Interactive documentation: `http://localhost:8000/docs`

## 📂 Key Endpoints
- `POST /match/`: Get AI-ranked job matches for a seeker profile.
- `GET /skill-gap/{job_id}`: Analyze skill gaps and get course recommendations.
- `POST /advisor/chat`: Interact with the AI Career Advisor.
- `GET /health`: System health monitoring.

---
<div align="center">
*Built for Hackathon 2026*
</div>
