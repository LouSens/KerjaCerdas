"""Memory management wrapper for LangGraph Checkpointers and Vector DB integration.

This module provides an abstraction over Short-term (Conversation buffer via LangGraph PostgresSaver)
and Long-term memory (Semantic search via pgvector).
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AgentMemoryManager:
    """Handles persistence of agent state."""
    
    def __init__(self, checkpointer_type: str = "memory"):
        self.checkpointer_type = checkpointer_type
        
    def get_checkpointer(self):
        """Returns the appropriate LangGraph checkpointer based on config.
        
        MVP uses MemorySaver. Production uses AsyncPostgresSaver to persist
        state across distributed server restarts.
        """
        if self.checkpointer_type == "postgres":
            # Deferred import to prevent breaking MVP if asyncpg is not installed
            # from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
            logger.info("Using AsyncPostgresSaver for persistent state management.")
            raise NotImplementedError("PostgresSaver requires connection pool config in production.")
        else:
            from langgraph.checkpoint.memory import MemorySaver
            logger.info("Using in-memory MemorySaver for demo environment.")
            return MemorySaver()
