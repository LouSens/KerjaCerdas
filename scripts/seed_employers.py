import asyncio
import random

from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import EducationLevel, Employer, JobPosting, UserRole
from backend.app.services.matching.matcher import SemanticMatcher
from scripts.seed_all import EMPLOYERS, JOB_POSTINGS, _seed_auth_user


async def seed_employers_data():
    repos = get_repositories()
    matcher = SemanticMatcher()
    emp_by_key = {}
    for key, name, ind, size, region, desc in EMPLOYERS:
        u = await _seed_auth_user(email=f"hr@{key}.id", name=name, role=UserRole.EMPLOYER.value)
        emp = await repos.employers.upsert(
            Employer(
                id=u.id,
                user_id=u.id,
                company_name=name,
                industry=ind,
                size=size,
                region_code=region,
                description=desc,
            )
        )
        emp_by_key[key] = emp
    print(f"[employers] {len(emp_by_key)} created")
    job_count = 0
    # Duplicate base jobs 10 times to reach 200+ mock jobs
    expanded_jobs = JOB_POSTINGS * 10

    # Process in chunks of 10 for parallel embedding
    for i in range(0, len(expanded_jobs), 10):
        chunk = expanded_jobs[i : i + 10]
        job_objs = []
        for jp in chunk:
            key, title, kbji, desc, resps, req, nice, edu, yrs, region, remote, smin, smax = jp
            emp = emp_by_key[key]

            # Mutate to avoid exact duplicates
            variant_title = f"{random.choice(['Senior', 'Junior', 'Lead', 'Mid-level', 'Associate', 'Staff', 'Principal', 'Chief'])} {title}"

            try:
                edu_lv = EducationLevel(edu)
            except ValueError:
                edu_lv = EducationLevel.S1
            job = JobPosting(
                employer_id=emp.id,
                title=variant_title,
                kbji_code=kbji,
                description=desc,
                responsibilities=resps,
                required_skills=req,
                nice_to_have_skills=nice,
                education_min=edu_lv,
                experience_years_min=yrs + random.randint(-1, 3),
                region_code=region,
                remote_allowed=random.choice([True, False]),
                salary_min=smin + random.randint(-1000000, 1000000),
                salary_max=smax + random.randint(-1000000, 2000000),
            )
            job_objs.append(job)

        await asyncio.gather(*(matcher.embed_job(job) for job in job_objs))
        for job in job_objs:
            await repos.jobs.upsert(job)
        job_count += len(job_objs)
        print(f"  ... {job_count} jobs seeded")
        # Throttle: stay under free-tier embedding RPM (100/min → ~10 calls per 6s)
        if i + 10 < len(expanded_jobs):
            await asyncio.sleep(6)
    print(f"[jobs] {job_count} created")


if __name__ == "__main__":
    asyncio.run(seed_employers_data())
