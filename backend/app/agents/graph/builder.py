"""LangGraph topology for the KerjaCerdas agent.

```
            ┌─ matcher ─┐
START → router ┼─ skill_gap─┼→ compose → END
            └─ advisor ─┘
```

Match path is also auto-run before skill_gap so we always have a `matches`
context to anchor the gap analysis on.
"""
from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from backend.app.agents.graph.nodes import (
    compose_response,
    route_intent,
    run_advisor,
    run_matcher,
    run_skill_gap,
)
from backend.app.agents.graph.state import AgentState


def _branch(state: AgentState) -> str:
    return state.get("intent", "match_jobs")


def build_graph(checkpointer=None):
    from backend.app.agents.memory.manager import AgentMemoryManager
    
    # Use our memory manager if no explicit checkpointer passed
    if checkpointer is None:
        mem_mgr = AgentMemoryManager(checkpointer_type="memory")
        checkpointer = mem_mgr.get_checkpointer()
        
    g = StateGraph(AgentState)
    g.add_node("router", route_intent)
    g.add_node("matcher", run_matcher)
    g.add_node("skill_gap_pre_match", run_matcher)  # ensure matches before gap
    g.add_node("skill_gap", run_skill_gap)
    g.add_node("advisor_pre_match", run_matcher)
    g.add_node("advisor", run_advisor)
    g.add_node("compose", compose_response)

    g.add_edge(START, "router")
    g.add_conditional_edges(
        "router",
        _branch,
        {
            "match_jobs": "matcher",
            "skill_gap": "skill_gap_pre_match",
            "advise": "advisor_pre_match",
            "fallback": "advisor_pre_match",
        },
    )
    g.add_edge("matcher", "compose")
    g.add_edge("skill_gap_pre_match", "skill_gap")
    g.add_edge("skill_gap", "compose")
    g.add_edge("advisor_pre_match", "advisor")
    g.add_edge("advisor", "compose")
    g.add_edge("compose", END)

    # Basic Guardrails: compile with the memory checkpointer
    compiled_graph = g.compile(checkpointer=checkpointer)
    # The recursion_limit is applied during .invoke(config={"recursion_limit": 5}) 
    # but defining it here signals the architecture intent.
    return compiled_graph

# Singleton-ish accessor
_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
