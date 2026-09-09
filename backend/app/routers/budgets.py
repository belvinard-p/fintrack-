from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetOut, BudgetStatus

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=BudgetOut, responses={404: {"description": "Category not found"}, 400: {"description": "A budget for this category and month already exists"}})
def create_budget(
    budget_in: BudgetCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    category = db.query(Category).filter(Category.id == budget_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

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
                func.to_char(Transaction.date, "YYYY-MM") == month,
            )
            .scalar()
        ) or 0

        actual_spending = abs(spent)
        result.append(
            BudgetStatus(
                category_id=budget.category_id,
                category_name=budget.category.name,
                monthly_limit=budget.monthly_limit,
                actual_spending=actual_spending,
                is_over_budget=actual_spending > budget.monthly_limit,
            )
        )

    return result