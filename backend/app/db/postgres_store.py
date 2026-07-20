from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import select

from backend.app.db.models import (
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
from backend.app.db.schemas import AIPerformanceLog as LogSchema
from backend.app.db.schemas import Application as ApplicationSchema
from backend.app.db.schemas import ChatSession as ChatSchema
from backend.app.db.schemas import Course as CourseSchema
from backend.app.db.schemas import Employer as EmployerSchema
from backend.app.db.schemas import GamificationStats as GameSchema
from backend.app.db.schemas import JobPosting as JobSchema
from backend.app.db.schemas import MatchBundle as MatchSchema
from backend.app.db.schemas import SeekerProfile as SeekerSchema
from backend.app.db.schemas import SkillGapResult as SkillGapSchema
from backend.app.db.schemas import User as UserSchema
from backend.app.db.session import async_session

TSchema = TypeVar("TSchema", bound=BaseModel)
TModel = TypeVar("TModel")


class PostgresRepository(Generic[TSchema, TModel]):
    """Async Postgres repository keyed on `id`."""

    def __init__(self, schema: type[TSchema], model: type[TModel]) -> None:
        self.schema = schema
        self.model = model

    async def get(self, oid: str) -> TSchema | None:
        async with async_session() as session:
            stmt = select(self.model).where(self.model.id == oid)
            result = await session.execute(stmt)
            obj = result.scalar_one_or_none()
            if not obj:
                return None

            # Convert dicts from JSONB to lists if needed, but Pydantic handles validation
            # Convert ORM model to dict, then to Pydantic Schema
            data = {c.name: getattr(obj, c.name) for c in self.model.__table__.columns}
            return self.schema.model_validate(data)

    async def upsert(self, obj: TSchema) -> TSchema:
        async with async_session() as session:
            # check if exists
            oid = getattr(obj, "id")
            stmt = select(self.model).where(self.model.id == oid)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            data = obj.model_dump()
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                new_obj = self.model(**data)
                session.add(new_obj)

            await session.commit()
            return obj

    async def delete(self, oid: str) -> bool:
        async with async_session() as session:
            stmt = select(self.model).where(self.model.id == oid)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                await session.delete(existing)
                await session.commit()
                return True
            return False

    async def list(self, limit: int | None = None) -> list[TSchema]:
        async with async_session() as session:
            stmt = select(self.model)
            if limit:
                stmt = stmt.limit(limit)
            result = await session.execute(stmt)
            objs = result.scalars().all()

            out = []
            for obj in objs:
                data = {c.name: getattr(obj, c.name) for c in self.model.__table__.columns}
                out.append(self.schema.model_validate(data))
            return out

    async def find(self, predicate) -> list[TSchema]:
        """Not efficient for SQL, but maintains the interface from json_store."""
        all_items = await self.list()
        return [x for x in all_items if predicate(x)]


class Repositories:
    """Convenience bundle, injected via FastAPI dependency."""

    def __init__(self) -> None:
        self.users = PostgresRepository(UserSchema, User)
        self.seekers = PostgresRepository(SeekerSchema, SeekerProfile)
        self.employers = PostgresRepository(EmployerSchema, Employer)
        self.jobs = PostgresRepository(JobSchema, JobPosting)
        self.applications = PostgresRepository(ApplicationSchema, Application)
        self.matches = PostgresRepository(MatchSchema, MatchBundle)
        self.skill_gaps = PostgresRepository(SkillGapSchema, SkillGapResult)
        self.chats = PostgresRepository(ChatSchema, ChatSession)
        self.ai_logs = PostgresRepository(LogSchema, AIPerformanceLog)
        self.gamification = PostgresRepository(GameSchema, GamificationStats)
        self.courses = PostgresRepository(CourseSchema, Course)


_repos: Repositories | None = None


def get_repositories() -> Repositories:
    global _repos
    if _repos is None:
        _repos = Repositories()
    return _repos
