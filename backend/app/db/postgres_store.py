from __future__ import annotations

import logging as _logging
from datetime import UTC, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert

from backend.app.db.models import (
    AIPerformanceLog,
    Application,
    ChatSession,
    Course,
    Employer,
    JobPackParseCache,
    JobPosting,
    MatchBundle,
    QueryEmbedding,
    SeekerProfile,
    SkillGapResult,
    User,
)
from backend.app.db.models_proof import (
    ApplicationStatusEvent,
    JobReport,
    ModerationEvent,
    PlanOrder,
    QuizAttempt,
    SkillEvidence,
    SkillQuestion,
)
from backend.app.db.schemas import AIPerformanceLog as LogSchema
from backend.app.db.schemas import Application as ApplicationSchema
from backend.app.db.schemas import ChatSession as ChatSchema
from backend.app.db.schemas import Course as CourseSchema
from backend.app.db.schemas import Employer as EmployerSchema
from backend.app.db.schemas import JobPosting as JobSchema
from backend.app.db.schemas import MatchBundle as MatchSchema
from backend.app.db.schemas import SeekerProfile as SeekerSchema
from backend.app.db.schemas import SkillGapResult as SkillGapSchema
from backend.app.db.schemas import User as UserSchema
from backend.app.db.schemas_proof import ApplicationStatusEvent as StatusEventSchema
from backend.app.db.schemas_proof import JobReport as JobReportSchema
from backend.app.db.schemas_proof import ModerationEvent as ModerationEventSchema
from backend.app.db.schemas_proof import PlanOrder as PlanOrderSchema
from backend.app.db.schemas_proof import QuizAttempt as QuizAttemptSchema
from backend.app.db.schemas_proof import SkillEvidence as SkillEvidenceSchema
from backend.app.db.schemas_proof import SkillQuestion as SkillQuestionSchema
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


async def count_active_jobs() -> int | None:
    """Cheap COUNT of active jobs, or None on error (caller should then assume
    "large" and take the safe/ANN path rather than risk an unbounded scan)."""
    try:
        async with async_session() as session:
            result = await session.execute(
                select(func.count()).select_from(JobPosting).where(JobPosting.is_active.is_(True))
            )
            return int(result.scalar_one())
    except Exception as exc:
        _ann_logger.warning("count_active_jobs failed (%s)", exc)
        return None


async def count_seekers() -> int | None:
    """Cheap COUNT of seeker profiles, or None on error (see count_active_jobs)."""
    try:
        async with async_session() as session:
            result = await session.execute(select(func.count()).select_from(SeekerProfile))
            return int(result.scalar_one())
    except Exception as exc:
        _ann_logger.warning("count_seekers failed (%s)", exc)
        return None


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


# ── Job-pack parse cache ──────────────────────────────────────────────────────
# Server-side dedup so a retried job-pack upload (lost response, reload, a
# different browser/device) replays the exact same parsed postings instead of
# re-invoking Gemini — see JobPackParseCache's docstring in models.py for why
# a client-side cache alone can't guarantee this. Failure-safe like the query-
# embedding cache above: a DB hiccup degrades to a fresh parse, never a 500.

_JOB_PACK_CACHE_MAX_AGE_SECONDS = 24 * 60 * 60  # mirrors the (now-redundant) old client-side TTL


async def get_cached_job_pack_parse(cache_key: str) -> list[dict] | None:
    """Fetch a cached job-pack parse by its cache key, or None on miss/stale/error."""
    try:
        async with async_session() as session:
            row = await session.get(JobPackParseCache, cache_key)
            if row is None or not isinstance(row.postings, list):
                return None
            age = (datetime.now(UTC) - row.created_at.replace(tzinfo=UTC)).total_seconds()
            if age > _JOB_PACK_CACHE_MAX_AGE_SECONDS:
                return None
            return row.postings
    except Exception as exc:
        _store_logger.warning("get_cached_job_pack_parse failed (%s) — treating as cache miss", exc)
        return None


async def save_job_pack_parse(cache_key: str, employer_id: str, postings: list[dict]) -> None:
    """Persist a job-pack parse result (idempotent — a repeat save just overwrites).

    An overwrite (the `else` branch) only happens after get_cached_job_pack_parse
    already decided the previous row was stale and let a fresh parse run — so
    this write must bump created_at to now. Leaving it at the original INSERT
    time (the ORM default only applies once, never on UPDATE) would make the
    row look expired again on the very next read, forcing every subsequent
    upload to re-parse forever after the first TTL window, which is exactly
    the drift this cache exists to prevent.
    """
    try:
        async with async_session() as session:
            existing = await session.get(JobPackParseCache, cache_key)
            if existing is None:
                session.add(
                    JobPackParseCache(cache_key=cache_key, employer_id=employer_id, postings=postings)
                )
            else:
                existing.postings = postings
                existing.created_at = datetime.now(UTC)
            await session.commit()
    except Exception as exc:
        _store_logger.warning("save_job_pack_parse failed (%s) — skipping persist", exc)


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


