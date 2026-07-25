"""LangGraph topology for the KerjaCerdas agent (V2 Autonomous Swarm).

Compatible with LangGraph >= 1.1.x (no `langgraph.prebuilt` / `create_react_agent`).

Architecture
------------
The graph is intentionally simple: one agent node that calls the Gemini LLM
and returns the AI text response.  Job *matching* is handled by SemanticMatcher
before the graph runs (see agent.py); the graph's sole job is to generate the
natural-language `final_response`.

Tool calling via bind_tools() is disabled in this build because the installed
version of google-generativeai raises:

    AttributeError: 'bool' object has no attribute 'items'

when converting Pydantic v2 tool schemas (which emit `additionalProperties: false`)
to Gemini FunctionDeclaration format.  The fix is to invoke the LLM without
tool-binding; tool logic is described in the system prompt instead.

  START → agent_node → END
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
