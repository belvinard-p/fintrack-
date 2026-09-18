"""create monthly_incomes table

Revision ID: a1b2c3d4e5f6
Revises: c8f6ea602e4f
Create Date: 2026-09-18 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c8f6ea602e4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'monthly_incomes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('month', sa.String(length=7), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'month', name='uq_monthly_income_user_month'),
    )
    op.create_index(op.f('ix_monthly_incomes_id'), 'monthly_incomes', ['id'], unique=False)
    op.create_index(op.f('ix_monthly_incomes_user_id'), 'monthly_incomes', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_monthly_incomes_user_id'), table_name='monthly_incomes')
    op.drop_index(op.f('ix_monthly_incomes_id'), table_name='monthly_incomes')
    op.drop_table('monthly_incomes')
