import asyncio
import random

from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import (
    Education,
    EducationLevel,
    SeekerProfile,
    Skill,
    UserRole,
    WorkExperience,
)
from backend.app.services.matching.matcher import SemanticMatcher
from backend.scripts.seed_all import SEEKERS, _seed_auth_user


async def seed_seekers_data():
    repos = get_repositories()
    matcher = SemanticMatcher()
    seeker_count = 0
    expanded_seekers = SEEKERS * 5

    for i in range(0, len(expanded_seekers), 10):
        chunk = expanded_seekers[i : i + 10]
        seeker_objs = []
        for s in chunk:
            mutated_name = f"{s['full_name'].split()[0]} {random.choice(['Wijaya', 'Kurniawan', 'Santoso', 'Putra', 'Pratama'])}"
            u = await _seed_auth_user(
                email=f"{random.randint(100, 999)}_{s['email']}",
                name=mutated_name,
                role=UserRole.SEEKER.value,
            )
            edu_objs = [
                Education(
                    institution=inst,
                    degree=EducationLevel(deg)
                    if deg in EducationLevel.__members__
                    else EducationLevel.S1,
                    major=maj,
                    graduation_year=year,
                )
                for (inst, deg, maj, year) in s["edu"]
            ]
            exp_objs = [
                WorkExperience(
                    company=c,
                    title=t,
                    start_date=sd,
                    end_date=ed,
                    description=desc,
                )
                for (c, t, sd, ed, desc) in s["exp"]
            ]
            skill_objs = [Skill(name=n, level=lv, years=yr) for (n, lv, yr) in s["skills"]]
            seeker = SeekerProfile(
                id=u.id,
                user_id=u.id,
                full_name=mutated_name,
                headline=s["headline"],
                region_code=s["region_code"],
                preferred_regions=s.get("preferred", []),
                skills=skill_objs,
                experience=exp_objs,
                education=edu_objs,
                resume_text=s["resume"],
                salary_expectation_min=s["sal"][0] + random.randint(-500000, 1000000),
                salary_expectation_max=s["sal"][1] + random.randint(-500000, 2000000),
            )
            seeker_objs.append(seeker)

        await asyncio.gather(*(matcher.embed_seeker(seeker) for seeker in seeker_objs))
        for seeker in seeker_objs:
            await repos.seekers.upsert(seeker)
        seeker_count += len(seeker_objs)
        print(f"  ... {seeker_count} seekers seeded")
        # Throttle: stay under free-tier embedding RPM (100/min → ~10 calls per 6s)
        if i + 10 < len(expanded_seekers):
            await asyncio.sleep(6)
    print(f"[seekers] {seeker_count} created")


if __name__ == "__main__":
    asyncio.run(seed_seekers_data())
