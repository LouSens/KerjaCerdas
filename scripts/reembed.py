"""Re-embed all seekers and jobs whose vectors were made by a different model.

Both sides of the cosine comparison MUST use the same embedding model, so run
this after changing GEMINI_EMBED_MODEL (e.g. the switch to gemini-embedding-2).

Run:
    python -m scripts.reembed            # only rows with a stale model
    python -m scripts.reembed --all      # force re-embed everything
"""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import update

from backend.app.config.settings import settings
from backend.app.db.models import JobPosting as JobModel
from backend.app.db.models import SeekerProfile as SeekerModel
from backend.app.db.postgres_store import get_repositories
from backend.app.db.session import async_session
from backend.app.services.matching.matcher import SemanticMatcher

CHUNK = 10
SLEEP_S = 6  # ~100 embedding calls/min ceiling on free tier


async def reembed(force_all: bool = False) -> None:
    repos = get_repositories()
    matcher = SemanticMatcher()
    target_model = settings.gemini_embed_model

    seekers = await repos.seekers.list()
    jobs = await repos.jobs.list()

    stale_seekers = [
        s for s in seekers if force_all or s.embedding_model != target_model or not s.embedding
    ]
    stale_jobs = [
        j for j in jobs if force_all or j.embedding_model != target_model or not j.embedding
    ]
    print(
        f"target model: {target_model}\n"
        f"seekers: {len(stale_seekers)}/{len(seekers)} stale | jobs: {len(stale_jobs)}/{len(jobs)} stale"
    )

    async def _persist(model, row_id: str, embedding, embedding_model: str) -> None:
        # Targeted by-PK update: only touches the embedding columns, avoiding a
        # full-row upsert round-trip per record.
        async with async_session() as session:
            await session.execute(
                update(model)
                .where(model.id == row_id)
                .values(embedding=embedding, embedding_model=embedding_model)
            )
            await session.commit()

    done = 0
    for i in range(0, len(stale_seekers), CHUNK):
        chunk = stale_seekers[i : i + CHUNK]
        await asyncio.gather(*(matcher.embed_seeker(s) for s in chunk))
        for s in chunk:
            if s.embedding_model == target_model:  # only persist successful embeds
                await _persist(SeekerModel, s.id, s.embedding, s.embedding_model)
                done += 1
        print(f"  ... seekers re-embedded: {done}")
        if i + CHUNK < len(stale_seekers):
            await asyncio.sleep(SLEEP_S)

    done = 0
    for i in range(0, len(stale_jobs), CHUNK):
        chunk = stale_jobs[i : i + CHUNK]
        await asyncio.gather(*(matcher.embed_job(j) for j in chunk))
        for j in chunk:
            if j.embedding_model == target_model:
                await _persist(JobModel, j.id, j.embedding, j.embedding_model)
                done += 1
        print(f"  ... jobs re-embedded: {done}")
        if i + CHUNK < len(stale_jobs):
            await asyncio.sleep(SLEEP_S)

    print("[reembed] done")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="re-embed every row")
    args = parser.parse_args()
    asyncio.run(reembed(force_all=args.all))
