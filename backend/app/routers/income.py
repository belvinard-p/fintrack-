from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Path
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.budget import Budget
from app.models.monthly_income import MonthlyIncome
from app.models.user import User
from app.schemas.income import MonthlyIncomeOut, MonthlyIncomeSet

router = APIRouter(prefix="/income", tags=["income"])

MonthPath = Annotated[str, Path(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")]


def build_income_out(db: Session, user_id: int, month: str) -> MonthlyIncomeOut:
    income = (
        db.query(MonthlyIncome)
        .filter(MonthlyIncome.user_id == user_id, MonthlyIncome.month == month)
        .first()
    )
    amount = Decimal(income.amount) if income else Decimal("0")
    total_budgeted = Decimal(
        db.query(func.coalesce(func.sum(Budget.monthly_limit), 0))
        .filter(Budget.user_id == user_id, Budget.month == month)
        .scalar()
    )
    remaining = amount - total_budgeted
    return MonthlyIncomeOut(
        month=month,
        amount=amount,
        is_set=income is not None,
        total_budgeted=total_budgeted,
        remaining=remaining,
        is_over_allocated=remaining < 0,
    )


@router.get("/{month}", response_model=MonthlyIncomeOut)
def get_monthly_income(
    month: MonthPath,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return build_income_out(db, current_user.id, month)


@router.put("/{month}", response_model=MonthlyIncomeOut)
def set_monthly_income(
    month: MonthPath,
    payload: MonthlyIncomeSet,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    income = (
        db.query(MonthlyIncome)
        .filter(MonthlyIncome.user_id == current_user.id, MonthlyIncome.month == month)
        .first()
    )
    if income:
        income.amount = payload.amount
    else:
        db.add(MonthlyIncome(user_id=current_user.id, month=month, amount=payload.amount))
    db.commit()
    return build_income_out(db, current_user.id, month)
