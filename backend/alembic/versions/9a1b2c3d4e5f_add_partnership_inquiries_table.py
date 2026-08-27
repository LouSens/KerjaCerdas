"""Add partnership_inquiries table

Revision ID: 9a1b2c3d4e5f
Revises: 8f2c1d0aa001
Create Date: 2026-08-27

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9a1b2c3d4e5f"
down_revision: Union[str, Sequence[str], None] = "8f2c1d0aa001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "partnership_inquiries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("organization", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_partnership_inquiries_category"),
        "partnership_inquiries",
        ["category"],
        unique=False,
    )
    op.create_index(
        op.f("ix_partnership_inquiries_email"),
        "partnership_inquiries",
        ["email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_partnership_inquiries_status"),
        "partnership_inquiries",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_partnership_inquiries_status"), table_name="partnership_inquiries")
    op.drop_index(op.f("ix_partnership_inquiries_email"), table_name="partnership_inquiries")
    op.drop_index(op.f("ix_partnership_inquiries_category"), table_name="partnership_inquiries")
    op.drop_table("partnership_inquiries")
