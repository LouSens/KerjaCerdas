# KerjaCerdas

AI-powered job matching platform for Indonesia. Semantic CV matching, skill-gap analysis, and employer candidate shortlisting — all backed by Google Gemini and a single-node LangGraph response layer.

## Stack

- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL (pgvector) — port 8000
- **Frontend**: React 18 + Vite + TailwindCSS — port 5000 (webview)
- **AI**: Google Gemini embeddings + chat; one LangGraph node (`START → agent_node → END`) for response synthesis. Matching/skill-gap/routing run as procedural Python, not as graph nodes. Tool-calling is disabled (library incompatibility) — not a ReAct agent. See `docs/ARCHITECTURE.md`.

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
docs/             Architecture, product docs, API spec, sequence diagrams
```

## Linting & Git Hook

Ruff is used for linting and formatting. A pre-commit hook lives in `scripts/hooks/pre-commit` and blocks commits that fail `ruff check` or `ruff format --check`.

To activate the hook in a fresh clone:
```bash
git config core.hooksPath scripts/hooks
```

To auto-fix before committing:
```bash
ruff check --fix backend/app/ && ruff format backend/app/
```

## User preferences

- Keep existing project structure and stack — do not restructure or migrate.
- Always run `ruff check backend/app/` and `ruff format --check backend/app/` before committing. The pre-commit hook enforces this automatically.
