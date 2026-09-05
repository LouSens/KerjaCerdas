from __future__ import annotations

import logging as _logging
from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from backend.app.db.models import (
    AIPerformanceLog,
    Application,
    ChatSession,
    Course,
    Employer,
    GamificationStats,
    JobPosting,
    JobSkillRequirement,
    LearningAction,
    MatchBundle,
    Occupation,
    OccupationSkill,
    QueryEmbedding,
    RegionalMinimumWage,
    SeekerProfile,
    SeekerSkillAssessmentAttempt,
    Skill,
    SkillAssessment,
    SkillGapResult,
    User,
)
from backend.app.db.models import (
    SeekerSkill as SeekerSkillModel,
)
from backend.app.db.models import (
    SkillDemandSnapshot as SkillDemandSnapshotModel,
)
from backend.app.db.schemas import AIPerformanceLog as LogSchema
from backend.app.db.schemas import Application as ApplicationSchema
from backend.app.db.schemas import ChatSession as ChatSchema
from backend.app.db.schemas import Course as CourseSchema
from backend.app.db.schemas import Employer as EmployerSchema
from backend.app.db.schemas import GamificationStats as GameSchema
from backend.app.db.schemas import JobPosting as JobSchema
from backend.app.db.schemas import JobSkillRequirementLink, OccupationSkillLink
from backend.app.db.schemas import LearningAction as LearningActionSchema
from backend.app.db.schemas import MatchBundle as MatchSchema
from backend.app.db.schemas import RegionalMinimumWage as RegionalMinimumWageSchema
from backend.app.db.schemas import SeekerProfile as SeekerSchema
from backend.app.db.schemas import SeekerSkill as SeekerSkillSchema
from backend.app.db.schemas import SeekerSkillAssessmentAttempt as AttemptSchema
from backend.app.db.schemas import SkillAssessment as SkillAssessmentSchema
from backend.app.db.schemas import SkillDemandSnapshot as SkillDemandSnapshotSchema
from backend.app.db.schemas import SkillGapResult as SkillGapSchema
from backend.app.db.schemas import TaxonomyOccupation as OccupationSchema
from backend.app.db.schemas import TaxonomySkill as SkillSchema
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
        """Atomically insert-or-update using PostgreSQL ON CONFLICT DO UPDATE.

        Falls back to a SELECT+INSERT/UPDATE pattern for SQLite (dev/test mode)
        since SQLite's ON CONFLICT syntax differs.
        """
        data = obj.model_dump()
        async with async_session() as session:
            # Detect SQLite (dev) vs PostgreSQL (prod)
            dialect = session.bind.dialect.name if session.bind else "postgresql"
            if dialect == "postgresql":
                # Atomic upsert — no TOCTOU race condition
                stmt = pg_insert(self.model).values(**data)
                # Build the update dict (all columns except the PK)
                pk_cols = {c.name for c in self.model.__table__.primary_key.columns}
                update_dict = {k: v for k, v in data.items() if k not in pk_cols}
                if update_dict:
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["id"],
                        set_=update_dict,
                    )
                else:
                    stmt = stmt.on_conflict_do_nothing()
                await session.execute(stmt)
                await session.commit()
            else:
                # SQLite fallback: SELECT then INSERT/UPDATE
                oid = getattr(obj, "id")
                result = await session.execute(select(self.model).where(self.model.id == oid))
                existing = result.scalar_one_or_none()
                if existing:
                    for k, v in data.items():
                        setattr(existing, k, v)
                else:
                    session.add(self.model(**data))
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
        """Full-table scan with Python-side predicate.

        DEPRECATED for hot paths — loads the entire table into memory.
        Use the typed SQL finders below (find_by_user_id, find_by_seeker_id, etc.)
        for any query called on every authenticated request.
        """
        all_items = await self.list()
        return [x for x in all_items if predicate(x)]


