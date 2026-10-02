"""add goal_contribution value to transactionsource enum

Revision ID: 67c11a7aea48
Revises: aaccd680181f
Create Date: 2026-10-02 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '67c11a7aea48'
down_revision: Union[str, Sequence[str], None] = 'aaccd680181f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE transactionsource ADD VALUE IF NOT EXISTS 'goal_contribution'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres does not support removing a value from an existing enum type
    # directly; downgrading this would require recreating the type and is
    # intentionally left as a no-op.
    pass
