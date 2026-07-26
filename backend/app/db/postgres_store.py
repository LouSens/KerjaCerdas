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
    QueryEmbedding,
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
            if hasattr(self.model, "user_id") and hasattr(obj, "user_id"):
                user_id_val = getattr(obj, "user_id")
                stmt = select(self.model).where(
                    (self.model.id == oid) | (self.model.user_id == user_id_val)
                )
            else:
                stmt = select(self.model).where(self.model.id == oid)
            result = await session.execute(stmt)
            rows = result.scalars().all()
            if len(rows) <= 1:
                existing = rows[0] if rows else None
            else:
                # Multiple matches (e.g. legacy rows sharing a user_id):
                # prefer the exact id match, otherwise the most recently
                # updated row, instead of crashing with MultipleResultsFound.
                existing = next((r for r in rows if r.id == oid), None)
                if existing is None:

                    def _recency(r):
                        ts = getattr(r, "updated_at", None) or getattr(r, "created_at", None)
                        return (ts is not None, ts, r.id)

                    existing = max(rows, key=_recency)

            data = obj.model_dump()
            if existing:
                if existing.id != oid:
                    data["id"] = existing.id
                    if hasattr(obj, "id"):
                        try:
                            obj.id = existing.id
                        except Exception:
                            pass
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

    async def get_many(self, ids: list[str]) -> list[TSchema]:
        """Fetch multiple rows by id in one query (order not guaranteed)."""
        if not ids:
            return []
        async with async_session() as session:
            stmt = select(self.model).where(self.model.id.in_(ids))
            result = await session.execute(stmt)
            out = []
            for obj in result.scalars().all():
                data = {c.name: getattr(obj, c.name) for c in self.model.__table__.columns}
                out.append(self.schema.model_validate(data))
            return out

    async def find(self, predicate) -> list[TSchema]:
        """Not efficient for SQL, but maintains the interface from json_store."""
        all_items = await self.list()
        return [x for x in all_items if predicate(x)]


# ── pgvector ANN search (DB-side semantic prefilter) ──────────────────────────
#
# These return (schema, cosine_similarity) tuples ordered by similarity using
# the HNSW indexes (embedding <=> query). If the vector query cannot run (e.g.
# pgvector unavailable / non-Postgres dev DB), they return None so the caller
# can fall back to in-Python scoring over a full table scan.

import logging as _logging  # noqa: E402  (intentional: placed near ANN scoring section)

_ann_logger = _logging.getLogger(__name__)


async def semantic_search_jobs(
    query_vec: list[float], limit: int, embedding_model: str
) -> list[tuple[JobSchema, float]] | None:
    """Top-N active jobs by cosine similarity, computed in Postgres via HNSW."""
    try:
        async with async_session() as session:
            dist = JobPosting.embedding.cosine_distance(query_vec)
            stmt = (
                select(JobPosting, dist.label("distance"))
                .where(
                    JobPosting.is_active.is_(True),
                    JobPosting.embedding.is_not(None),
                    JobPosting.embedding_model == embedding_model,
                )
                .order_by(dist)
                .limit(limit)
            )
            result = await session.execute(stmt)
            out: list[tuple[JobSchema, float]] = []
            for obj, distance in result.all():
                data = {c.name: getattr(obj, c.name) for c in JobPosting.__table__.columns}
                if data.get("embedding") is not None:
                    data["embedding"] = list(data["embedding"])
                out.append((JobSchema.model_validate(data), 1.0 - float(distance)))
            return out
    except Exception as exc:
        _ann_logger.warning("semantic_search_jobs failed (%s) — falling back to full scan", exc)
        return None


