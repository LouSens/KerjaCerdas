"""LangGraph state object for the KerjaCerdas job-matching agent."""
from __future__ import annotations

from typing import Annotated, Any, Literal, TypedDict

from langgraph.graph.message import add_messages

from backend.app.db.schemas import (
    ChatMessage,
    CourseRecommendation,
    JobPosting,
    MatchResult,
    SeekerProfile,
)


Intent = Literal["match_jobs", "skill_gap", "advise", "fallback"]


class AgentState(TypedDict, total=False):
    """Single graph-wide state. Each node reads / writes specific keys.

    The graph router picks a path based on `intent`:
      router -> {matcher, skill_gap, advisor} -> compose -> END
    """

    # Inputs
    user_message: str
    seeker: SeekerProfile
    target_job_id: str | None
    candidate_jobs: list[JobPosting]

    # Routing
    intent: Intent
    reasoning: str

    # Outputs
    matches: list[MatchResult]
    missing_skills: list[str]
    matching_skills: list[str]
    recommended_courses: list[CourseRecommendation]
    advisor_response: str
    final_response: str

    # Conversation memory (LangChain-style append-only)
    messages: Annotated[list, add_messages]
