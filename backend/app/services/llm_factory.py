"""Shared factory for Gemini chat LLMs with a rate-limit fallback chain.

Free-tier Gemini keys are throttled per model (RPM). Instead of stalling on
long SDK retries against one model, we build a LangChain fallback chain:

    gemini-3.1-flash-lite (15 RPM)  — primary
    gemini-3.5-flash-lite (15 RPM)  — first fallback
    gemini-3.6-flash      (5 RPM)   — last resort

Each model gets at most ONE quick SDK retry (max_retries=1) so a 429 fails
over to the next model in seconds rather than blocking for 30s+ of backoff.

Every chat call site should use `build_chat_llm()` instead of constructing
ChatGoogleGenerativeAI directly, so the chain (and API-key resolution) stays
consistent app-wide.
"""

from __future__ import annotations

import logging
import os

from langchain_core.runnables import Runnable
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.app.config.settings import settings

logger = logging.getLogger(__name__)


def resolve_gemini_key() -> str:
    """ChatGoogleGenerativeAI only reads env vars / explicit api_key — resolve like the embedder."""
    return (
        settings.gemini_api_key
        or os.environ.get("GEMINI_API_KEY", "")
        or os.environ.get("GOOGLE_API_KEY", "")
    )


def chat_model_chain() -> list[str]:
    """Primary model followed by fallbacks, de-duplicated, order preserved."""
    seen: set[str] = set()
    chain: list[str] = []
    for m in [settings.gemini_chat_model, *settings.gemini_chat_fallback_models]:
        if m and m not in seen:
            seen.add(m)
            chain.append(m)
    return chain


def build_chat_llm(temperature: float = 0.4, **kwargs) -> Runnable:
    """Build a chat LLM that fails over across the model chain on errors (e.g. 429).

    Returns a Runnable supporting .invoke/.ainvoke with the same message
    interface as ChatGoogleGenerativeAI.
    """
    api_key = resolve_gemini_key()
    llms = [
        ChatGoogleGenerativeAI(
            model=m,
            temperature=temperature,
            api_key=api_key or None,
            max_retries=1,  # fail over fast instead of long same-model backoff
            timeout=30,
            **kwargs,
        )
        for m in chat_model_chain()
    ]
    if len(llms) == 1:
        return llms[0]
    return llms[0].with_fallbacks(llms[1:])