async def semantic_search_seekers(
    query_vec: list[float], limit: int, embedding_model: str
) -> list[tuple[SeekerSchema, float]] | None:
    """Top-N seekers by cosine similarity, computed in Postgres via HNSW."""
    try:
        async with async_session() as session:
            dist = SeekerProfile.embedding.cosine_distance(query_vec)
            stmt = (
                select(SeekerProfile, dist.label("distance"))
                .where(
                    SeekerProfile.embedding.is_not(None),
                    SeekerProfile.embedding_model == embedding_model,
                )
                .order_by(dist)
                .limit(limit)
            )
            result = await session.execute(stmt)
            out: list[tuple[SeekerSchema, float]] = []
            for obj, distance in result.all():
                data = {c.name: getattr(obj, c.name) for c in SeekerProfile.__table__.columns}
                if data.get("embedding") is not None:
                    data["embedding"] = list(data["embedding"])
                out.append((SeekerSchema.model_validate(data), 1.0 - float(distance)))
            return out
    except Exception as exc:
        _ann_logger.warning("semantic_search_seekers failed (%s) — falling back to full scan", exc)
        return None


async def list_jobs_missing_embedding(embedding_model: str) -> list[JobSchema]:
    """Active jobs that the ANN query can't see: no embedding, or a vector from
    a different model (incompatible with the query vector). Scored with cos=0
    so hybrid results stay equivalent to the old full-scan behaviour."""
    async with async_session() as session:
        stmt = select(JobPosting).where(
            JobPosting.is_active.is_(True),
            (JobPosting.embedding.is_(None))
            | (JobPosting.embedding_model.is_(None))
            | (JobPosting.embedding_model != embedding_model),
        )
        result = await session.execute(stmt)
        out = []
        for obj in result.scalars().all():
            data = {c.name: getattr(obj, c.name) for c in JobPosting.__table__.columns}
            if data.get("embedding") is not None:
                data["embedding"] = list(data["embedding"])
            out.append(JobSchema.model_validate(data))
        return out


async def list_seekers_missing_embedding(embedding_model: str) -> list[SeekerSchema]:
    """Seekers invisible to the ANN query (no embedding or cross-model vector)."""
    async with async_session() as session:
        stmt = select(SeekerProfile).where(
            (SeekerProfile.embedding.is_(None))
            | (SeekerProfile.embedding_model.is_(None))
            | (SeekerProfile.embedding_model != embedding_model),
        )
        result = await session.execute(stmt)
        out = []
        for obj in result.scalars().all():
            data = {c.name: getattr(obj, c.name) for c in SeekerProfile.__table__.columns}
            if data.get("embedding") is not None:
                data["embedding"] = list(data["embedding"])
            out.append(SeekerSchema.model_validate(data))
        return out


# ── Query-embedding persistent cache ─────────────────────────────────────────
# DB tier of the matcher's query-embedding cache (see matcher._embed_query_cached).
# Both helpers are failure-safe: a DB hiccup degrades to a cache miss / skipped
# write, never a failed match request.

_QUERY_EMBED_TABLE_MAX = 5000


async def get_query_embedding(cache_key: str) -> list[float] | None:
    """Fetch a persisted query embedding by its cache key, or None on miss/error."""
    try:
        async with async_session() as session:
            row = await session.get(QueryEmbedding, cache_key)
            if row is None or not isinstance(row.embedding, list):
                return None
            return [float(x) for x in row.embedding]
    except Exception as exc:
        _ann_logger.warning("get_query_embedding failed (%s) — treating as cache miss", exc)
        return None


async def save_query_embedding(cache_key: str, model: str, embedding: list[float]) -> None:
    """Persist a query embedding (idempotent), pruning oldest rows past the cap."""
    try:
        async with async_session() as session:
            existing = await session.get(QueryEmbedding, cache_key)
            if existing is None:
                session.add(QueryEmbedding(cache_key=cache_key, model=model, embedding=embedding))
            # Keep the table bounded: drop the oldest rows beyond the cap.
            prune_ids = (
                select(QueryEmbedding.cache_key)
                .order_by(QueryEmbedding.created_at.desc())
                .offset(_QUERY_EMBED_TABLE_MAX)
            )
            rows = (await session.execute(prune_ids)).scalars().all()
            for key in rows:
                old = await session.get(QueryEmbedding, key)
                if old is not None:
                    await session.delete(old)
            await session.commit()
    except Exception as exc:
        _ann_logger.warning("save_query_embedding failed (%s) — skipping persist", exc)


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
