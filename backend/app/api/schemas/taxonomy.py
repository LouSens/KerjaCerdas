"""
KerjaCerdas — Taxonomy/insights request schemas
=================================================
Typed request bodies for the taxonomy router (skill/occupation reference
data, skill resolution, and skill-demand insights).
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ResolveSkillRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100)
