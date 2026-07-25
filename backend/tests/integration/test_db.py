import pytest
from sqlalchemy import select

from backend.app.api.database import async_session_factory
from backend.app.db.models import User

pytestmark = pytest.mark.asyncio(loop_scope="session")

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from backend.app.api import database
from backend.app.config.settings import settings


@pytest.fixture(autouse=True)
async def setup_database():
    """Ensure DB is initialized before tests run and bind engine to current loop."""
    # Rebuild the engine inside the active pytest event loop with NullPool
    # to prevent "attached to a different loop" errors from asyncpg.
    db_url = settings.effective_database_url
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    test_engine = create_async_engine(db_url, poolclass=NullPool)
    database.engine = test_engine
    database.async_session_factory = async_sessionmaker(test_engine, expire_on_commit=False)

    await database.init_db()
    yield
    await test_engine.dispose()


async def test_create_and_fetch_user():
    """Test that we can insert and retrieve a user using the database."""
    async with async_session_factory() as session:
        user = User(
            email="test_integration@example.com",
            name="Test User",
            password_hash="fakehash",
            role="seeker",
        )
        session.add(user)
        await session.commit()

        # Verify the user was saved
        stmt = select(User).where(User.email == "test_integration@example.com")
        result = await session.execute(stmt)
        saved_user = result.scalar_one_or_none()

        assert saved_user is not None
        assert saved_user.name == "Test User"
        assert saved_user.role == "seeker"

        # Cleanup
        await session.delete(saved_user)
        await session.commit()
