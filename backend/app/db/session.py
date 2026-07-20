"""Single source of truth for database sessions.

Historically this module built its own engine from ``DATABASE_URL`` in the
process environment, which diverged from the engine in
``backend.app.api.database`` (configured from settings/.env at startup). That
split meant the auth router (get_session) and the repositories (async_session)
could talk to *different* databases — registration would write to one and
lookups would read from another.

To avoid that, ``async_session`` now delegates to the one factory configured in
``backend.app.api.database`` (which ``reconfigure()`` updates at startup, and
which is built from settings on import for standalone scripts).
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession


def async_session() -> AsyncSession:
    """Return a new AsyncSession from the app's single configured factory."""
    # Lazy import avoids a circular import at module load time.
    from backend.app.api.database import async_session_factory

    return async_session_factory()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for providing a database session."""
    async with async_session() as session:
        yield session
