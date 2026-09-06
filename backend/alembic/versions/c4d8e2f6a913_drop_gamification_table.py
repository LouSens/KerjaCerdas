"""Drop gamification table

Revision ID: c4d8e2f6a913
Revises: b3c7d1e9f204
Create Date: 2026-09-06

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4d8e2f6a913"
down_revision: Union[str, Sequence[str], None] = "b3c7d1e9f204"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_index(op.f("ix_gamification_seeker_id"), table_name="gamification")
    op.drop_table("gamification")


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table(
        "gamification",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("seeker_id", sa.String(length=36), nullable=False),
        sa.Column("xp", sa.Integer(), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("streak_days", sa.Integer(), nullable=False),
        sa.Column("badges", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("quests_completed", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_gamification_seeker_id"), "gamification", ["seeker_id"], unique=False)
    op.execute("ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;")
