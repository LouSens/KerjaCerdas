from __future__ import annotations

from typing import Generic, Type, TypeVar, Any
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from backend.app.db.schemas import (
    User as UserSchema, SeekerProfile as SeekerSchema, Employer as EmployerSchema,
    JobPosting as JobSchema, Application as ApplicationSchema, MatchBundle as MatchSchema,
    SkillGapResult as SkillGapSchema, ChatSession as ChatSchema, Course as CourseSchema,
    AIPerformanceLog as LogSchema, GamificationStats as GameSchema
)
from backend.app.db.models import (
    User, SeekerProfile, Employer, JobPosting, Application, MatchBundle,
    SkillGapResult, ChatSession, Course, AIPerformanceLog, GamificationStats
)
from backend.app.db.session import async_session

TSchema = TypeVar("TSchema", bound=BaseModel)
TModel = TypeVar("TModel")

class PostgresRepository(Generic[TSchema, TModel]):
    """Async Postgres repository keyed on `id`."""

    def __init__(self, schema: Type[TSchema], model: Type[TModel]) -> None:
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
