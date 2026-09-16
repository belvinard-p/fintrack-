"""add recurring value to transactionsource enum

Revision ID: c8f6ea602e4f
Revises: 2bd9a9080a49
Create Date: 2026-09-16 12:46:35.982890

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8f6ea602e4f'
down_revision: Union[str, Sequence[str], None] = '2bd9a9080a49'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE transactionsource ADD VALUE IF NOT EXISTS 'recurring'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres does not support removing a value from an existing enum type
    # directly; downgrading this would require recreating the type and is
    # intentionally left as a no-op.
    pass
