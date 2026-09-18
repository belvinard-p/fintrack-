from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import log_action
from app.models.user import User
from app.models.budget import Budget
from app.models.category import Category
from app.models.monthly_income import MonthlyIncome
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetOut, BudgetStatus, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _ensure_within_income(
    db: Session,
    user_id: int,
    month: str,
    new_limit: Decimal,
    exclude_budget_id: int | None = None,
) -> None:
    income = (
        db.query(MonthlyIncome)
        .filter(MonthlyIncome.user_id == user_id, MonthlyIncome.month == month)
        .first()
    )
    if income is None:
        return

    others_query = db.query(func.coalesce(func.sum(Budget.monthly_limit), 0)).filter(
        Budget.user_id == user_id, Budget.month == month
    )
    if exclude_budget_id is not None:
        others_query = others_query.filter(Budget.id != exclude_budget_id)

    remaining = Decimal(income.amount) - Decimal(others_query.scalar())
    if new_limit > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Budget exceeds the income left to budget for {month} ({max(remaining, Decimal('0')):.2f} left)",
        )


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=BudgetOut, responses={404: {"description": "Category not found"}, 400: {"description": "A budget for this category and month already exists"}})
def create_budget(
    budget_in: BudgetCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    category = db.query(Category).filter(Category.id == budget_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    _ensure_within_income(db, current_user.id, budget_in.month, budget_in.monthly_limit)

    new_budget = Budget(
        user_id=current_user.id,
        category_id=budget_in.category_id,
        monthly_limit=budget_in.monthly_limit,
        month=budget_in.month,

    )
    db.add(new_budget)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A budget for this category and month already exists",
        )
    db.refresh(new_budget)

    return BudgetOut(
        id=new_budget.id,
        category_id=new_budget.category_id,
        category_name=category.name,
        monthly_limit=new_budget.monthly_limit,
        month=new_budget.month,
    )


@router.patch(
    "/{budget_id}",
    response_model=BudgetOut,
    responses={
        404: {"description": "Budget or category not found"},
        400: {"description": "A budget for this category and month already exists"},
    },
)
def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == current_user.id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    update_data = budget_in.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    if "monthly_limit" in update_data or "month" in update_data:
        _ensure_within_income(
            db,
            current_user.id,
            update_data.get("month", budget.month),
            update_data.get("monthly_limit", budget.monthly_limit),
            exclude_budget_id=budget.id,
        )

    for field, value in update_data.items():
        setattr(budget, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A budget for this category and month already exists",
        )
    db.refresh(budget)

    return BudgetOut(
        id=budget.id,
        category_id=budget.category_id,
        category_name=budget.category.name,
        monthly_limit=budget.monthly_limit,
        month=budget.month,
    )


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": "Budget not found"}},
)
def delete_budget(
    budget_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == current_user.id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    log_action(
        db,
        current_user.id,
        "delete_budget",
        f"{budget.category.name} — {budget.month} (limit {budget.monthly_limit})",
    )
    db.delete(budget)
    db.commit()


@router.get("/status", response_model=list[BudgetStatus])
def get_budget_status(
    month: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id, Budget.month == month)
        .all()
    )


    result = []
    for budget in budgets:
        spent = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.category_id == budget.category_id,
                Transaction.amount < 0,
                func.to_char(Transaction.date, "YYYY-MM") == month,
            )
            .scalar()
        ) or 0

        actual_spending = abs(spent)
        result.append(
            BudgetStatus(
                id=budget.id,
                category_id=budget.category_id,
                category_name=budget.category.name,
                monthly_limit=budget.monthly_limit,
                actual_spending=actual_spending,
                is_over_budget=actual_spending > budget.monthly_limit,
            )
        )

    return result