async def update_seeker_embedding(
    seeker_id: str, embedding: list[float], embedding_model: str
) -> None:
    """Write only the embedding columns for a seeker.

    Used by the background re-embed task in `seeker.py`'s profile-upsert
    endpoint: that task holds a snapshot of the profile taken before the
    embed call started, so a full `upsert()` of that snapshot would silently
    overwrite any field the user changed (or a CV upload added) while the
    background embed was still running. A narrow UPDATE avoids that race.
    """
    async with async_session() as session:
        stmt = (
            update(SeekerProfile)
            .where(SeekerProfile.id == seeker_id)
            .values(embedding=embedding, embedding_model=embedding_model)
        )
        await session.execute(stmt)
        await session.commit()


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


async def find_status_events_by_application_ids(
    application_ids: list[str],
) -> list[StatusEventSchema]:
    """Status history for a set of applications (one query, not one per application)."""
    if not application_ids:
        return []
    try:
        async with async_session() as session:
            stmt = select(ApplicationStatusEvent).where(
                ApplicationStatusEvent.application_id.in_(application_ids)
            )
            result = await session.execute(stmt)
            cols = ApplicationStatusEvent.__table__.columns
            return [
                StatusEventSchema.model_validate({c.name: getattr(obj, c.name) for c in cols})
                for obj in result.scalars().all()
            ]
    except Exception as exc:
        _store_logger.warning("find_status_events_by_application_ids failed (%s)", exc)
        return []


async def find_jobs_by_employer_id(employer_id: str) -> list[JobSchema]:
    """Return all postings for an employer (indexed on employer_id, no full scan)."""
    try:
        async with async_session() as session:
            stmt = select(JobPosting).where(JobPosting.employer_id == employer_id)
            result = await session.execute(stmt)
            out = []
            for obj in result.scalars().all():
                data = {c.name: getattr(obj, c.name) for c in JobPosting.__table__.columns}
                out.append(JobSchema.model_validate(data))
            return out
    except Exception as exc:
        _store_logger.warning("find_jobs_by_employer_id failed (%s)", exc)
        return []


async def find_job_by_employer_and_client_ref(employer_id: str, client_ref: str) -> JobSchema | None:
    """Look up a job by its client-supplied idempotency token (see create_job).

    Backed by the partial unique index on (employer_id, client_ref).
    """
    try:
        async with async_session() as session:
            stmt = select(JobPosting).where(
                JobPosting.employer_id == employer_id,
                JobPosting.client_ref == client_ref,
            )
            result = await session.execute(stmt)
            obj = result.scalar_one_or_none()
            if not obj:
                return None
            data = {c.name: getattr(obj, c.name) for c in JobPosting.__table__.columns}
            return JobSchema.model_validate(data)
    except Exception as exc:
        _store_logger.warning("find_job_by_employer_and_client_ref failed (%s)", exc)
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


# ── v2 proof-of-skill finders ─────────────────────────────────────────────────


async def select_where(model, schema, *conditions, order_by=None, limit: int | None = None):
    """Indexed SELECT ... WHERE <conditions> returning validated schema objects.

    The one generic typed finder the v2 routers use instead of the
    full-table-scan `PostgresRepository.find(lambda ...)`.
    """
    async with async_session() as session:
        stmt = select(model).where(*conditions)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        if limit:
            stmt = stmt.limit(limit)
        result = await session.execute(stmt)
        return [
            schema.model_validate({c.name: getattr(o, c.name) for c in model.__table__.columns})
            for o in result.scalars().all()
        ]


async def find_job_by_public_code(code: str) -> JobSchema | None:
    rows = await select_where(JobPosting, JobSchema, JobPosting.public_code == code, limit=1)
    return rows[0] if rows else None


async def find_applications_by_job_id(job_id: str) -> list[ApplicationSchema]:
    return await select_where(
        Application, ApplicationSchema, Application.job_id == job_id, order_by=Application.created_at
    )


async def find_active_questions(skill: str) -> list[SkillQuestionSchema]:
    return await select_where(
        SkillQuestion,
        SkillQuestionSchema,
        SkillQuestion.skill == skill,
        SkillQuestion.active.is_(True),
        SkillQuestion.reviewed.is_(True),
    )


