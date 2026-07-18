import pytest
from sqlalchemy import select
from backend.app.api.database import init_db, async_session_factory
from backend.app.db.models import User, SeekerProfile

pytestmark = pytest.mark.asyncio(loop_scope="session")

@pytest.fixture(autouse=True)
async def setup_database():
    """Ensure DB is initialized before tests run."""
    await init_db()
    yield

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
