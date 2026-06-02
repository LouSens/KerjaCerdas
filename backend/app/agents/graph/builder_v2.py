"""LangGraph topology for the KerjaCerdas agent (V2 Autonomous Swarm).

This replaces the static router with a true Autonomous Multi-Agent Swarm (ReAct)
powered by Gemini. It can call tools in parallel and reason about complex tasks.
"""
from __future__ import annotations

import os

from langchain_google_genai import ChatGoogleGenerativeAI
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
    
    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_chat_model,
        temperature=0.4,
    )

    system_prompt = """Kamu adalah AI Supervisor (Otak Utama) untuk platform job matching KerjaCerdas.
Tugas utamamu adalah membantu kandidat mendapatkan pekerjaan atau meningkatkan skill mereka.
Kamu dibekali dengan berbagai Alat (Tools):
- search_jobs_tool: Gunakan saat kandidat minta dicarikan lowongan kerja spesifik.
- analyze_skill_gap_tool: Gunakan saat kandidat ingin tahu apa yang kurang dari skill mereka.
- interview_prep_tool: Gunakan saat kandidat minta latihan wawancara.
- resume_review_tool: Gunakan saat kandidat minta CV/profilnya dikritik.

Kamu bisa dan BOLEH menggunakan beberapa alat secara PARALEL jika diperlukan!
(Contoh: Jika user minta cari loker sekaligus analisa CV-nya, panggil search_jobs_tool dan resume_review_tool bersamaan).

Selalu jawab dalam bahasa Indonesia yang ramah, suportif, dan memotivasi. 
Gunakan format Markdown (bullet points, bold) agar mudah dibaca.
"""

    # create_react_agent natively builds a robust ReAct loop with tool calling
    compiled_graph = create_react_agent(
        model=llm,
        tools=SUPERPOWER_TOOLS,
        state_modifier=system_prompt,
        checkpointer=checkpointer
    )
    
    return compiled_graph

_graph_v2 = None

def get_graph_v2():
    global _graph_v2
    if _graph_v2 is None:
        _graph_v2 = build_graph_v2()
    return _graph_v2
