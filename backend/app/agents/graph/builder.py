"""LangGraph topology for the KerjaCerdas agent (V2 Autonomous Swarm).

This replaces the static router with a true Autonomous Multi-Agent Swarm (ReAct)
powered by Gemini. It can call tools in parallel and reason about complex tasks.
"""

from __future__ import annotations

import os

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph.graph import CompiledGraph
from langgraph.prebuilt import create_react_agent

from backend.app.agents.tools.superpowers import SUPERPOWER_TOOLS
from backend.app.config.settings import settings


def build_graph_v2(checkpointer=None):
    from backend.app.agents.memory.manager import AgentMemoryManager

    if checkpointer is None:
        mem_mgr = AgentMemoryManager(checkpointer_type="memory")
        checkpointer = mem_mgr.get_checkpointer()

    gemini_key = (
        settings.gemini_api_key
        or os.environ.get("GEMINI_API_KEY", "")
        or os.environ.get("GOOGLE_API_KEY", "")
    )

    # ChatGoogleGenerativeAI won't read settings.gemini_api_key on its own —
    # pass the resolved key explicitly (mirrors the matcher fix).
    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_chat_model,
        temperature=0.4,
        api_key=gemini_key,
    )

    from backend.app.services.prompt_loader import build_system_prompt

    system_prompt = build_system_prompt(role="supervisor")

    # create_react_agent natively builds a robust ReAct loop with tool calling.
    # `state_modifier` was renamed to `prompt` in langgraph >= 1.x.
    compiled_graph = create_react_agent(
        model=llm, tools=SUPERPOWER_TOOLS, prompt=system_prompt, checkpointer=checkpointer
    )

    return compiled_graph


_graph_v2 = None


def get_graph() -> CompiledGraph:
    global _graph_v2
    if _graph_v2 is None:
        _graph_v2 = build_graph_v2()
    return _graph_v2
