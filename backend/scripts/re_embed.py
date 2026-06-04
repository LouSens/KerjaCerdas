import asyncio
import os
import sys

# Ensure backend module can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.app.db.postgres_store import get_repositories
from backend.app.services.matching.matcher import SemanticMatcher

async def re_embed_all():
    print("Starting re-embedding process using Gemini API Key...")
    
    # Check if Gemini key is available
    from backend.app.config.settings import settings
    if not settings.gemini_api_key and not os.environ.get("GEMINI_API_KEY"):
        print("ERROR: No Gemini API Key found in environment!")
        return

    repos = get_repositories()
    matcher = SemanticMatcher()
    
    # 1. Re-embed Jobs
    jobs = await repos.jobs.list()
    print(f"Found {len(jobs)} jobs. Re-embedding...")
    for i, job in enumerate(jobs, 1):
        try:
            job = await matcher.embed_job(job)
            await repos.jobs.upsert(job)
            print(f"[{i}/{len(jobs)}] Embedded Job: {job.title}")
        except Exception as e:
            print(f"Failed to embed job {job.id}: {e}")
            
    # 2. Re-embed Seekers
    seekers = await repos.seekers.list()
    print(f"\nFound {len(seekers)} seekers. Re-embedding...")
    for i, seeker in enumerate(seekers, 1):
        try:
            seeker = await matcher.embed_seeker(seeker)
            await repos.seekers.upsert(seeker)
            print(f"[{i}/{len(seekers)}] Embedded Seeker: {seeker.full_name}")
        except Exception as e:
            print(f"Failed to embed seeker {seeker.id}: {e}")
            
    print("\nRe-embedding complete! Your AI matching will now work correctly.")

if __name__ == "__main__":
    asyncio.run(re_embed_all())
