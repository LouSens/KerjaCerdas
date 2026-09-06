"""Dedupe (job_id, seeker_id) application rows and enforce uniqueness

apply_to_job and save_job both do a check-then-insert (read "no existing
application", then insert) with no transaction or DB constraint tying them
together, so two concurrent requests can each observe "not applied yet" and
insert their own row for the same (job, seeker) pair. Keeps the row that best
reflects real progress (a non-saved status beats a bare bookmark; ties broken
by most recently updated), then adds the constraint so duplicates cannot recur.

Revision ID: b3c7d1e9f204
Revises: 9a1b2c3d4e5f
Create Date: 2026-09-06

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b3c7d1e9f204"
down_revision: Union[str, Sequence[str], None] = "9a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DEDUPE = """
DELETE FROM applications a
USING (
    SELECT id,
           row_number() OVER (
               PARTITION BY job_id, seeker_id
               ORDER BY
                   (status <> 'saved') DESC,
                   updated_at DESC NULLS LAST,
                   created_at DESC NULLS LAST,
                   id
           ) AS rn
    FROM applications
) ranked
WHERE a.id = ranked.id AND ranked.rn > 1;
"""


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(_DEDUPE)
    # Idempotent: publishing's schema-sync step may have already created this
    # constraint, which made a plain CREATE crash on startup (see the
    # equivalent seekers/employers migration this one mirrors).
    op.execute(
        "ALTER TABLE applications ADD CONSTRAINT uq_application_job_seeker "
        "UNIQUE (job_id, seeker_id);"
        if not _constraint_exists("uq_application_job_seeker")
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
    op.drop_constraint("uq_application_job_seeker", "applications", type_="unique")
