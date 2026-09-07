"""Add job_pack_parse_cache table for server-side job-pack parse dedup

JobPackUploader's client_ref is a hash of the parsed posting content
(title/region/salary/local_id). Retrying an upload of the identical PDF —
lost response, reloaded tab, a different browser or device — must return
the exact same parsed postings as the first attempt, because Gemini
extraction isn't perfectly deterministic even at low temperature: a
reworded title or reformatted salary on a second parse changes the hash,
and the backend then treats the retry as a brand-new posting instead of a
replay (see the client_ref uniqueness index in d5e9f3a7b210). A client-side
cache alone can't guarantee this — it can be cleared, expire, or simply not
exist on a different device — so the server itself now caches a parse by
sha256(employer_id + file bytes) and replays it verbatim on a repeat
upload of the same file, regardless of client state.

Revision ID: f7a1c5e9b432
Revises: e6f0a4b8c321
Create Date: 2026-09-08

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f7a1c5e9b432"
down_revision: Union[str, Sequence[str], None] = "e6f0a4b8c321"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "job_pack_parse_cache",
        sa.Column("cache_key", sa.String(length=64), primary_key=True),
        sa.Column("employer_id", sa.String(length=36), nullable=False),
        sa.Column("postings", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_job_pack_parse_cache_employer_id",
        "job_pack_parse_cache",
        ["employer_id"],
    )
    op.create_index(
        "ix_job_pack_parse_cache_created_at",
        "job_pack_parse_cache",
        ["created_at"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_job_pack_parse_cache_created_at", table_name="job_pack_parse_cache")
    op.drop_index("ix_job_pack_parse_cache_employer_id", table_name="job_pack_parse_cache")
    op.drop_table("job_pack_parse_cache")
