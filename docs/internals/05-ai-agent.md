# AI Agent (LangGraph)

Files:
- `backend/app/agents/graph/{builder,nodes}.py` — graph assembly. There is **no `state.py`** — the graph uses LangGraph's built-in `MessagesState`, not a custom state class (see State, below).
- `backend/app/agents/tools/superpowers.py`, `tools/search.py` — agent tools
- `backend/app/agents/memory/manager.py` — checkpointing (no long-term memory store)
- `backend/app/agents/telemetry/tracker.py` — a token-budget check function that exists but is **not called anywhere** in the codebase
- `backend/app/api/routers/agent.py` — `POST /api/v1/agent/invoke` entry point
- `backend/app/api/routers/seeker.py` — `POST /api/v1/seeker/skill-gap`, the actual skill-gap entry point (see below and `09-courses-skill-gap.md`)
- `backend/app/services/prompt_loader.py` + `backend/app/prompts/**` — prompt assembly

## Architecture

`backend/app/agents/graph/builder.py`'s docstring notes the installed `langgraph` version (>=1.1.x) has no `langgraph.prebuilt`/`create_react_agent`, and that `bind_tools()` tool-calling is explicitly disabled in this build because it hits an `AttributeError` converting Pydantic v2 tool schemas for Gemini. `create_react_agent` does not appear anywhere in `backend/app`. This is not a ReAct or tool-calling agent.

**What is actually built:** `backend/app/api/routers/agent.py` reimplements matching, routing and response composition **inline** — it calls `SemanticMatcher.rank_jobs_for_seeker()` directly, hardcodes the response `intent` (`"job_search"` on the token-gate early exit, otherwise a bare `"match_jobs"` default since nothing in the graph output ever sets an `intent` key), and only invokes the LangGraph graph to produce the natural-language `final_response` text. `nodes.py`'s own docstring is explicit about this: it once held a full set of node functions (`route_intent`, `run_matcher`, `run_skill_gap`, `run_advisor`, `compose_response`) for a multi-node pipeline that was **never wired into the graph** — those functions have since been removed as dead code. The only thing left in `nodes.py` is `_recommend_courses()` (plus its DB-store and hardcoded-catalog fallbacks), which is called directly from `backend/app/api/routers/seeker.py`'s `POST /skill-gap` endpoint — not from `agent.py`, and not through the graph. See [`ARCHITECTURE.md`](../ARCHITECTURE.md) for the full system view and `09-courses-skill-gap.md` for the skill-gap endpoint itself.

The LangGraph graph itself is one node: `START → agent_node → END` (`builder.py`), whose sole job is to call Gemini and return natural-language text for whatever `agent.py`'s inline logic already decided.

**Table below (`SUPERPOWER_TOOLS`) describes tool functions that exist in source (`superpowers.py`) but are not currently bound to or callable by the LLM**, since tool-calling is disabled — nothing in the codebase imports `SUPERPOWER_TOOLS` outside its own module. Treat this as a roadmap capability, not a built one, until `bind_tools()` is re-enabled and verified end-to-end.

**State:** the graph is built on LangGraph's stock `MessagesState` (`langgraph.graph.MessagesState`) — an append-only `messages` list with the default `add_messages` reducer. There is no custom `AgentState` carrying seeker profile, matches, skill gaps or courses as first-class graph state; those values are computed by `agent.py` before/after the graph call and passed through the response model instead.

## Tools (`SUPERPOWER_TOOLS`) — defined in source, not currently wired to the LLM

| Tool | Function |
|---|---|
| `search_jobs_tool` | keyword + location job search against the DB |
| `analyze_skill_gap_tool` | seeker skills vs job requirements → structured gap JSON + free learning resources (YouTube, W3Schools) |
| `interview_prep_tool` | mock interview questions for a given job title |
| `resume_review_tool` | ATS-style critique of resume text (missing metrics, structure) |
| `search_job_market_trends` | stub for macro trend analysis |

## Model & Prompt Assembly

