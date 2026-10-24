from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.budget import Budget
from app.models.category import Category
from app.models.debt import Debt, DebtPayment
from app.models.goal import Goal, GoalAllocation, GoalContribution
from app.models.monthly_income import MonthlyIncome
from app.models.recurring_transaction import RecurringTransaction
from app.models.transaction import Transaction
from app.models.user import User


def delete_user_and_data(db: Session, user: User) -> None:
    """Delete a user and every row that belongs to them, children before parents.

    Used by account deletion and by the demo cleanup. The order matters: each table below holds a foreign key to a table
    deleted after it, so reordering these lines would make the delete fail on a constraint. Does not commit.
    """
    user_id = user.id
    for model in (
        DebtPayment,
        GoalContribution,
        GoalAllocation,
        RecurringTransaction,
        Transaction,
        Goal,
        Debt,
        MonthlyIncome,
        Budget,
        Account,
        AuditLog,
    ):
        db.query(model).filter(model.user_id == user_id).delete(synchronize_session=False)
    # Default categories (user_id NULL) are shared and must stay: only this user's own categories go.
    db.query(Category).filter(Category.user_id == user_id).delete(synchronize_session=False)
    db.delete(user)
