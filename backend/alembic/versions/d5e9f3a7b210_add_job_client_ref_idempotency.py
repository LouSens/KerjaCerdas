"""Add jobs.client_ref idempotency token and partial unique index

createEmployerJob (used by both the manual "Pasang Lowongan" form and the
job-pack confirm-and-publish batch) has no idempotency protection: if a
create request is retried after its response was lost — a timeout, a
dropped connection, anything short of the client observing a definitive
failure — the retry is a second, non-idempotent insert, producing a
duplicate published vacancy under a separate id. client_ref is an optional
client-supplied token; a partial unique index on (employer_id, client_ref)
lets create_job detect a replay and return the already-created job instead
of inserting a duplicate, without affecting rows that never set it (NULLs
are not considered equal by a unique index, so the ordinary create path is
unaffected).

Revision ID: d5e9f3a7b210
Revises: c4d8e2f6a913
Create Date: 2026-09-08

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d5e9f3a7b210"
down_revision: Union[str, Sequence[str], None] = "c4d8e2f6a913"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    if not _column_exists("jobs", "client_ref"):
        op.add_column("jobs", sa.Column("client_ref", sa.String(length=64), nullable=True))
    # Idempotent: publishing's schema-sync step may already have created
    # this index (same reasoning as the applications/seekers/employers
    # migrations this one mirrors) — a plain CREATE would crash on startup.
    if not _index_exists("uq_job_employer_client_ref"):
        op.execute(
            "CREATE UNIQUE INDEX uq_job_employer_client_ref "
            "ON jobs (employer_id, client_ref) "
            "WHERE client_ref IS NOT NULL;"
        )


def _column_exists(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _index_exists(name: str) -> bool:
    conn = op.get_bind()
    return bool(
        conn.execute(
            sa.text("SELECT 1 FROM pg_class WHERE relname = :name"),
            {"name": name},
        ).scalar()
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS uq_job_employer_client_ref;")
    op.drop_column("jobs", "client_ref")
