from decimal import Decimal
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.goal import GoalAllocation
from app.models.monthly_income import MonthlyIncome


def total_allocated(
    db: Session,
    user_id: int,
    month: str,
    exclude_budget_id: Optional[int] = None,
    exclude_allocation_id: Optional[int] = None,
) -> Decimal:
    """Sum of everything already assigned a job this month: budget category
    limits plus planned goal allocations."""
    budgets_query = db.query(func.coalesce(func.sum(Budget.monthly_limit), 0)).filter(
        Budget.user_id == user_id, Budget.month == month
    )
    if exclude_budget_id is not None:
        budgets_query = budgets_query.filter(Budget.id != exclude_budget_id)

    allocations_query = db.query(func.coalesce(func.sum(GoalAllocation.amount), 0)).filter(
        GoalAllocation.user_id == user_id, GoalAllocation.month == month
    )
    if exclude_allocation_id is not None:
        allocations_query = allocations_query.filter(GoalAllocation.id != exclude_allocation_id)

    return Decimal(budgets_query.scalar()) + Decimal(allocations_query.scalar())


def remaining_income(
    db: Session,
    user_id: int,
    month: str,
    exclude_budget_id: Optional[int] = None,
    exclude_allocation_id: Optional[int] = None,
) -> Optional[Decimal]:
    """Income left to assign this month, or None if no income was declared
    for this month (meaning there's no cap at all)."""
    income = (
        db.query(MonthlyIncome)
        .filter(MonthlyIncome.user_id == user_id, MonthlyIncome.month == month)
        .first()
    )
    if income is None:
        return None

    return Decimal(income.amount) - total_allocated(
        db, user_id, month, exclude_budget_id, exclude_allocation_id
    )
