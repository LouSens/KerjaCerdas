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
    """Assemble: SUPERPOWER + guardrails + role + (optional) task.

    role: "seeker_advisor" | "employer_analyst" | "admin_reviewer"
    task: filename in prompts/tasks/ without `.md` (e.g. "cv_parser")
    """
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
    return "\n".join(p for p in parts if p)


def list_available() -> dict[str, list[str]]:
    return {
        "roles": [p.stem for p in (PROMPTS_ROOT / "roles").glob("*.md")],
        "tasks": [p.stem for p in (PROMPTS_ROOT / "tasks").glob("*.md")],
        "policies": [p.stem for p in (PROMPTS_ROOT / "policies").glob("*.md")],
    }
