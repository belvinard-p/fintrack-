"""rename goal current_amount to opening_amount, create goal_allocations and goal_contributions tables

Revision ID: aaccd680181f
Revises: 1ed8935f1fcd
Create Date: 2026-10-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'aaccd680181f'
down_revision: Union[str, Sequence[str], None] = '1ed8935f1fcd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('goals', 'current_amount', new_column_name='opening_amount')

    op.create_table(
        'goal_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('month', sa.String(length=7), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id']),
        sa.UniqueConstraint('user_id', 'goal_id', 'month', name='uq_goal_allocation_user_goal_month'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_goal_allocations_id'), 'goal_allocations', ['id'], unique=False)
    op.create_index(op.f('ix_goal_allocations_user_id'), 'goal_allocations', ['user_id'], unique=False)
    op.create_index(op.f('ix_goal_allocations_goal_id'), 'goal_allocations', ['goal_id'], unique=False)

    op.create_table(
        'goal_contributions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id']),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('transaction_id', name='uq_goal_contributions_transaction_id'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_goal_contributions_id'), 'goal_contributions', ['id'], unique=False)
    op.create_index(op.f('ix_goal_contributions_user_id'), 'goal_contributions', ['user_id'], unique=False)
    op.create_index(op.f('ix_goal_contributions_goal_id'), 'goal_contributions', ['goal_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_goal_contributions_goal_id'), table_name='goal_contributions')
    op.drop_index(op.f('ix_goal_contributions_user_id'), table_name='goal_contributions')
    op.drop_index(op.f('ix_goal_contributions_id'), table_name='goal_contributions')
    op.drop_table('goal_contributions')

    op.drop_index(op.f('ix_goal_allocations_goal_id'), table_name='goal_allocations')
    op.drop_index(op.f('ix_goal_allocations_user_id'), table_name='goal_allocations')
    op.drop_index(op.f('ix_goal_allocations_id'), table_name='goal_allocations')
    op.drop_table('goal_allocations')

    op.alter_column('goals', 'opening_amount', new_column_name='current_amount')
