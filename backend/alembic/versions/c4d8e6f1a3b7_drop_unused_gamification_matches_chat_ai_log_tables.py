"""Drop unused gamification/matches/conversations/ai_logs tables

Revision ID: c4d8e6f1a3b7
Revises: 9a1b2c3d4e5f
Create Date: 2026-09-05

Removes four tables with zero live consumers, found during a dead-code
audit:
  - gamification: the product decision to cut gamification predates this
    migration (frontend/src/store/useStore.js's own changelog says
    "Gamification completely removed (3.1)"), but the backend kept writing
    an XP/badge row on every profile save and job application for a feature
    nothing ever displayed.
  - matches: a per-request match-result cache table that was never read or
    written anywhere — match results are computed and returned per-request,
    never persisted here.
  - conversations: a chat-session table with zero reads or writes anywhere
    in the codebase — inert scaffolding.
  - ai_logs: an LLM-observability table with zero reads or writes anywhere
    — no instrumentation was ever wired up to populate it.
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4d8e6f1a3b7"
down_revision: Union[str, Sequence[str], None] = "9a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_index(op.f("ix_matches_subject_id"), table_name="matches")
    op.drop_table("matches")
    op.drop_index(op.f("ix_gamification_seeker_id"), table_name="gamification")
    op.drop_table("gamification")
    op.drop_index(op.f("ix_conversations_user_id"), table_name="conversations")
    op.drop_table("conversations")
    op.drop_table("ai_logs")


def downgrade() -> None:
    """Downgrade schema.

    Recreates the schema exactly as it stood at down_revision 9a1b2c3d4e5f:
    plain `sa.JSON()` (not JSONB) for the four JSON-typed columns below —
    migration 3ec45615212f converted them from JSONB to JSON — and no
    server_default on created_at/updated_at, matching the original
    5a748883f1d9 create_table calls, which none of the migrations between
    that revision and this one's down_revision ever added. Also re-enables
    RLS on all four tables at the end: migration 45d873583ae4 enabled it on
    every table (this one's upgrade() drops the tables, RLS state and all),
    and a fresh CREATE TABLE does not have it enabled by default.
    """
    op.create_table(
        "ai_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("request_id", sa.String(length=100), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("role", sa.String(length=100), nullable=False),
        sa.Column("task", sa.String(length=100), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("tokens_in", sa.Integer(), nullable=False),
        sa.Column("tokens_out", sa.Integer(), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("flagged", sa.Boolean(), nullable=False),
        sa.Column("rating", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("seeker_id", sa.String(length=36), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("messages", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_conversations_user_id"), "conversations", ["user_id"], unique=False)
    op.create_table(
        "gamification",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("seeker_id", sa.String(length=36), nullable=False),
        sa.Column("xp", sa.Integer(), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("streak_days", sa.Integer(), nullable=False),
        sa.Column("badges", sa.JSON(), nullable=False),
        sa.Column("quests_completed", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_gamification_seeker_id"), "gamification", ["seeker_id"], unique=False)
    op.create_table(
        "matches",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("subject_kind", sa.String(length=20), nullable=False),
        sa.Column("subject_id", sa.String(length=36), nullable=False),
        sa.Column("top_k", sa.Integer(), nullable=False),
        sa.Column("results", sa.JSON(), nullable=False),
        sa.Column("embedding_model", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_matches_subject_id"), "matches", ["subject_id"], unique=False)

    for table in ("ai_logs", "conversations", "gamification", "matches"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
