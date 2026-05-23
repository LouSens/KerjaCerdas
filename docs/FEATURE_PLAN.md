# KerjaCerdas — Initial Feature Plan (Feasible, Frontend-First)

This is the bridge between the **frontend that already exists** and the new
**LangGraph + Gemini embedding** backend. Each feature below is mapped to a
concrete React component in `frontend/src/components/` so we ship vertical
slices rather than detached infra.

## Architecture in one picture

```
[ React (Vite + Tailwind) ]
   │
   ▼  HTTPS / JSON
[ FastAPI  /api/v1 ]
   ├── /agent/invoke   ──► LangGraph (router → matcher | skill_gap | advisor → compose)
   ├── /match          ──► SemanticMatcher (Gemini embed + k-rank rerank)
   ├── /skill-gap      ──► same matcher + course catalog
   ├── /advisor        ──► LangChain ↔ Gemini Flash
   ├── /jobs           ──► JsonRepository(JobPosting)
   └── /verify/*       ──► Mock e-KYC / SIVIL (already shipped)
                  │
                  ▼
        [ JSON file store today  →  Supabase (Postgres + pgvector) tomorrow ]
                                          │
                                          └─ Gemini text-embedding-004 (768-d)
```

## Feature ↔ Frontend mapping

| # | Feature | Frontend component(s) | New backend surface | Status |
|---|---|---|---|---|
| F1 | **Semantic job matching (k-rank)** | `SearchForm.jsx`, `JobCard.jsx`, `DashboardPage.jsx` | `POST /api/v1/agent/invoke` with `intent=match_jobs` | Backend ready; need frontend `services/api.js` call to `/agent/invoke` |
| F2 | **Skill-gap analysis with course suggestions** | `SkillGapPanel.jsx` | LangGraph node `run_skill_gap` exposed via `/agent/invoke` | Backend ready |
| F3 | **Gemini-powered career advisor (chat memory)** | `AdvisorChat.jsx` | `/agent/invoke` with `session_id` → MemorySaver persists thread | Backend ready |
| F4 | **Saved jobs + apply** | `SavedJobsPage.jsx` | `Application` schema + `seeker.py` router (already partly there) | Wire to `Application` repo |
| F5 | **Employer post + auto-embedding** | `EmployerDashboard.jsx` | Hook `matcher.embed_job` into `POST /api/v1/jobs` (employer router) | Add 1 line in employer router |
| F6 | **Reverse matching — top candidates per job** | `EmployerDashboard.jsx` (new tab) | New LangGraph branch / `match_seeker_profiles` RPC | Add later; pgvector RPC drafted in migrations |
| F7 | **e-KYC + diploma verification** | `VerificationDashboard.jsx` | `/verify/identity`, `/verify/education` | Shipped (mock) |
| F8 | **Auth (seeker/employer)** | `AuthModal.jsx` | `/auth/register`, `/auth/login` (JWT) | Shipped |

## Why this scope is feasible for the hackathon

- The **hot path** (F1–F3) is just 3 nodes in one LangGraph + 1 embedder.
  No GPU, no training — Gemini API does the heavy lifting.
- **JSON store now, Supabase later**: the `JsonRepository` and
  `SupabaseRepository` expose the same interface. Migration day = change one
  factory function + run `0001_init.sql`.
- **Embedding dim is fixed at 768** (text-embedding-004), matching the
  pgvector column type in the SQL migration — no schema drift later.
- **LangGraph checkpointer = `MemorySaver`** for the demo. Swap to
  Postgres-backed checkpointer for prod with no code change to nodes.

## What's deliberately not in scope

- Local IndoBERT training / MLflow tracking (kept under `ml-heavy` extras).
- Cross-encoder reranker (the structured rerank inside `SemanticMatcher`
  is a fair stand-in for the demo).
- Production RLS policies (the SQL migration enables `pgvector` but does not
  yet apply `auth.uid()` policies).

## Calling the new agent from the existing frontend

```js
// frontend/src/services/api.js
export async function invokeAgent({ message, seekerId, targetJobId, sessionId }) {
  const r = await fetch(`${API}/api/v1/agent/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_message: message,
      seeker_id: seekerId,
      target_job_id: targetJobId,
      session_id: sessionId,
    }),
  });
  return r.json();
}
```

`AdvisorChat`, `SkillGapPanel`, and `DashboardPage` can all share this one
client function — the routed `intent` field in the response tells the UI
which sub-pane to render.
