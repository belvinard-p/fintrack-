"""create accounts table and backfill account_id on transactions/recurring_transactions

Revision ID: d4e5f6a7b8c9
Revises: b7c8d9e0f1a2
Create Date: 2026-10-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the accounts table.
    op.create_table(
        'accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column(
            'type',
            sa.Enum('checking', 'savings', 'cash', 'other', name='accounttype'),
            nullable=False,
            server_default='other',
        ),
        sa.Column('opening_balance', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_accounts_id'), 'accounts', ['id'], unique=False)
    op.create_index(op.f('ix_accounts_user_id'), 'accounts', ['user_id'], unique=False)

    # 2. Add account_id as NULLABLE for now on both transaction tables — a per-row
    #    backfill (step 3) has to run before we can tighten it to NOT NULL (step 4).
    op.add_column('transactions', sa.Column('account_id', sa.Integer(), nullable=True))
    op.add_column('recurring_transactions', sa.Column('account_id', sa.Integer(), nullable=True))

    op.create_foreign_key(
        'fk_transactions_account_id_accounts',
        'transactions', 'accounts', ['account_id'], ['id'],
    )
    op.create_foreign_key(
        'fk_recurring_transactions_account_id_accounts',
        'recurring_transactions', 'accounts', ['account_id'], ['id'],
    )
    op.create_index(op.f('ix_transactions_account_id'), 'transactions', ['account_id'], unique=False)
    op.create_index(
        op.f('ix_recurring_transactions_account_id'), 'recurring_transactions', ['account_id'], unique=False
    )

    # 3. Backfill.
    bind = op.get_bind()

    # 3a. Every user gets exactly one account if they don't already have one —
    #     including users with zero transactions, so "every user has >=1 account"
    #     holds immediately after this migration, not just lazily on next use.
    bind.execute(
        sa.text(
            """
            INSERT INTO accounts (user_id, name, type, opening_balance, created_at)
            SELECT u.id, 'Main account', 'other', 0, now()
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM accounts a WHERE a.user_id = u.id
            )
            """
        )
    )

    # 3b. Point every pre-existing transaction at its owner's (now guaranteed to
    #     exist) first account.
    bind.execute(
        sa.text(
            """
            UPDATE transactions t
            SET account_id = (
                SELECT a.id FROM accounts a
                WHERE a.user_id = t.user_id
                ORDER BY a.id
                LIMIT 1
            )
            WHERE t.account_id IS NULL
            """
        )
    )

    # 3c. Same for recurring_transactions.
    bind.execute(
        sa.text(
            """
            UPDATE recurring_transactions rt
            SET account_id = (
                SELECT a.id FROM accounts a
                WHERE a.user_id = rt.user_id
                ORDER BY a.id
                LIMIT 1
            )
            WHERE rt.account_id IS NULL
            """
        )
    )

    # 4. Now that every row is guaranteed non-null, enforce it at the schema level.
    op.alter_column('transactions', 'account_id', nullable=False)
    op.alter_column('recurring_transactions', 'account_id', nullable=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_recurring_transactions_account_id'), table_name='recurring_transactions')
    op.drop_index(op.f('ix_transactions_account_id'), table_name='transactions')
    op.drop_constraint('fk_recurring_transactions_account_id_accounts', 'recurring_transactions', type_='foreignkey')
    op.drop_constraint('fk_transactions_account_id_accounts', 'transactions', type_='foreignkey')
    op.drop_column('recurring_transactions', 'account_id')
    op.drop_column('transactions', 'account_id')
    op.drop_index(op.f('ix_accounts_user_id'), table_name='accounts')
    op.drop_index(op.f('ix_accounts_id'), table_name='accounts')
    op.drop_table('accounts')
    sa.Enum(name='accounttype').drop(op.get_bind(), checkfirst=True)
    # Downgrade intentionally does not try to restore the pre-migration NULL
    # account_id state — the data is gone once the column is dropped, mirroring
    # how c8f6ea602e4f treats its own data-bearing change as effectively
    # irreversible on downgrade.
