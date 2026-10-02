"""create debts and debt_payments tables

Revision ID: 39e01a5e3efe
Revises: d4e5f6a7b8c9
Create Date: 2026-10-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '39e01a5e3efe'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'debts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column(
            'type',
            sa.Enum('loan', 'credit_card', 'other', name='debttype'),
            nullable=False,
            server_default='other',
        ),
        sa.Column('principal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('annual_rate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_debts_id'), 'debts', ['id'], unique=False)
    op.create_index(op.f('ix_debts_user_id'), 'debts', ['user_id'], unique=False)

    op.create_table(
        'debt_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('debt_id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('principal_portion', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('interest_portion', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['debt_id'], ['debts.id']),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('transaction_id', name='uq_debt_payments_transaction_id'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_debt_payments_id'), 'debt_payments', ['id'], unique=False)
    op.create_index(op.f('ix_debt_payments_user_id'), 'debt_payments', ['user_id'], unique=False)
    op.create_index(op.f('ix_debt_payments_debt_id'), 'debt_payments', ['debt_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_debt_payments_debt_id'), table_name='debt_payments')
    op.drop_index(op.f('ix_debt_payments_user_id'), table_name='debt_payments')
    op.drop_index(op.f('ix_debt_payments_id'), table_name='debt_payments')
    op.drop_table('debt_payments')
    op.drop_index(op.f('ix_debts_user_id'), table_name='debts')
    op.drop_index(op.f('ix_debts_id'), table_name='debts')
    op.drop_table('debts')
    sa.Enum(name='debttype').drop(op.get_bind(), checkfirst=True)
