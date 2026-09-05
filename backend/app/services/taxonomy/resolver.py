"""
Free-text skill resolution against the canonical `skills` taxonomy table.

`SeekerProfile.skills` / `JobPosting.required_skills` stay free text — this
module is how that text gets tied to a canonical `skill_id` (for
`seeker_skills` / `job_skill_requirements`) without forcing every existing
caller to migrate at once.

Three-tier match, cheapest first:
  1. Exact match on Skill.canonical_name (case-insensitive)
  2. Exact match against any of Skill.aliases
  3. Fuzzy fallback (stdlib difflib — no extra dependency) over all
     canonical names + aliases, returned as ranked suggestions rather than
     an auto-accepted match. The caller (a profile save, a job post) decides
     whether to accept a fuzzy suggestion; unresolved text is simply left
     unlinked, never coerced into a wrong skill_id.
"""

from __future__ import annotations

import difflib
from dataclasses import dataclass

from backend.app.db.postgres_store import get_repositories


@dataclass
class SkillMatch:
    skill_id: str
    canonical_name: str
    confidence: float  # 1.0 = exact match, else a difflib similarity ratio


def _match_against(text: str, all_skills: list, limit: int) -> list[SkillMatch]:
    normalized = (text or "").strip().lower()
    if not normalized or not all_skills:
        return []

    for skill in all_skills:
        if skill.canonical_name.lower() == normalized:
            return [SkillMatch(skill.id, skill.canonical_name, 1.0)]
        if normalized in {a.lower() for a in skill.aliases}:
            return [SkillMatch(skill.id, skill.canonical_name, 1.0)]

    lookup: dict[str, object] = {}
    for skill in all_skills:
        lookup[skill.canonical_name.lower()] = skill
        for alias in skill.aliases:
            lookup[alias.lower()] = skill

    close = difflib.get_close_matches(normalized, lookup.keys(), n=limit, cutoff=0.72)
    seen: set[str] = set()
    matches: list[SkillMatch] = []
    for candidate in close:
        skill = lookup[candidate]
        if skill.id in seen:
            continue
        seen.add(skill.id)
        ratio = difflib.SequenceMatcher(None, normalized, candidate).ratio()
        matches.append(SkillMatch(skill.id, skill.canonical_name, round(ratio, 3)))
    return matches


async def resolve_skill(raw_text: str, limit: int = 3) -> list[SkillMatch]:
    """Best-effort match for one free-text skill string."""
    repos = get_repositories()
    all_skills = await repos.skills.list()
    return _match_against(raw_text, all_skills, limit)


async def resolve_skills_bulk(raw_texts: list[str]) -> dict[str, list[SkillMatch]]:
    """Resolve many free-text skill strings in a single DB read."""
    repos = get_repositories()
    all_skills = await repos.skills.list()
    return {raw: _match_against(raw, all_skills, limit=3) for raw in raw_texts}
