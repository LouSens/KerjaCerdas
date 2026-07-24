"""LangGraph topology for the KerjaCerdas agent (V2 Autonomous Swarm).

Compatible with LangGraph >= 1.1.x (no `langgraph.prebuilt` / `create_react_agent`).
Builds a hand-rolled ReAct loop:

  START → agent_node → (tool_node | END)
                  ↑_________|

The agent node calls the LLM which may request tool calls.
The tool node executes them and the loop repeats until the LLM
produces a final message with no more tool calls.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Literal

from langchain_core.messages import AIMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, MessagesState
from langgraph.graph.state import CompiledStateGraph, StateGraph

from backend.app.agents.tools.superpowers import SUPERPOWER_TOOLS
from backend.app.config.settings import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_gemini_key() -> str:
    return (
        settings.gemini_api_key
        or os.environ.get("GEMINI_API_KEY", "")
        or os.environ.get("GOOGLE_API_KEY", "")
    )


def _build_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=settings.gemini_chat_model,
        temperature=0.4,
        api_key=_resolve_gemini_key(),
    )


# Build a dict of {tool_name: tool_fn} for fast dispatch
_TOOL_MAP = {t.name: t for t in SUPERPOWER_TOOLS}


# ---------------------------------------------------------------------------
# Graph node implementations
# ---------------------------------------------------------------------------


async def _agent_node(state: MessagesState) -> dict:
    """Invoke the LLM with the current message history."""
    from backend.app.services.prompt_loader import build_system_prompt

    llm = _build_llm()
    llm_with_tools = llm.bind_tools(SUPERPOWER_TOOLS)

    system_prompt = build_system_prompt(role="supervisor")

    # Prepend system message if not already present
    messages = list(state["messages"])
    from langchain_core.messages import SystemMessage

    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=system_prompt)] + messages

    response: AIMessage = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}


async def _tool_node(state: MessagesState) -> dict:
    """Execute any tool calls requested by the last AI message."""
    last_message: AIMessage = state["messages"][-1]
    tool_results: list[ToolMessage] = []

    for call in last_message.tool_calls:
        tool_name = call["name"]
        tool_args = call["args"]
        call_id = call["id"]

        tool_fn = _TOOL_MAP.get(tool_name)
        if tool_fn is None:
            result_content = json.dumps({"error": f"Unknown tool: {tool_name}"})
        else:
            try:
                # All superpower tools are async
                result = await tool_fn.ainvoke(tool_args)
                result_content = result if isinstance(result, str) else json.dumps(result)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Tool '%s' raised an exception", tool_name)
                result_content = json.dumps({"error": str(exc)})

        tool_results.append(ToolMessage(content=result_content, tool_call_id=call_id))

    return {"messages": tool_results}


def _should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
    """Route back to tool execution if the LLM requested any tool calls."""
    last: AIMessage = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "__end__"


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
    graph.add_node("tools", _tool_node)

    graph.set_entry_point("agent")

    graph.add_conditional_edges(
        "agent",
        _should_continue,
        {"tools": "tools", "__end__": END},
    )
    graph.add_edge("tools", "agent")

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
