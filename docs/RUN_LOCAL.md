# Run KerjaCerdas locally (Windows + PowerShell)

The whole stack runs with **two terminal windows** — one for the backend
(Python/FastAPI), one for the frontend (Vite). No Docker required for
development.

## 0. One-time setup

```powershell
# Activate the conda env
conda activate jobmatching

# Install/refresh backend deps (run once after any pyproject.toml change)
pip install -e ".[dev]"

# (optional) Add your Gemini key for real LLM + PDF parsing
Copy-Item .env.example .env -ErrorAction SilentlyContinue
notepad .env   # set GEMINI_API_KEY=...

# Frontend deps
cd frontend
npm install
cd ..
```

## 1. Terminal A — Backend (FastAPI)

The most reliable command is the Python module form (it can't be misspelled
and works regardless of PATH state):

```powershell
conda activate jobmatching
python -m backend.app
```

Equivalent uvicorn forms (also work — pick one):

```powershell
python -m uvicorn backend.app.api.main:app --reload
# or, if uvicorn.exe is on PATH:
uvicorn backend.app.api.main:app --reload
```

Expected output:

```
INFO Uvicorn running on http://127.0.0.1:8000
INFO KerjaCerdas API starting up
```

Sanity checks:
- http://127.0.0.1:8000/health → `{"status":"healthy", ...}`
- http://127.0.0.1:8000/docs → interactive Swagger UI

## 2. Terminal B — Frontend (Vite)

```powershell
cd frontend
npm run dev
```

Then open **http://localhost:3000**.

The Vite proxy in `frontend/vite.config.js` forwards `/api/*` and `/health`
to `http://127.0.0.1:8000`, so the browser hits the FastAPI backend without
CORS hassle.

## 3. Seed demo data (optional but recommended)

In a third terminal (or after stopping the backend):

```powershell
conda activate jobmatching
python -m scripts.seed_json
```

This writes a demo employer, 3 job postings, and 1 seeker profile under
`data/`, each with Gemini (or hash-fallback) embeddings.

## 4. Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: backend` | Running from wrong cwd. | `cd C:\Users\David\KerjaCerdas` first. |
| `Error loading ASGI app. Could not import module "src.api.main"` | Old uvicorn command. | Use `python -m backend.app`. |
| Frontend shows "API offline" | Backend not running on :8000. | Start Terminal A first. |
| CV upload returns offline stub | No `GEMINI_API_KEY`. | Set it in `.env` and restart backend. |
| Vite can't bind :3000 | Port in use. | `npm run dev -- --port 5174`. |

## 5. Test logins

After running `python -m scripts.seed_json`, you can register fresh via the
UI, or just sign in with any email — the dev-mode `login()` accepts any
credentials and routes you to the right dashboard:

- `andi@example.com` → **seeker** dashboard
- `hr@bankmandiri.id` → choose **employer** at register time
- `admin@kerjacerdas.id` → automatically routed to **admin** cockpit