async def count_active_questions_for_skill(skill: str) -> int:
    """Questions for a skill that are still live, reviewed or not.

    This is the generation-dedupe predicate, and it sits between two failure
    modes:

      reviewed only  -> a freshly generated batch (reviewed=False) is invisible
                        to the check that gates generation, so every call
                        regenerates and re-bills Gemini, never converging.
      all rows       -> deactivating bad questions can never be replenished: the
                        dead rows still satisfy the threshold, so the skill is
                        stuck with too few serveable questions forever.

    Counting ACTIVE rows regardless of `reviewed` satisfies both: a pending
    draft blocks regeneration (it is still on its way to being serveable), and
    a deactivated question stops counting, letting the bank refill.
    """
    async with async_session() as session:
        stmt = select(func.count()).where(
            SkillQuestion.skill == skill, SkillQuestion.active.is_(True)
        )
        return int((await session.execute(stmt)).scalar_one() or 0)


async def list_quiz_skills() -> list[dict]:
    """Skills that can actually serve a quiz, with question counts.

    Filters on reviewed as well as active, matching find_active_questions().
    When the two disagree the UI offers an "Ikut kuis" button for a skill whose
    quiz then 404s.
    """
    async with async_session() as session:
        stmt = (
            select(SkillQuestion.skill, func.max(SkillQuestion.skill_label), func.count())
            .where(SkillQuestion.active.is_(True), SkillQuestion.reviewed.is_(True))
            .group_by(SkillQuestion.skill)
        )
        rows = (await session.execute(stmt)).all()
    return [{"skill": r[0], "label": r[1] or r[0], "question_count": r[2]} for r in rows]


async def find_quiz_attempts(seeker_id: str, skill: str | None = None) -> list[QuizAttemptSchema]:
    conds = [QuizAttempt.seeker_id == seeker_id]
    if skill:
        conds.append(QuizAttempt.skill == skill)
    return await select_where(QuizAttempt, QuizAttemptSchema, *conds, order_by=QuizAttempt.created_at)


async def find_orders_by_user(user_id: str) -> list[PlanOrderSchema]:
    return await select_where(PlanOrder, PlanOrderSchema, PlanOrder.user_id == user_id)


async def find_orders_by_status(status: str) -> list[PlanOrderSchema]:
    return await select_where(
        PlanOrder, PlanOrderSchema, PlanOrder.status == status, order_by=PlanOrder.created_at
    )


async def find_reports_for_job(job_id: str) -> list[JobReportSchema]:
    return await select_where(JobReport, JobReportSchema, JobReport.job_id == job_id)


async def find_unresolved_reports(limit: int = 500) -> list[JobReportSchema]:
    """Open reports, OLDEST first. One query for the whole moderation backlog.

    The admin queue needs the postings that carry open reports. Walking every
    published job and asking for its reports instead costs one query per job and
    grows with the catalogue rather than with the backlog, which is the wrong
    axis entirely — the queue is small even when the job board is large.

    Oldest first, and that ordering is the correctness fix, not a preference.
    Newest-first with a cap meant that once the backlog exceeded the cap — or a
    few heavily reported postings filled it — the OLDEST reports fell off the
    only screen that can resolve them, permanently. They stayed unresolved, so
    they never recorded a verdict, so the reporters who filed them never
    accumulated the history that `reporter_weight` reads. A queue that starves
    its oldest entries is not a queue. Draining oldest-first means every report
    reaches an admin eventually, and the cap only bounds one page load.
    """
    return await select_where(
        JobReport,
        JobReportSchema,
        JobReport.resolved.is_(False),
        order_by=JobReport.created_at,
        limit=limit,
    )


async def find_jobs_by_moderation_status(status: str) -> list[JobSchema]:
    return await select_where(
        JobPosting, JobSchema, JobPosting.moderation_status == status, order_by=JobPosting.created_at
    )


async def find_moderation_events(job_id: str) -> list[ModerationEventSchema]:
    return await select_where(
        ModerationEvent,
        ModerationEventSchema,
        ModerationEvent.job_id == job_id,
        order_by=ModerationEvent.created_at,
    )


async def count_events(user_id: str, event_type: str, since: datetime) -> int:
    """Usage metering (e.g. advisor messages per day) from the events table."""
    from backend.app.db.models import Event

    async with async_session() as session:
        stmt = select(func.count()).where(
            Event.user_id == user_id, Event.event_type == event_type, Event.created_at >= since
        )
        return int((await session.execute(stmt)).scalar_one() or 0)


