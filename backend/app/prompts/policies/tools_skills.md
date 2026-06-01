# Agent Tools & Skills Guidelines (KerjaCerdas)

This document outlines the standard operating procedures and architectural guidelines for integrating external tools, APIs, and custom skills into the KerjaCerdas Agentic Ecosystem. It follows industry best practices for LLM agent development (e.g., LangChain/LangGraph paradigms).

## 1. Tool Design Philosophy

Every tool exposed to the Agent (Gemini 3.0 Flash) must adhere to the following principles:

*   **Single Responsibility:** A tool must do exactly one thing well (e.g., `search_job_listings`, `calculate_skill_gap`). Do not create monolithic tools.
*   **Typed Schemas:** All tool inputs and outputs must be strongly typed using Pydantic models. This ensures the LLM receives clear schema definitions (JSON Schema) and reduces hallucination during tool invocation.
*   **Idempotency (Where Possible):** Read tools (e.g., fetching a profile) must be idempotent. Write tools (e.g., saving a bookmark) must handle duplicate requests gracefully (e.g., return existing status instead of throwing a 500 error).
*   **Fail Gracefully:** If an external API (e.g., Gemini Embeddings, JobStreet API) is down, the tool must catch the exception and return a structured error string to the Agent (e.g., `{"error": "API timeout, please use fallback data"}`). The Agent must be instructed on how to recover from these errors.

## 2. Core Agent Skills

The KerjaCerdas orchestrator distributes tasks to specialized sub-agents based on the user's intent. The following core skills are currently implemented:

### A. Semantic Job Matching (`matcher.py`)
*   **Mechanism:** Uses Gemini Embeddings (3072-dim) to map user resumes and job descriptions into a vector space.
*   **Tools Used:** `embed_text()`, `pgvector_similarity_search()`.
*   **Execution:** Computes cosine similarity, applies metadata weights (region, salary expectation), and returns the top 5 matches.

### B. Skill Gap Analysis (`skill_gap_agent.py`)
*   **Mechanism:** Compares the user's extracted skills against the required skills of target jobs and broader industry trends.
*   **Tools Used:** `extract_skills_from_cv()`, `query_market_trends()`.
*   **Execution:** Outputs a structured JSON containing matching skills, missing skills, and recommended courses to bridge the gap.

### C. Career Advising (`advisor_agent.py`)
*   **Mechanism:** A conversational agent that provides personalized career advice, interview tips, and salary negotiation strategies.
*   **Tools Used:** `fetch_user_profile()`, `fetch_latest_matches()`.
*   **Execution:** Uses RAG (Retrieval-Augmented Generation) to ground its advice in the user's actual data rather than generic LLM knowledge.

## 3. Tool Registration & Security

*   **Explicit Registration:** Tools must be explicitly bound to the specific LangGraph node that requires them. Do not give the Orchestrator access to low-level database write tools.
*   **Sandboxing:** Agents cannot execute arbitrary Python code or shell commands in production. All tool logic is pre-compiled and vetted.
*   **Rate Limiting:** Every tool call that hits a paid API (like Gemini) must be wrapped in a rate-limiter and circuit breaker to prevent quota exhaustion loops caused by hallucinating agents.

## 4. Fallback Mechanics

If `GEMINI_API_KEY` is missing or the service is down:
*   The system falls back to regex-based intent routing (`_MATCH_RE`, `_GAP_RE`).
*   The embedding system falls back to a deterministic `HashEmbedder`.
*   The UI gracefully informs the user that they are in "Offline Mode" and provides cached/demo results.
