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
import time

from langchain_core.runnables import Runnable, RunnableLambda
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.app.config.settings import settings

logger = logging.getLogger(__name__)


class LLMBusyError(RuntimeError):
    """All chat models are unavailable (throttled/failing); callers should degrade gracefully."""


# --- Circuit breaker -------------------------------------------------------
# When the whole fallback chain fails, hitting every model again on the very
# next request only burns more RPM. Trip a short breaker so subsequent calls
# fail fast (LLMBusyError) without any network calls until the cooldown ends.
_BREAKER_COOLDOWN_S = 30.0
_breaker_open_until = 0.0


def _breaker_remaining() -> float:
    return _breaker_open_until - time.monotonic()


def _trip_breaker() -> None:
    global _breaker_open_until
    _breaker_open_until = time.monotonic() + _BREAKER_COOLDOWN_S
    logger.warning("LLM circuit breaker tripped — failing fast for %.0fs", _BREAKER_COOLDOWN_S)


def reset_breaker() -> None:
    """Test hook / manual reset."""
    global _breaker_open_until
    _breaker_open_until = 0.0


def _is_availability_error(exc: BaseException) -> bool:
    """True for throttling / transient provider outages (429, 5xx, timeouts)."""
    seen: set[int] = set()
    cur: BaseException | None = exc
    while cur is not None and id(cur) not in seen:
        seen.add(id(cur))
        text = str(cur).lower()
        if any(
            marker in text
            for marker in (
                "429",
                "resource_exhausted",
                "quota",
                "rate limit",
                "503",
                "unavailable",
                "500",
                "internal",
                "timeout",
                "timed out",
                "deadline",
                "connection",
            )
        ):
            return True
        cur = cur.__cause__ or cur.__context__
    return False


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
    chain: Runnable = llms[0] if len(llms) == 1 else llms[0].with_fallbacks(llms[1:])

    def _check_breaker() -> None:
        remaining = _breaker_remaining()
        if remaining > 0:
            raise LLMBusyError(f"LLM circuit breaker open for another {remaining:.0f}s")

    def _handle_failure(exc: Exception) -> None:
        # Only availability-class failures (429/5xx/timeouts) open the breaker;
        # persistent misconfiguration (auth, bad request) should not be masked
        # as "busy" for repeated 30s windows. Either way the caller gets
        # LLMBusyError so the API degrades instead of crashing.
        if _is_availability_error(exc):
            _trip_breaker()
        raise LLMBusyError("All chat models failed") from exc

    def _guarded_invoke(value, config=None):
        _check_breaker()
        try:
            # Breaker closes by cooldown expiry only — success never resets it,
            # so a slow success can't race a concurrent failure's trip.
            return chain.invoke(value, config=config)
        except LLMBusyError:
            raise
        except Exception as exc:
            _handle_failure(exc)

    async def _guarded_ainvoke(value, config=None):
        _check_breaker()
        try:
            return await chain.ainvoke(value, config=config)
        except LLMBusyError:
            raise
        except Exception as exc:
            _handle_failure(exc)

    return RunnableLambda(_guarded_invoke, afunc=_guarded_ainvoke)
