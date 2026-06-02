import asyncio
from backend.scripts.seed_all import SEEKERS, _seed_auth_user
from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import SeekerProfile, Education, WorkExperience, Skill, EducationLevel, UserRole
from backend.app.services.matching.matcher import SemanticMatcher

async def seed_seekers_data():
    repos = get_repositories()
    matcher = SemanticMatcher()
    seeker_count = 0
    for s in SEEKERS:
        u = await _seed_auth_user(email=s["email"], name=s["full_name"], role=UserRole.SEEKER.value)
        edu_objs = [Education(
            institution=inst, degree=EducationLevel(deg) if deg in EducationLevel.__members__ else EducationLevel.S1,
            major=maj, graduation_year=year,
        ) for (inst, deg, maj, year) in s["edu"]]
        exp_objs = [WorkExperience(
            company=c, title=t, start_date=sd, end_date=ed, description=desc,
        ) for (c, t, sd, ed, desc) in s["exp"]]
        skill_objs = [Skill(name=n, level=lv, years=yr) for (n, lv, yr) in s["skills"]]
        seeker = SeekerProfile(
            user_id=u.id, full_name=s["full_name"], headline=s["headline"],
            region_code=s["region_code"], preferred_regions=s.get("preferred", []),
            skills=skill_objs, experience=exp_objs, education=edu_objs,
            resume_text=s["resume"], salary_expectation_min=s["sal"][0],
            salary_expectation_max=s["sal"][1],
        )
        await matcher.embed_seeker(seeker)
        await repos.seekers.upsert(seeker)
        seeker_count += 1
    print(f"[seekers] {seeker_count} created")

if __name__ == "__main__":
    asyncio.run(seed_seekers_data())
