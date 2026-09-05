"""LangGraph topology for the KerjaCerdas agent.

Compatible with LangGraph >= 1.1.x (no `langgraph.prebuilt` / `create_react_agent`).

Architecture
------------
The graph is a single agent node that calls the Gemini LLM and returns the
AI text response.  Job *matching*, skill-gap analysis, and intent routing are
handled procedurally in the API router (see agent.py) before the graph runs;
the graph's sole job is to generate the natural-language `final_response`.

The node functions in nodes.py (route_intent, run_matcher, run_skill_gap,
run_advisor, compose_response) are called procedurally by the API router —
they are NOT wired as LangGraph graph nodes.

Tool calling via bind_tools() is disabled in this build because the installed
version of google-generativeai raises:

    AttributeError: 'bool' object has no attribute 'items'

when converting Pydantic v2 tool schemas (which emit `additionalProperties: false`)
to Gemini FunctionDeclaration format.

  START → agent_node → END

[Future Implementation] Migrating to a multi-node StateGraph topology where
each processing function runs as a proper LangGraph node with conditional
routing is on the technical roadmap.
"""

from __future__ import annotations

import logging

from langchain_core.messages import AIMessage, SystemMessage
from langgraph.graph import END, MessagesState
from langgraph.graph.state import CompiledStateGraph, StateGraph

from backend.app.services.llm_factory import build_chat_llm

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_llm():
    return build_chat_llm(temperature=0.4)


# ---------------------------------------------------------------------------
# Graph node
# ---------------------------------------------------------------------------


async def _agent_node(state: MessagesState) -> dict:
    """Invoke the LLM and return its response.

    Tools are intentionally NOT bound here to avoid the google-generativeai
    `additionalProperties` schema bug.  The system prompt contains descriptions
    of available capabilities so the LLM still gives contextual answers.
    """
    from backend.app.services.prompt_loader import build_system_prompt

    llm = _build_llm()

    system_prompt = build_system_prompt(role="supervisor")

    messages = list(state["messages"])
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=system_prompt)] + messages

    response: AIMessage = await llm.ainvoke(messages)
    return {"messages": [response]}


# ---------------------------------------------------------------------------
# Graph builder
# ---------------------------------------------------------------------------


def build_graph_v2(checkpointer=None) -> CompiledStateGraph:
    from backend.app.agents.memory.manager import AgentMemoryManager

    if checkpointer is None:
        mem_mgr = AgentMemoryManager(checkpointer_type="memory")
        checkpointer = mem_mgr.get_checkpointer()

    graph = StateGraph(MessagesState)
    graph.add_node("agent", _agent_node)
    graph.set_entry_point("agent")
    graph.add_edge("agent", END)

    return graph.compile(checkpointer=checkpointer)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_graph_v2: CompiledStateGraph | None = None


def get_graph() -> CompiledStateGraph:
    global _graph_v2
    if _graph_v2 is None:
        _graph_v2 = build_graph_v2()
    return _graph_v2
