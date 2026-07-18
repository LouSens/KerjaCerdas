"""
KerjaCerdas — Database Engine
==============================
Async SQLAlchemy engine and session factory for PostgreSQL.
Supports fallback to SQLite for demo/development mode.

ANTIGRAVITY PROTOCOL §7: Database = PostgreSQL 15 with pgvector.
"""
from __future__ import annotations

import logging

from sqlalchemy import event, inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.app.config.settings import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


# ---------------------------------------------------------------------------
# Engine factory — production uses asyncpg, dev/demo uses aiosqlite
# ---------------------------------------------------------------------------

def _build_engine(database_url: str):
    """
    Build the async SQLAlchemy engine from a database URL.

    Supports:
      - postgresql+asyncpg://...  (production)
      - sqlite+aiosqlite:///...   (demo / local development)
    """
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # asyncpg doesn't accept sslmode as a URL query param — strip it
    if "postgresql+asyncpg" in database_url and "sslmode" in database_url:
        import urllib.parse
        parsed = urllib.parse.urlparse(database_url)
        qs = {k: v for k, v in urllib.parse.parse_qsl(parsed.query) if k != "sslmode"}
        database_url = urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(qs)))

    # SQLite needs special handling for async + foreign keys
    is_sqlite = "sqlite" in database_url
    connect_args = {"check_same_thread": False} if is_sqlite else {}

    engine = create_async_engine(
        database_url,
        echo=False,
        future=True,
        connect_args=connect_args,
    )

    if is_sqlite:
        @event.listens_for(engine.sync_engine, "connect")
        def _enable_fk(dbapi_conn, _):
            """Enable foreign key support for SQLite."""
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


# ---------------------------------------------------------------------------
# Default engine + session (created lazily on first import / startup)
# ---------------------------------------------------------------------------

# Build from settings (reads .env) so the engine is correct even before the
# startup lifespan calls reconfigure() — and so standalone scripts that import
# this module pick up the same database (e.g. SQLite in dev).
engine = _build_engine(settings.effective_database_url)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def reconfigure(database_url: str) -> None:
    """
    Reconfigure the engine at runtime (called during app startup).

    Args:
        database_url: Full database connection string.
    """
    global engine, async_session_factory
    engine = _build_engine(database_url)
    async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    logger.info(f"Database engine reconfigured → {database_url.split('@')[-1] if '@' in database_url else database_url}")


async def get_session():
    """FastAPI dependency that yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


def _get_table_columns(sync_conn, table_name: str) -> set[str]:
    """Return the set of column names for a table if it exists."""
    inspector = inspect(sync_conn)
    if table_name not in inspector.get_table_names():
        return set()
    return {column["name"] for column in inspector.get_columns(table_name)}


async def _migrate_verification_logs_schema(conn) -> None:
    """Rename the legacy verification column to the generic hash name."""
    column_names = await conn.run_sync(_get_table_columns, "verification_logs")
    if "zk_commitment" in column_names and "verification_hash" not in column_names:
        await conn.execute(
            text(
                "ALTER TABLE verification_logs "
                "RENAME COLUMN zk_commitment TO verification_hash"
            )
        )
        logger.info("Migrated verification_logs.zk_commitment to verification_hash")


async def init_db() -> None:
    """Create all tables. Called once during application startup."""
    # Import models here so their metadata is registered before create_all.
    # db/models.py defines its own Base; use that one (it owns the ORM tables).
    from backend.app.db.models import Base as ModelsBase  # noqa: PLC0415

    is_sqlite = str(engine.url).startswith("sqlite")
    async with engine.begin() as conn:
        # pgvector: activate the extension before create_all attempts to
        # define VECTOR columns. Mirrors what the Alembic initial migration
        # already does (see alembic/versions/5a748883f1d9_initial_schema.py).
        # Skipped for SQLite (unit tests / demo mode) which has no extensions.
        if not is_sqlite:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(ModelsBase.metadata.create_all)
        await _migrate_verification_logs_schema(conn)
    logger.info("✅ Database tables created / verified")
