"""
Script to expand seed data for testing HNSW pgvector performance.
Generates 200+ mock jobs and 100+ mock seekers by mutating the base seed data.
"""

import asyncio
import random
from uuid import uuid4

from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import JobPosting, SeekerProfile
from backend.app.services.matching.matcher import SemanticMatcher
from scripts.seed_all import EMPLOYERS, JOB_POSTINGS, SEEKER_PROFILES

REGIONS = ["3171", "3172", "3173", "3174", "3175", "3273", "3471", "3578", "5171", "3271"]
LEVELS = ["Junior", "Mid", "Senior", "Lead", "Staff", "Principal"]

async def seed_expanded_data():
    repos = get_repositories()
    matcher = SemanticMatcher()

    print("Generating expanded mock jobs...")
    employers = await repos.employers.list()
    emp_ids = [e.id for e in employers]
    
    if not emp_ids:
        print("Please run seed_all.py first to populate base employers!")
        return

    # Generate 250 jobs
    new_jobs = []
    for i in range(250):
        base_job = random.choice(JOB_POSTINGS)
        level = random.choice(LEVELS)
        title = f"{level} {base_job[1].split(' ', 1)[1] if ' ' in base_job[1] else base_job[1]}"
        
        job = JobPosting(
            id=str(uuid4()),
            employer_id=random.choice(emp_ids),
            title=title,
            kbji_code=base_job[2],
            description=base_job[3],
            responsibilities=base_job[4],
            required_skills=base_job[5],
            nice_to_have_skills=base_job[6],
            education_min=base_job[7],
            experience_years_min=random.randint(0, 10),
            region_code=random.choice(REGIONS),
            remote_allowed=random.choice([True, False]),
            salary_min=base_job[10] + random.randint(-2000000, 2000000),
            salary_max=base_job[11] + random.randint(-2000000, 5000000),
        )
        new_jobs.append(job)

    # Embed and upsert jobs
    print(f"Embedding {len(new_jobs)} jobs...")
    for chunk in [new_jobs[i:i+10] for i in range(0, len(new_jobs), 10)]:
        await asyncio.gather(*(matcher.embed_job(j) for j in chunk))
        for j in chunk:
            await repos.jobs.upsert(j)

    print("Generating expanded mock seekers...")
    # Generate 150 seekers
    new_seekers = []
    for i in range(150):
        base_seeker = random.choice(SEEKER_PROFILES)
        seeker = SeekerProfile(
            id=str(uuid4()),
            user_id=str(uuid4()), # Fake user ID for mock seekers
            full_name=f"{base_seeker[1].split()[0]} {random.choice(['Wijaya', 'Kurniawan', 'Santoso', 'Putra', 'Pratama'])}",
            headline=base_seeker[2],
            region_code=random.choice(REGIONS),
            salary_expectation_min=base_seeker[4],
            skills=base_seeker[5],
            experience=base_seeker[6],
            education=base_seeker[7],
            resume_text=base_seeker[8]
        )
        new_seekers.append(seeker)

    # Embed and upsert seekers
    print(f"Embedding {len(new_seekers)} seekers...")
    for chunk in [new_seekers[i:i+10] for i in range(0, len(new_seekers), 10)]:
        await asyncio.gather(*(matcher.embed_seeker(s) for s in chunk))
        for s in chunk:
            await repos.seekers.upsert(s)

    print("Successfully expanded seed data!")

if __name__ == "__main__":
    asyncio.run(seed_expanded_data())
