"""Telemetry, observability, and cost tracking for the LLM agents.

Integrates with LangSmith via environment variables (LANGCHAIN_TRACING_V2)
and provides custom token limit enforcement to prevent infinite loop billing spikes.
"""
import logging

logger = logging.getLogger(__name__)

def check_token_limits(session_id: str, tokens_used: int, max_budget: int = 50000) -> bool:
    """Checks if a user session has exceeded their token budget limit.

    This acts as a secondary guardrail against infinite LLM looping.
    """
    if tokens_used > max_budget:
        logger.warning("Token limit exceeded for session %s (Used: %d, Limit: %d)",
                       session_id, tokens_used, max_budget)
        return False
    return True
