"""
KerjaCerdas ORM Models
==========================
SQLAlchemy 2.0 declarative model for the **auth** layer only.

IMPORTANT: All business-domain models (SeekerProfile, JobPosting, Employer,
Application, etc.) live in `backend.app.db.schemas` (Pydantic) and are
persisted by `backend.app.db.json_store` (JSON files in dev mode).

Only the `User` model needs SQLAlchemy because the auth router validates
JWT tokens by querying the SQLite/Postgres `users` table. Everything else
goes through the JSON store.

ANTIGRAVITY PROTOCOL Section 7: PostgreSQL 15 for production.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.api.database import Base


def _utcnow() -> datetime:
    """Return timezone-aware UTC now."""
    return datetime.now(timezone.utc)


def _uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


class User(Base):
    """
    Core user table - supports seeker and employer roles.
    Password is stored as a bcrypt hash (never plaintext).
    All extended profile data (skills, jobs, applications) lives in the
    JSON store (`db/json_store.py`) keyed on `User.id`.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # 'seeker' | 'employer'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )
