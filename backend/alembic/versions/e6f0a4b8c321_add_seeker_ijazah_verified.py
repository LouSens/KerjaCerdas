"""Add seekers.ijazah_verified so education verification survives reload

/verify/education never persisted anything: it only ran a stateless format
check and returned a response. The frontend held the "verified" flag in
local component state only, so a page reload (or navigating away and back)
always showed the item as incomplete again even after a successful check,
and the trust score reverted with it. This mirrors the existing
nik_verified column/flow so the result is actually saved.

Revision ID: e6f0a4b8c321
Revises: d5e9f3a7b210
Create Date: 2026-09-08

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e6f0a4b8c321"
down_revision: Union[str, Sequence[str], None] = "d5e9f3a7b210"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "seekers",
        sa.Column("ijazah_verified", sa.String(length=20), nullable=False, server_default="unverified"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("seekers", "ijazah_verified")