# ── pgvector ANN search (DB-side semantic prefilter) ──────────────────────────
#
# These return (schema, cosine_similarity) tuples ordered by similarity using
# the HNSW indexes (embedding <=> query). If the vector query cannot run (e.g.
# pgvector unavailable / non-Postgres dev DB), they return None so the caller
# can fall back to in-Python scoring over a full table scan.


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
    """Persist a query embedding (idempotent), pruning oldest rows past the cap.

    Uses a single batched DELETE instead of N+1 individual deletes.
    """
    try:
        async with async_session() as session:
            existing = await session.get(QueryEmbedding, cache_key)
            if existing is None:
                session.add(QueryEmbedding(cache_key=cache_key, model=model, embedding=embedding))
            # Keep the table bounded: delete all rows beyond the cap in one query.
            subquery = (
                select(QueryEmbedding.cache_key)
                .order_by(QueryEmbedding.created_at.desc())
                .offset(_QUERY_EMBED_TABLE_MAX)
                .scalar_subquery()
            )
            await session.execute(
                delete(QueryEmbedding).where(QueryEmbedding.cache_key.in_(subquery))
            )
            await session.commit()
    except Exception as exc:
        _ann_logger.warning("save_query_embedding failed (%s) — skipping persist", exc)


# ── Typed SQL finders for hot paths ──────────────────────────────────────────
# These replace find(lambda ...) full-table-scans on the most-called queries.
# Each runs a single indexed SQL query instead of loading the whole table.

_store_logger = _logging.getLogger(__name__)


async def find_seeker_by_user_id(user_id: str) -> SeekerSchema | None:
    """Return a seeker by their auth user_id (indexed, O(1))."""
    try:
        async with async_session() as session:
            stmt = select(SeekerProfile).where(SeekerProfile.user_id == user_id)
            result = await session.execute(stmt)
            obj = result.scalar_one_or_none()
            if not obj:
                return None
            data = {c.name: getattr(obj, c.name) for c in SeekerProfile.__table__.columns}
            if data.get("embedding") is not None:
                data["embedding"] = list(data["embedding"])
            return SeekerSchema.model_validate(data)
    except Exception as exc:
        _store_logger.warning("find_seeker_by_user_id failed (%s)", exc)
        return None


async def find_employer_by_user_id(user_id: str) -> EmployerSchema | None:
    """Return an employer by their auth user_id (indexed, O(1))."""
    try:
        async with async_session() as session:
            stmt = select(Employer).where(Employer.user_id == user_id)
            result = await session.execute(stmt)
            obj = result.scalar_one_or_none()
            if not obj:
                return None
            data = {c.name: getattr(obj, c.name) for c in Employer.__table__.columns}
            return EmployerSchema.model_validate(data)
    except Exception as exc:
        _store_logger.warning("find_employer_by_user_id failed (%s)", exc)
        return None


async def find_applications_by_seeker_id(seeker_id: str) -> list[ApplicationSchema]:
    """Return all applications for a seeker (indexed on seeker_id, no full scan)."""
    try:
        async with async_session() as session:
            stmt = select(Application).where(Application.seeker_id == seeker_id)
            result = await session.execute(stmt)
            out = []
            for obj in result.scalars().all():
                data = {c.name: getattr(obj, c.name) for c in Application.__table__.columns}
                out.append(ApplicationSchema.model_validate(data))
            return out
    except Exception as exc:
        _store_logger.warning("find_applications_by_seeker_id failed (%s)", exc)
        return []


async def find_gamification_by_seeker_id(seeker_id: str) -> GameSchema | None:
    """Return gamification stats for a seeker (indexed, O(1))."""
    try:
        async with async_session() as session:
            stmt = select(GamificationStats).where(GamificationStats.seeker_id == seeker_id)
            result = await session.execute(stmt)
            obj = result.scalar_one_or_none()
            if not obj:
                return None
            data = {c.name: getattr(obj, c.name) for c in GamificationStats.__table__.columns}
            return GameSchema.model_validate(data)
    except Exception as exc:
        _store_logger.warning("find_gamification_by_seeker_id failed (%s)", exc)
        return None


