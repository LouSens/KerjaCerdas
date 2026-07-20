"""External tools available to the LangGraph agents.

Tools defined here can be bound to the LLM for function calling (Tool Usage).
"""

from langchain_core.tools import tool


@tool
def search_job_market_trends(query: str) -> str:
    """Search macro job market trends from BPS / external APIs.

    Args:
        query: The job title or skill to search trends for.
    """
    # Stub for future implementation
    return f"Simulated trend data for: {query}. Demand is currently rising by 15% YoY."
