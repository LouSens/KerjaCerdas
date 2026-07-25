"""Dedupe seeker/employer rows sharing a user_id and enforce uniqueness

Keeps the most recently updated row per user_id (all duplicates verified to be
unreferenced copies from a double-seed), then adds the unique constraints that
the ORM models already declare so duplicates cannot recur.

Revision ID: 8f2c1d0aa001
Revises: 45d873583ae4
Create Date: 2026-07-25

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8f2c1d0aa001"
down_revision: Union[str, Sequence[str], None] = "45d873583ae4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DEDUPE = """
DELETE FROM {table} t
USING (
    SELECT id,
           row_number() OVER (
               PARTITION BY user_id
               ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
           ) AS rn
    FROM {table}
) ranked
WHERE t.id = ranked.id AND ranked.rn > 1;
"""


def upgrade() -> None:
    """Upgrade schema."""
    for table in ("seekers", "employers"):
        op.execute(_DEDUPE.format(table=table))
    # Idempotent: publishing's schema-sync step may have already created these
    # constraints in production, which made a plain CREATE crash on startup.
    op.execute(
        "ALTER TABLE seekers ADD CONSTRAINT uq_seekers_user_id UNIQUE (user_id);"
        if not _constraint_exists("uq_seekers_user_id")
        else "SELECT 1;"
    )
    op.execute(
        "ALTER TABLE employers ADD CONSTRAINT uq_employers_user_id UNIQUE (user_id);"
        if not _constraint_exists("uq_employers_user_id")
        else "SELECT 1;"
    )


def _constraint_exists(name: str) -> bool:
    conn = op.get_bind()
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM pg_constraint WHERE conname = :name"),
            {"name": name},
        ).scalar()
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_seekers_user_id", "seekers", type_="unique")
    op.drop_constraint("uq_employers_user_id", "employers", type_="unique")
