"""Integration — DB-side (pgvector) semantic prefilter vs in-memory matching.

The matcher now prefilters candidates in Postgres (HNSW, `embedding <=> query`)
when called with jobs=None / seekers=None. These tests seed a real Postgres DB
with embedded, unembedded, and cross-model rows and assert the DB path produces
the same scores and bands as the old in-memory full-scan path, including:

  * rows without embeddings appear with cosine = 0
  * rows embedded with a *different* model appear with cosine = 0
  * when the ANN query fails (semantic_search_* returns None) the matcher
    falls back to a full scan and still matches the in-memory results
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from backend.app.api import database
from backend.app.config.settings import settings
from backend.app.db import models as m
from backend.app.db import postgres_store as store
from backend.app.services.matching.matcher import SemanticMatcher

pytestmark = pytest.mark.asyncio(loop_scope="session")

DIM = settings.gemini_embed_dim
MODEL = settings.gemini_embed_model
TAG = f"parity-{uuid.uuid4().hex[:8]}"


def _vec(*head: float) -> list[float]:
    """768-dim vector with the given leading components, zero-padded."""
    v = list(head) + [0.0] * (DIM - len(head))
    return v


QUERY_VEC = _vec(1.0)  # what the fake embedder returns for every query


class FakeEmbedder:
    """Deterministic embedder: every query embeds to QUERY_VEC."""

    async def embed(self, text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
        return list(QUERY_VEC)


@pytest.fixture(autouse=True)
async def setup_database():
    """Bind the engine to the current loop (NullPool) and init schema."""
    db_url = settings.effective_database_url
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if "sslmode" in db_url:
        # asyncpg doesn't accept sslmode as a URL query param — strip it
        import urllib.parse

        parsed = urllib.parse.urlparse(db_url)
        qs = {k: v for k, v in urllib.parse.parse_qsl(parsed.query) if k != "sslmode"}
        db_url = urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(qs)))

    test_engine = create_async_engine(db_url, poolclass=NullPool)
    database.engine = test_engine
    database.async_session_factory = async_sessionmaker(test_engine, expire_on_commit=False)

    await database.init_db()
    yield
    # Remove everything this test seeded (rows are tagged via region_code)
    async with database.async_session_factory() as session:
        await session.execute(delete(m.JobPosting).where(m.JobPosting.region_code == TAG))
        await session.execute(delete(m.SeekerProfile).where(m.SeekerProfile.region_code == TAG))
        await session.execute(delete(m.Employer).where(m.Employer.region_code == TAG))
        await session.execute(delete(m.User).where(m.User.email.like(f"{TAG}%")))
        await session.commit()
    await test_engine.dispose()


async def _seed() -> None:
    """Seed one employer + 4 jobs and 4 seekers covering all embedding cases."""
    async with database.async_session_factory() as session:
        emp_user = m.User(
            id=f"{TAG}-eu", email=f"{TAG}-emp@example.com", password_hash="x", role="employer"
        )
        employer = m.Employer(
            id=f"{TAG}-emp", user_id=emp_user.id, company_name="Parity Co", region_code=TAG
        )
        # No ORM relationships are configured, so flush parents before children
        # to satisfy the FK constraints.
        session.add(emp_user)
        await session.flush()
        session.add(employer)
        await session.flush()

        def job(suffix: str, skills: list[str], emb, emb_model) -> m.JobPosting:
            return m.JobPosting(
                id=f"{TAG}-job-{suffix}",
                employer_id=employer.id,
                title=f"Job {suffix}",
                description="desc",
                required_skills=skills,
                region_code=TAG,
                embedding=emb,
                embedding_model=emb_model,
            )

        session.add_all(
            [
                job("close", ["Python", "SQL"], _vec(1.0), MODEL),  # cos ≈ 1
                job("far", ["Excel"], _vec(0.6, 0.8), MODEL),  # cos ≈ 0.6
                job("noemb", ["Python"], None, None),  # unembedded → cos 0
                job("xmodel", ["SQL"], _vec(1.0), "old-model"),  # cross-model → cos 0
            ]
        )

        def seeker(suffix: str, skills: list[str], emb, emb_model) -> tuple[m.User, m.SeekerProfile]:
            u = m.User(
                id=f"{TAG}-su-{suffix}",
                email=f"{TAG}-{suffix}@example.com",
                password_hash="x",
                role="seeker",
            )
            s = m.SeekerProfile(
                id=f"{TAG}-skr-{suffix}",
                user_id=u.id,
                full_name=f"Seeker {suffix}",
                region_code=TAG,
                skills=[{"name": n} for n in skills],
                embedding=emb,
                embedding_model=emb_model,
            )
            return u, s

        for pair in (
            seeker("close", ["Python", "SQL"], _vec(1.0), MODEL),
            seeker("far", ["Excel"], _vec(0.6, 0.8), MODEL),
            seeker("noemb", ["Python"], None, None),
            seeker("xmodel", ["SQL"], _vec(1.0), "old-model"),
        ):
            u, s = pair
            session.add(u)
            await session.flush()
            session.add(s)
            await session.flush()

        await session.commit()


def _matcher() -> SemanticMatcher:
    matcher = SemanticMatcher()
    matcher.embedder = FakeEmbedder()
    return matcher


async def _get_seeker(suffix: str):
    return await store.get_repositories().seekers.get(f"{TAG}-skr-{suffix}")


async def _get_job(suffix: str):
    return await store.get_repositories().jobs.get(f"{TAG}-job-{suffix}")


def _job_results_by_id(results) -> dict:
    return {r.job_id: r for r in results}


async def test_rank_jobs_db_path_matches_in_memory() -> None:
    await _seed()
    matcher = _matcher()
    seeker = await _get_seeker("close")
    all_jobs = await store.get_repositories().jobs.list()

    db_results = _job_results_by_id(await matcher.rank_jobs_for_seeker(seeker, top_k=500))
    mem_results = _job_results_by_id(await matcher.rank_jobs_for_seeker(seeker, all_jobs, top_k=500))

    assert set(db_results) == set(mem_results)
    for jid, db_r in db_results.items():
        mem_r = mem_results[jid]
        assert db_r.score == pytest.approx(mem_r.score, abs=1e-3), jid
        assert db_r.band == mem_r.band, jid
        assert db_r.cosine == pytest.approx(mem_r.cosine, abs=1e-3), jid

    # unembedded and cross-model jobs are present with cosine = 0
    for suffix in ("noemb", "xmodel"):
        r = db_results[f"{TAG}-job-{suffix}"]
        assert r.cosine == 0.0
    # embedded rows carry the pgvector-computed cosine
    assert db_results[f"{TAG}-job-close"].cosine == pytest.approx(1.0, abs=1e-3)
    assert db_results[f"{TAG}-job-far"].cosine == pytest.approx(0.6, abs=1e-3)


async def test_rank_seekers_db_path_matches_in_memory() -> None:
    await _seed()
    matcher = _matcher()
    job = await _get_job("close")
    all_seekers = await store.get_repositories().seekers.list()

    db_results = {c["seeker_id"]: c for c in await matcher.rank_seekers_for_job(job, top_k=500)}
    mem_results = {
        c["seeker_id"]: c for c in await matcher.rank_seekers_for_job(job, all_seekers, top_k=500)
    }

    assert set(db_results) == set(mem_results)
    for sid, db_c in db_results.items():
        mem_c = mem_results[sid]
        assert db_c["score"] == pytest.approx(mem_c["score"], abs=1e-3), sid
        assert db_c["band"] == mem_c["band"], sid

    # unembedded and cross-model seekers still surface (cos = 0 contribution)
    for suffix in ("noemb", "xmodel"):
        assert f"{TAG}-skr-{suffix}" in db_results


async def test_rank_jobs_falls_back_to_full_scan_when_ann_fails(monkeypatch) -> None:
    await _seed()
    matcher = _matcher()
    seeker = await _get_seeker("close")
    all_jobs = await store.get_repositories().jobs.list()

    async def _ann_fails(*args, **kwargs):
        return None

    monkeypatch.setattr(store, "semantic_search_jobs", _ann_fails)

    db_results = _job_results_by_id(await matcher.rank_jobs_for_seeker(seeker, top_k=500))
    mem_results = _job_results_by_id(await matcher.rank_jobs_for_seeker(seeker, all_jobs, top_k=500))

    assert set(db_results) == set(mem_results)
    for jid, db_r in db_results.items():
        assert db_r.score == pytest.approx(mem_results[jid].score, abs=1e-3), jid
        assert db_r.band == mem_results[jid].band, jid


async def test_rank_seekers_falls_back_to_full_scan_when_ann_fails(monkeypatch) -> None:
    await _seed()
    matcher = _matcher()
    job = await _get_job("close")
    all_seekers = await store.get_repositories().seekers.list()

    async def _ann_fails(*args, **kwargs):
        return None

    monkeypatch.setattr(store, "semantic_search_seekers", _ann_fails)

    db_results = {c["seeker_id"]: c for c in await matcher.rank_seekers_for_job(job, top_k=500)}
    mem_results = {
        c["seeker_id"]: c for c in await matcher.rank_seekers_for_job(job, all_seekers, top_k=500)
    }

    assert set(db_results) == set(mem_results)
    for sid, db_c in db_results.items():
        assert db_c["score"] == pytest.approx(mem_results[sid]["score"], abs=1e-3), sid
        assert db_c["band"] == mem_results[sid]["band"], sid