async def find_skill_gaps_by_seeker_id(seeker_id: str) -> list[SkillGapSchema]:
    """Return all skill gap results for a seeker (indexed on seeker_id)."""
    try:
        async with async_session() as session:
            stmt = select(SkillGapResult).where(SkillGapResult.seeker_id == seeker_id)
            result = await session.execute(stmt)
            out = []
            for obj in result.scalars().all():
                data = {c.name: getattr(obj, c.name) for c in SkillGapResult.__table__.columns}
                out.append(SkillGapSchema.model_validate(data))
            return out
    except Exception as exc:
        _store_logger.warning("find_skill_gaps_by_seeker_id failed (%s)", exc)
        return []


# ── Taxonomy: composite-PK association tables ────────────────────────────────
# OccupationSkill / JobSkillRequirement have no synthetic `id`, so they don't
# fit PostgresRepository's id-keyed contract — these are the dedicated
# data-access functions for them instead.


async def set_occupation_skills(occupation_id: str, links: list[OccupationSkillLink]) -> None:
    """Replace an occupation's full skill template with `links`."""
    async with async_session() as session:
        await session.execute(
            delete(OccupationSkill).where(OccupationSkill.occupation_id == occupation_id)
        )
        for link in links:
            session.add(
                OccupationSkill(
                    occupation_id=occupation_id,
                    skill_id=link.skill_id,
                    min_level=link.min_level,
                    is_core=link.is_core,
                )
            )
        await session.commit()


async def list_occupation_skills(occupation_id: str) -> list[OccupationSkillLink]:
    async with async_session() as session:
        stmt = select(OccupationSkill).where(OccupationSkill.occupation_id == occupation_id)
        result = await session.execute(stmt)
        return [
            OccupationSkillLink(
                occupation_id=row.occupation_id,
                skill_id=row.skill_id,
                min_level=row.min_level,
                is_core=row.is_core,
            )
            for row in result.scalars().all()
        ]


async def set_job_skill_requirements(job_id: str, links: list[JobSkillRequirementLink]) -> None:
    """Replace a job's full normalized skill-requirement set with `links`."""
    async with async_session() as session:
        await session.execute(
            delete(JobSkillRequirement).where(JobSkillRequirement.job_id == job_id)
        )
        for link in links:
            session.add(
                JobSkillRequirement(
                    job_id=job_id,
                    skill_id=link.skill_id,
                    min_level=link.min_level,
                    is_required=link.is_required,
                )
            )
        await session.commit()


async def list_job_skill_requirements(job_id: str) -> list[JobSkillRequirementLink]:
    async with async_session() as session:
        stmt = select(JobSkillRequirement).where(JobSkillRequirement.job_id == job_id)
        result = await session.execute(stmt)
        return [
            JobSkillRequirementLink(
                job_id=row.job_id,
                skill_id=row.skill_id,
                min_level=row.min_level,
                is_required=row.is_required,
            )
            for row in result.scalars().all()
        ]


