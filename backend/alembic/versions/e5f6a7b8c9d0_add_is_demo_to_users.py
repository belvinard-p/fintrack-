"""add is_demo to users

Revision ID: e5f6a7b8c9d0
Revises: 67c11a7aea48
Create Date: 2026-10-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = '67c11a7aea48'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Existing accounts are real accounts: they get false.
    op.add_column('users', sa.Column('is_demo', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index(op.f('ix_users_is_demo'), 'users', ['is_demo'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_is_demo'), table_name='users')
    op.drop_column('users', 'is_demo')
