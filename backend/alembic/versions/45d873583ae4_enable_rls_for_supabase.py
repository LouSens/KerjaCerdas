"""Enable RLS for Supabase

Revision ID: 45d873583ae4
Revises: 3ec45615212f
Create Date: 2026-07-19 19:07:49.652194

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '45d873583ae4'
down_revision: Union[str, Sequence[str], None] = '3ec45615212f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    tables = [
        "ai_logs", "applications", "conversations", "courses",
        "employers", "events", "gamification", "jobs",
        "matches", "seekers", "skill_gaps", "users", "alembic_version"
    ]
    for table in tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")


def downgrade() -> None:
    """Downgrade schema."""
    tables = [
        "ai_logs", "applications", "conversations", "courses",
        "employers", "events", "gamification", "jobs",
        "matches", "seekers", "skill_gaps", "users", "alembic_version"
    ]
    for table in tables:
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
