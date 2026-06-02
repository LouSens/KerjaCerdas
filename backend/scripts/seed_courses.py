import asyncio

from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import Course
from backend.scripts.seed_all import COURSES


async def seed_courses_data():
    repos = get_repositories()
    for c in COURSES:
        await repos.courses.upsert(Course(**c))
    print(f"[courses] {len(COURSES)} created")

if __name__ == "__main__":
    asyncio.run(seed_courses_data())
