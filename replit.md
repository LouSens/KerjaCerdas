# KerjaCerdas

AI-powered job matching platform for Indonesia. Semantic CV matching, skill-gap analysis, and employer candidate shortlisting — all backed by Google Gemini and LangGraph agents.

## Stack

- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL (pgvector) — port 8000
- **Frontend**: React 18 + Vite + TailwindCSS — port 5000 (webview)
- **AI**: Google Gemini embeddings + chat, LangGraph ReAct agents

## Running on Replit

Two workflows are configured:

| Workflow | Command | Port |
|---|---|---|
| **Start application** | `cd frontend && npm run dev` | 5000 (webview) |
| **Backend API** | `uvicorn backend.app.api.main:app --host 0.0.0.0 --port 8000` | 8000 (console) |

The frontend Vite dev server proxies `/api/*` and `/health` to the backend on port 8000.

## Required Secrets

| Secret | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini AI (embeddings + chat). AI features are disabled without this. |
| `JWT_SECRET_KEY` | JWT signing key. Auto-generated ephemerally in development if not set. |

## Database

Uses Replit's built-in PostgreSQL with the `pgvector` extension enabled. Schema is managed via Alembic migrations (`backend/alembic/`).

To re-run migrations:
```bash
python -m alembic --config backend/alembic.ini upgrade head
```

## Project Structure

```
backend/          FastAPI app (Python)
  app/
    api/          Routers, middleware, database engine
    config/       Settings (pydantic-settings, reads env vars)
    db/           ORM models
    services/     Business logic
  alembic/        DB migration scripts
frontend/         React + Vite app
  src/
    components/   UI components
    services/     api.js — fetch wrapper with auto-logout
    store/        Zustand global state
database/         init.sql reference dump
docs/             Business proposals, API spec, sequence diagrams
```

## User preferences

- Keep existing project structure and stack — do not restructure or migrate.
