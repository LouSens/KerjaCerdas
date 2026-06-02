import asyncio
from backend.scripts.seed_all import EMPLOYERS, JOB_POSTINGS, _seed_auth_user
from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import Employer, JobPosting, EducationLevel, UserRole
from backend.app.services.matching.matcher import SemanticMatcher

async def seed_employers_data():
    repos = get_repositories()
    matcher = SemanticMatcher()
    emp_by_key = {}
    for key, name, ind, size, region, desc in EMPLOYERS:
        u = await _seed_auth_user(email=f"hr@{key}.id", name=name, role=UserRole.EMPLOYER.value)
        emp = await repos.employers.upsert(Employer(
            id=u.id, user_id=u.id, company_name=name, industry=ind, size=size,
            region_code=region, description=desc,
        ))
        emp_by_key[key] = emp
    print(f"[employers] {len(emp_by_key)} created")
    job_count = 0
    for jp in JOB_POSTINGS:
        key, title, kbji, desc, resps, req, nice, edu, yrs, region, remote, smin, smax = jp
        emp = emp_by_key[key]
        try:
            edu_lv = EducationLevel(edu)
        except ValueError:
            edu_lv = EducationLevel.S1
        job = JobPosting(
            employer_id=emp.id, title=title, kbji_code=kbji, description=desc,
            responsibilities=resps, required_skills=req, nice_to_have_skills=nice,
            education_min=edu_lv, experience_years_min=yrs,
            region_code=region, remote_allowed=remote, salary_min=smin, salary_max=smax,
        )
        await matcher.embed_job(job)
        await repos.jobs.upsert(job)
        job_count += 1
    print(f"[jobs] {job_count} created")

if __name__ == "__main__":
    asyncio.run(seed_employers_data())
