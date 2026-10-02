"""add debt_payment value to transactionsource enum

Revision ID: 1ed8935f1fcd
Revises: 39e01a5e3efe
Create Date: 2026-10-02 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1ed8935f1fcd'
down_revision: Union[str, Sequence[str], None] = '39e01a5e3efe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE transactionsource ADD VALUE IF NOT EXISTS 'debt_payment'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres does not support removing a value from an existing enum type
    # directly; downgrading this would require recreating the type and is
    # intentionally left as a no-op.
    pass