async def upsert_seeker_skill(
    seeker_id: str, skill_id: str, level: str, years: float, verified_via: str | None = None
) -> SeekerSkillSchema:
    """Insert or update the (seeker_id, skill_id) row, keyed by the unique
    constraint rather than a caller-supplied `id` — the natural key for this
    entity is the pair, not a synthetic id."""
    async with async_session() as session:
        stmt = select(SeekerSkillModel).where(
            SeekerSkillModel.seeker_id == seeker_id, SeekerSkillModel.skill_id == skill_id
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            existing.level = level
            existing.years = years
            if verified_via:
                existing.verified_via = verified_via
            await session.commit()
            row = existing
        else:
            row = SeekerSkillModel(
                seeker_id=seeker_id,
                skill_id=skill_id,
                level=level,
                years=years,
                verified_via=verified_via or "self_report",
            )
            session.add(row)
            await session.commit()
        data = {c.name: getattr(row, c.name) for c in SeekerSkillModel.__table__.columns}
        return SeekerSkillSchema.model_validate(data)


async def upsert_skill_demand_snapshot(
    skill_id: str,
    region_code: str,
    period: str,
    demand_count: int,
    supply_count: int,
    avg_salary_offered: int,
) -> SkillDemandSnapshotSchema:
    """Insert or update the (skill_id, region_code, period) row.

    The generic PostgresRepository.upsert() keys on `id`, but this entity's
    natural key is the (skill, region, period) triple — a fresh `id` per call
    would violate that unique constraint on a second run instead of updating
    in place, so this looks the row up by its real key first.
    """
    async with async_session() as session:
        stmt = select(SkillDemandSnapshotModel).where(
            SkillDemandSnapshotModel.skill_id == skill_id,
            SkillDemandSnapshotModel.region_code == region_code,
            SkillDemandSnapshotModel.period == period,
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            existing.demand_count = demand_count
            existing.supply_count = supply_count
            existing.avg_salary_offered = avg_salary_offered
            await session.commit()
            row = existing
        else:
            row = SkillDemandSnapshotModel(
                skill_id=skill_id,
                region_code=region_code,
                period=period,
                demand_count=demand_count,
                supply_count=supply_count,
                avg_salary_offered=avg_salary_offered,
            )
            session.add(row)
            await session.commit()
        data = {c.name: getattr(row, c.name) for c in SkillDemandSnapshotModel.__table__.columns}
        return SkillDemandSnapshotSchema.model_validate(data)


async def list_skill_demand(region_code: str | None = None, period: str | None = None):
    """Read path for GET /insights/skill-demand — filters over precomputed
    snapshots, never aggregates at request time."""
    async with async_session() as session:
        stmt = select(SkillDemandSnapshotModel)
        if region_code:
            stmt = stmt.where(SkillDemandSnapshotModel.region_code == region_code)
        if period:
            stmt = stmt.where(SkillDemandSnapshotModel.period == period)
        rows = (await session.execute(stmt)).scalars().all()
        out = []
        for row in rows:
            data = {c.name: getattr(row, c.name) for c in SkillDemandSnapshotModel.__table__.columns}
            out.append(SkillDemandSnapshotSchema.model_validate(data))
        return out


async def get_regional_minimum_wage(region_code: str, year: int) -> int | None:
    """Latest-known UMR for (region_code, year), or None if unseeded.

    Seed data shipped with this migration is illustrative only — see
    RegionalMinimumWage's model docstring.
    """
    async with async_session() as session:
        stmt = select(RegionalMinimumWage).where(
            RegionalMinimumWage.region_code == region_code, RegionalMinimumWage.year == year
        )
        row = (await session.execute(stmt)).scalar_one_or_none()
        return row.umr_amount if row else None


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
        self.skills = PostgresRepository(SkillSchema, Skill)
        self.occupations = PostgresRepository(OccupationSchema, Occupation)
        self.seeker_skills = PostgresRepository(SeekerSkillSchema, SeekerSkillModel)
        self.skill_demand_snapshots = PostgresRepository(
            SkillDemandSnapshotSchema, SkillDemandSnapshotModel
        )
        self.learning_actions = PostgresRepository(LearningActionSchema, LearningAction)
        self.regional_minimum_wages = PostgresRepository(
            RegionalMinimumWageSchema, RegionalMinimumWage
        )
        self.skill_assessments = PostgresRepository(SkillAssessmentSchema, SkillAssessment)
        self.skill_assessment_attempts = PostgresRepository(AttemptSchema, SeekerSkillAssessmentAttempt)


_repos: Repositories | None = None


def get_repositories() -> Repositories:
    global _repos
    if _repos is None:
        _repos = Repositories()
    return _repos
