"""Load MD policy / role / task prompts into the Gemini system prompt.

The repo's `backend/app/prompts/` tree is the authoritative source of how
the AI behaves. This loader composes the right prompt per task and caches
the assembled string in-memory.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

PROMPTS_ROOT = Path(__file__).resolve().parent.parent / "prompts"


def _read(rel: str) -> str:
    path = PROMPTS_ROOT / rel
    return path.read_text(encoding="utf-8") if path.exists() else ""


@lru_cache(maxsize=64)
def build_system_prompt(role: str, task: str | None = None) -> str:
    """Assemble: SUPERPOWER + guardrails + role + (optional) task + Agent Rules."""
    parts: list[str] = [
        "# === KerjaCerdas system prompt ===",
        _read("SUPERPOWER.md"),
        "\n---\n",
        _read("policies/guardrails.md"),
        "\n---\n",
        _read(f"roles/{role}.md"),
    ]
    if task:
        parts += ["\n---\n", _read(f"tasks/{task}.md")]

    # Inject Agentic System Rules from policies
    policies_dir = Path(__file__).resolve().parent.parent / "prompts" / "policies"

    def _read_agent_rule(filename: str) -> str:
        path = policies_dir / filename
        return path.read_text(encoding="utf-8") if path.exists() else ""

    parts.append("\n# === AGENT SYSTEM COMPLIANCE & RULES ===\n")
    parts.append(_read_agent_rule("tools_skills.md"))
    parts.append("\n---\n")
    parts.append(_read_agent_rule("compliance.md"))
    parts.append("\n---\n")
    parts.append(_read_agent_rule("memory_context.md"))

    return "\n".join(p for p in parts if p)
