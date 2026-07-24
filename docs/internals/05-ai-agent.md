# AI Agent (LangGraph)

Files:
- `backend/app/agents/graph/{builder,nodes,state}.py` — graph assembly
- `backend/app/agents/tools/superpowers.py`, `tools/search.py` — agent tools
- `backend/app/agents/memory/manager.py` — checkpointing / long-term memory
- `backend/app/agents/telemetry/tracker.py` — token budget enforcement
- `backend/app/api/routers/agent.py` — `POST /api/v1/agent/invoke` entry point
- `backend/app/services/prompt_loader.py` + `backend/app/prompts/**` — prompt assembly

## Architecture

**V2 (current): autonomous ReAct swarm.** Built with LangGraph's `create_react_agent`; a **supervisor** (persona in `prompts/roles/supervisor.md`) reasons about the user's message and decides per turn: call a tool, call several, or answer directly.

**V1 (legacy, still in `nodes.py` for reference): fixed pipeline** — `router → matcher → skill_gap → advisor → compose`, where the router classified intent into `match_jobs` / `skill_gap` / `advise`. V2 replaced the rigid sequence with the tool-calling loop.

**State** (`state.py` — `AgentState`): append-only message history (`add_messages` reducer), plus seeker profile, current job matches, skill gaps, and recommended courses. State is the contract between turns.

## Tools (`SUPERPOWER_TOOLS`)

| Tool | Function |
|---|---|
| `search_jobs_tool` | keyword + location job search against the DB |
| `analyze_skill_gap_tool` | seeker skills vs job requirements → structured gap JSON + free learning resources (YouTube, W3Schools) |
| `interview_prep_tool` | mock interview questions for a given job title |
| `resume_review_tool` | ATS-style critique of resume text (missing metrics, structure) |
| `search_job_market_trends` | stub for macro trend analysis |

## Model & Prompt Assembly

- **Chat model:** `settings.gemini_chat_model` → `gemini-3.1-flash-lite` (chosen for cost — the agent is high-frequency, low-stakes-per-token).
- Prompt is assembled by `prompt_loader.py` from layered markdown files:
  - `SUPERPOWER.md` — role & mission
  - `policies/guardrails.md` — safety, PII, bias rules
  - `roles/supervisor.md` — ReAct loop instructions
  - `policies/tools_skills.md`, `compliance.md`, `memory_context.md`
- Prompts use **XML-style tags** (`<rule>`, `<user_input>`) so untrusted user text is fenced from instructions — the counterpart to the request-side prompt-injection regex in `02-authentication.md`.

## Memory

- **Short-term:** LangGraph checkpointer — `MemorySaver` (in-process) for dev; architected for `AsyncPostgresSaver` in production. Threads keyed by `thread_id = seeker_id`, so conversation state is per-user and survives across turns.
- **Long-term:** pgvector-backed semantic memory — CV/job embeddings double as RAG context across sessions.
- **Isolation:** thread separation + RBAC at the DB layer; one seeker's context can't leak into another's session.

## Cost & Safety Guardrails (the interesting part)

1. **Token budget** (`telemetry/tracker.py`): hard cap ≈ **50k tokens** per invocation — a runaway ReAct loop gets cut, protecting billing.
2. **Token efficiency gate** (`routers/agent.py`): matches are ranked *before* the LLM is called; if `max_score < 0.10` the LLM is skipped entirely and a cheap templated reply is returned. Embedding + in-memory ranking is orders of magnitude cheaper than a chat completion.
3. **Hallucination guard:** job IDs in LLM output are validated against real matches; invented IDs are stripped so the UI can never render a job card that links nowhere.
4. **Jobs cache:** repository fetch cached 300 s — the agent doesn't hammer the DB across turns.
5. **Observability:** per-invocation structured logs of latency, intent, and band distribution of served matches.

## Request Lifecycle

```
POST /api/v1/agent/invoke  (JWT: seeker)
  → load seeker profile + jobs (cache 300s)
  → SemanticMatcher ranks jobs             ← see 01-matching-algorithm.md
  → max_score < 0.10 ?  → templated reply, no LLM  ✂
  → else: supervisor loop (Gemini) with tools, token budget enforced
  → strip hallucinated job IDs
  → response: message + job cards (banded) + optional courses
```