- **Chat model:** `settings.gemini_chat_model` → `gemini-3.1-flash-lite` (chosen for cost — the agent is high-frequency, low-stakes-per-token), with `settings.gemini_chat_fallback_models` (`gemini-3.5-flash-lite`, then `gemini-3.6-flash`) as a rate-limit fallback chain used by `llm_factory.py`/`pdf_parser.py`.
- Prompt is assembled by `prompt_loader.py` from layered markdown files:
  - `SUPERPOWER.md` — role & mission
  - `policies/guardrails.md` — safety, PII, bias rules
  - `roles/supervisor.md` — persona/instruction prompt (written for a tool-calling loop; currently consumed by the single-node `agent_node`, which does not call tools — see Architecture above)
  - `policies/tools_skills.md`, `compliance.md`, `memory_context.md`
- Prompts use **XML-style tags** (`<rule>`, `<user_input>`) so untrusted user text is fenced from instructions — the counterpart to the request-side prompt-injection regex in `02-authentication.md`.

## Memory

- **Short-term:** LangGraph checkpointer — `AgentMemoryManager.get_checkpointer()` returns an in-process `MemorySaver` for the `"memory"` mode it defaults to; a `"postgres"` mode exists in the same function but currently just logs and immediately `raise NotImplementedError` (`AsyncPostgresSaver` is commented out, not wired), so there is no working Postgres-backed checkpointer today. Threads are keyed by `thread_id = f"{current_user_id}:{sha256(session_id or seeker_id)[:32]}"` (computed in `agent.py`, not just the bare `seeker_id`) — namespacing by the authenticated user prevents two different callers who happen to pass the same client-supplied `session_id` from sharing one conversation buffer.
- **Long-term:** there is no separate long-term/RAG memory store for the agent. The prompt policy docs (`prompts/policies/memory_context.md`, `tools_skills.md`) describe an aspirational "Long-Term Memory (RAG)" grounded in pgvector, but the only pgvector-backed embeddings in the codebase are the job/seeker *matching* vectors (`01-matching-algorithm.md`) — those feed job recommendations into the LLM's context per-turn, not a session-spanning semantic memory retrieval mechanism.
- **Isolation:** thread separation (namespaced by user id, above) + RBAC at the DB layer; one seeker's context can't leak into another's session.

## Cost & Safety Guardrails (the interesting part)

1. **Token budget function exists but is unwired.** `telemetry/tracker.py`'s `check_token_limits()` (hard cap 50k tokens by default) is not called from anywhere in the codebase — grepping for its name only finds its own definition. Treat it as a designed-but-not-yet-integrated guardrail, not an enforced one.
2. **Token efficiency gate** (`routers/agent.py`): matches are ranked *before* the LLM is called; if `max_score < 0.10` the LLM is skipped entirely and a cheap templated reply is returned. Embedding + in-memory ranking is orders of magnitude cheaper than a chat completion.
3. **Hallucination guard:** job IDs in the enriched match list are validated against the jobs actually loaded for this request (`valid_job_ids`); any that don't match are stripped and counted in `hallucinated_ids_removed`, so the UI can never render a job card that links nowhere.
4. **Jobs cache:** the shared `jobs.py` repository fetch is cached 300 s (`_JOBS_CACHE_TTL`, invalidated on job create/update) — the agent doesn't hammer the DB across turns.
5. **Graceful LLM degradation:** `LLMBusyError`, `GraphRecursionError`, and a `RuntimeError` for missing Gemini auth are each caught around the graph call and turned into a deterministic templated reply alongside the already-computed matches, instead of a 500.
6. **Observability:** per-invocation structured logs of latency, intent, and band distribution of served matches.

## Request Lifecycle

```
POST /api/v1/agent/invoke  (JWT: any authenticated user; resolves/falls back to a seeker profile)
  → resolve seeker (owned profile → inline seeker → anonymous stub, never a 400)
  → SemanticMatcher.rank_jobs_for_seeker()  ← see 01-matching-algorithm.md
  → load only the matched jobs (cache 300s, see jobs.py)
  → max_score < 0.10 ?  → templated reply, no LLM call at all  ✂
  → else: single-node LangGraph call to Gemini (no tool-calling; token budget NOT enforced — see above)
  → enrich matches with job metadata, strip hallucinated job IDs
  → response: message + job cards (banded) — no courses (skill-gap is a separate endpoint, see 09-courses-skill-gap.md)
```
