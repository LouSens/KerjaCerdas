import uuid

from backend.app.db.models import User as SqlUser
from backend.app.db.session import async_session as async_session_factory
from sqlalchemy.future import select

DEFAULT_PWD = "$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa"

async def seed_auth_user(email: str, name: str, role: str) -> SqlUser:
    async with async_session_factory() as session:
        stmt = select(SqlUser).where(SqlUser.email == email)
        result = await session.execute(stmt)
        u = result.scalar_one_or_none()
        if not u:
            u = SqlUser(id=str(uuid.uuid4()), email=email, password_hash=DEFAULT_PWD, role=role)
            session.add(u)
        else:
            u.role = role
            u.password_hash = DEFAULT_PWD
        await session.commit()
        await session.refresh(u)
        return u
