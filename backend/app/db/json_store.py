"""
JSON file store — dev-mode persistence.

Each entity gets its own folder under `data/<entity>/<id>.json`. The interface
mirrors what a future Supabase repository would expose, so swapping is a
single import change.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Generic, Iterable, Type, TypeVar

from pydantic import BaseModel

DATA_ROOT = Path(os.environ.get("KERJA_DATA_ROOT", "data")).resolve()

T = TypeVar("T", bound=BaseModel)


class JsonRepository(Generic[T]):
    """Async-friendly JSON file repository keyed on `id`."""

    def __init__(self, model: Type[T], folder: str) -> None:
        self.model = model
        self.folder = DATA_ROOT / folder
        self.folder.mkdir(parents=True, exist_ok=True)

    def _path(self, oid: str) -> Path:
        return self.folder / f"{oid}.json"

    async def get(self, oid: str) -> T | None:
        p = self._path(oid)
        if not p.exists():
            return None
        return self.model.model_validate_json(p.read_text(encoding="utf-8"))

    async def upsert(self, obj: T) -> T:
        oid = getattr(obj, "id")
        self._path(oid).write_text(
            obj.model_dump_json(indent=2),
            encoding="utf-8",
        )
        return obj

    async def delete(self, oid: str) -> bool:
        p = self._path(oid)
        if p.exists():
            p.unlink()
            return True
        return False

    async def list(self, limit: int | None = None) -> list[T]:
        items: list[T] = []
        for p in sorted(self.folder.glob("*.json")):
            items.append(self.model.model_validate_json(p.read_text(encoding="utf-8")))
            if limit and len(items) >= limit:
                break
        return items

    async def find(self, predicate) -> list[T]:
        return [x for x in await self.list() if predicate(x)]


# ── Concrete repositories ────────────────────────────────────────────────────

from backend.app.db.schemas import (  # noqa: E402
    AIPerformanceLog,
    Application,
    ChatSession,
    Course,
    Employer,
    GamificationStats,
    JobPosting,
    MatchBundle,
    SeekerProfile,
    SkillGapResult,
    User,
)


class Repositories:
    """Convenience bundle, injected via FastAPI dependency."""

    def __init__(self) -> None:
        self.users = JsonRepository(User, "users")
        self.seekers = JsonRepository(SeekerProfile, "seekers")
        self.employers = JsonRepository(Employer, "employers")
        self.jobs = JsonRepository(JobPosting, "jobs")
        self.applications = JsonRepository(Application, "applications")
        self.matches = JsonRepository(MatchBundle, "matches")
        self.skill_gaps = JsonRepository(SkillGapResult, "skill_gaps")
        self.chats = JsonRepository(ChatSession, "conversations")
        self.ai_logs = JsonRepository(AIPerformanceLog, "ai_logs")
        self.gamification = JsonRepository(GamificationStats, "gamification")
        self.courses = JsonRepository(Course, "courses")


_repos: Repositories | None = None


def get_repositories() -> Repositories:
    global _repos
    if _repos is None:
        _repos = Repositories()
    return _repos
