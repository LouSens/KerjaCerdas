"""Shared helpers for normalizing LLM outputs."""

from __future__ import annotations

from typing import Any


def content_to_text(content: Any) -> str:
    """Normalize a LangChain message ``content`` value to a plain string.

    Gemini (via LangChain) may return content as a plain ``str`` or as a list
    of parts, e.g. ``[{"type": "text", "text": "..."}, ...]``. Non-text parts
    (tool calls, thoughts, etc.) are skipped; ``None`` and non-string text
    values are coerced safely so callers can always ``.strip()`` the result.
    """
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                text = part.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return str(content)