async def add_event(user_id: str | None, event_type: str, payload: dict | None = None) -> None:
    from backend.app.db.models import Event

    try:
        async with async_session() as session:
            session.add(Event(user_id=user_id, event_type=event_type, payload=payload or {}))
            await session.commit()
    except Exception as exc:  # noqa: BLE001 — metering must never break a request
        _store_logger.warning("add_event failed (%s)", exc)


async def consume_quota(user_id: str, event_type: str, limit: int, since: datetime) -> bool:
    """Check-and-consume one unit of a usage quota (e.g. advisor messages/day).

    On PostgreSQL a per-(user, event) advisory lock held for the transaction
    makes the count-then-insert atomic, so two concurrent requests cannot both
    read `used == limit - 1` and both proceed.

    SQLite (dev/test only) has no advisory locks, so the guard is skipped rather
    than raising `no such function: pg_advisory_xact_lock` — which would 500 the
    request instead of metering it. The count-then-insert is then racy under
    genuine concurrency; that is acceptable for a single-process dev database
    and is never the production path.
    """
    from sqlalchemy import text

    from backend.app.api.database import engine
    from backend.app.db.models import Event

    async with async_session() as session:
        if engine.name == "postgresql":
            lock_id = hash(f"{user_id}:{event_type}") % (2**31 - 1)
            await session.execute(text("SELECT pg_advisory_xact_lock(:lock_id)").bindparams(lock_id=lock_id))

        stmt = select(func.count()).where(
            Event.user_id == user_id, Event.event_type == event_type, Event.created_at >= since
        )
        used = int((await session.execute(stmt)).scalar_one() or 0)

        if used >= limit:
            return False

        session.add(Event(user_id=user_id, event_type=event_type, payload={}))
        await session.commit()
        return True

async def record_ai_usage(
    task: str,
    model: str,
    tokens_in: int,
    tokens_out: int,
    latency_ms: int,
    success: bool = True,
    user_id: str | None = None,
    error: str | None = None,
) -> None:
    """One ai_logs row per Gemini call — feeds the admin cost-per-action report."""
    import uuid as _uuid

    try:
        async with async_session() as session:
            session.add(
                AIPerformanceLog(
                    id=str(_uuid.uuid4()),
                    request_id=_uuid.uuid4().hex[:12],
                    user_id=user_id,
                    role="system",
                    task=task,
                    model=model,
                    latency_ms=latency_ms,
                    tokens_in=tokens_in,
                    tokens_out=tokens_out,
                    success=success,
                    error=(error or "")[:500] or None,
                )
            )
            await session.commit()
    except Exception as exc:  # noqa: BLE001
        _store_logger.warning("record_ai_usage failed (%s)", exc)


async def backfill_public_codes() -> int:
    """Give every job without a share code one (legacy / seeded rows)."""
    from backend.app.services.hiring.links import new_public_code

    async with async_session() as session:
        rows = (await session.execute(select(JobPosting).where(JobPosting.public_code.is_(None)))).scalars().all()
        for job in rows:
            job.public_code = new_public_code()
        await session.commit()
        return len(rows)


async def set_user_email_verified(user_id: str) -> None:
    async with async_session() as session:
        await session.execute(update(User).where(User.id == user_id).values(email_verified=True))
        await session.commit()


async def find_user_id_by_email(email: str) -> str | None:
    """User id for an email, WITHOUT validating the row. Old seeds stored logins
    like hr@warung_bahari.id that fail EmailStr, so a validated read would raise."""
    async with async_session() as session:
        return (await session.execute(select(User.id).where(User.email == email))).scalar_one_or_none()


async def set_user_email(user_id: str, email: str) -> None:
    async with async_session() as session:
        await session.execute(update(User).where(User.id == user_id).values(email=email))
        await session.commit()


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
        self.courses = PostgresRepository(CourseSchema, Course)
        # v2 proof-of-skill tables
        self.skill_questions = PostgresRepository(SkillQuestionSchema, SkillQuestion)
        self.quiz_attempts = PostgresRepository(QuizAttemptSchema, QuizAttempt)
        self.skill_evidence = PostgresRepository(SkillEvidenceSchema, SkillEvidence)
        self.job_reports = PostgresRepository(JobReportSchema, JobReport)
        self.moderation_events = PostgresRepository(ModerationEventSchema, ModerationEvent)
        self.plan_orders = PostgresRepository(PlanOrderSchema, PlanOrder)
        self.status_events = PostgresRepository(StatusEventSchema, ApplicationStatusEvent)


_repos: Repositories | None = None


def get_repositories() -> Repositories:
    global _repos
    if _repos is None:
        _repos = Repositories()
    return _repos
