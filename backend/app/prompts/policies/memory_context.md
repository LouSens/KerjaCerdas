# Memory & Context Management (KerjaCerdas)

Effective context management is critical to ensure the LLM agents provide accurate, personalized, and efficient responses without exceeding token limits or hallucinating past interactions. KerjaCerdas employs a multi-tiered memory architecture standard for world-class Agentic Systems.

## 1. Context Window Optimization & Clearing

LLMs have finite context windows and charge per token. The orchestrator must aggressively prune context before passing it to sub-agents.
- **System Prompt:** The foundational instructions defining the persona.
- **Active Context:** The immediate state relevant to the user's query (Profile, last 3 turns).
- **Clearing Mechanism:** Chat histories are stored ephemerally per session (Session ID). Once a session is closed or times out (30 mins), the conversation history is cleared from the `AgentState`. This prevents context window overflow (OOM) and prevents the LLM from hallucinating old topics into new queries.

## 2. Short-Term Memory (Session State)

Short-term memory manages the state of an active session using **LangGraph's StateGraph**.
- **`AgentState` Definition:** Holds temporary variables to resolve the current intent.
- **Lifecycle:** Short-term memory is ephemeral. It persists only for the duration of the current WebSocket connection or HTTP request lifecycle. Once the final response is delivered, the detailed state graph is discarded.

## 3. Long-Term Memory (RAG)

Long-term memory is persistent across sessions and relies on our database architecture.
- **Vector Database (pgvector):** Stores dense embeddings of all user CVs and Employer Job Descriptions. Used by the `MatcherNode` to retrieve top-k semantically similar jobs.
- **Structured Profiles (PostgreSQL):** Saves explicit user preferences.

## 4. Role-Based Access Control (RBAC) & Data Isolation

To prevent cross-user data leakage, the Agent strictly enforces RBAC at the data retrieval layer before context injection:
- **Seeker Agents:** Can ONLY retrieve data belonging to `user_id == current_user`. They can query public job postings but CANNOT query other candidates' profiles.
- **Employer Agents:** Can ONLY retrieve resumes of candidates who have explicitly applied to their company, or aggregated anonymous statistics.
- **Context Isolation:** The LangGraph `StateGraph` is instantiated *per request* with the authenticated `user_id`. There is no shared memory pool between agents serving different users.

## 5. Context Injection Flow

When a user messages the Career Advisor:
1.  **Retrieve:** Fetch User Profile from DB (RBAC enforced).
2.  **Retrieve:** Fetch User's Top 5 Matches from the matching engine.
3.  **Retrieve:** Fetch User's identified Skill Gaps.
4.  **Inject:** Construct a localized prompt combining System Prompt + User Profile Summary + Match Context + User Message.
5.  **Generate:** Pass the optimized prompt to Gemini 3.0 Flash.
