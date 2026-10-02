from datetime import date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.monthly_income import MonthlyIncome
from app.schemas.dashboard import (
    CategorySpending,
    MonthlySpending,
    MonthlySummary,
    MonthlyBreakdownItem,
    PeriodTotals,
    YearlySummary,
)

router = APIRouter(prefix="/transactions/dashboard", tags=["dashboard"])

SPENDING_OVER_TIME_MONTHS = 12


def _months_ago_first_day(months: int) -> date:
    today = date.today()
    month_index = today.year * 12 + (today.month - 1) - months
    year, month = divmod(month_index, 12)
    return date(year, month + 1, 1)


def _month_expenses(db: Session, user_id: int, year: int, month: int) -> tuple[Decimal, int]:
    row = (
        db.query(
            func.coalesce(func.sum(Transaction.amount), 0),
            func.count(Transaction.id),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.amount < 0,
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == month,
        )
        .one()
    )
    return abs(Decimal(row[0])), row[1]


def _declared_income(db: Session, user_id: int, year: int, month: int) -> Decimal | None:
    income = (
        db.query(MonthlyIncome)
        .filter(MonthlyIncome.user_id == user_id, MonthlyIncome.month == f"{year}-{month:02d}")
        .first()
    )
    return Decimal(income.amount) if income else None


def _expenses_by_category(db: Session, current_user: User, extra_filter) -> list[CategorySpending]:
    by_category = (
        db.query(
            Transaction.category_id,
            Category.name.label("category_name"),
            func.sum(Transaction.amount).label("total"),
        )
        .outerjoin(Category, Transaction.category_id == Category.id)
        .filter(Transaction.user_id == current_user.id, Transaction.amount < 0, extra_filter)
        .group_by(Transaction.category_id, Category.name)
        .all()
    )
    return sorted(
        [
            CategorySpending(
                category_id=r.category_id,
                category_name=r.category_name or "Uncategorized",
                total=abs(r.total),
            )
            for r in by_category
        ],
        key=lambda c: c.total,
        reverse=True,
    )


@router.get("/by-category", response_model=list[CategorySpending])
def spending_by_category(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    results = (
        db.query(
            Transaction.category_id,
            Category.name.label("category_name"),
            func.sum(Transaction.amount).label("total"),
        )
        .outerjoin(Category, Transaction.category_id == Category.id)
        .filter(Transaction.user_id == current_user.id)
        .group_by(Transaction.category_id, Category.name)
        .all()
    )

    return [
        CategorySpending(
            category_id=r.category_id,
            category_name=r.category_name or "Uncategorized",
            total=abs(r.total),
        )
        for r in results
    ]


@router.get("/by-month", response_model=list[MonthlySpending])
def spending_by_month(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    cutoff = _months_ago_first_day(SPENDING_OVER_TIME_MONTHS - 1)

    results = (
        db.query(
            extract("year", Transaction.date).label("year"),
            extract("month", Transaction.date).label("month"),
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.amount < 0,
            Transaction.date >= cutoff,
        )
        .group_by(extract("year", Transaction.date), extract("month", Transaction.date))
        .order_by(extract("year", Transaction.date), extract("month", Transaction.date))
        .all()
    )

    return [
        MonthlySpending(
            month=f"{int(r.year)}-{int(r.month):02d}",
            total=abs(r.total),
        )
        for r in results
    ]


@router.get("/monthly-summary", response_model=MonthlySummary)
def monthly_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    month: Annotated[str, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")],
):
    year, month_number = int(month[:4]), int(month[5:])
    prev_year, prev_month = (year - 1, 12) if month_number == 1 else (year, month_number - 1)

    declared = _declared_income(db, current_user.id, year, month_number)
    income = declared or Decimal("0")
    expenses, count = _month_expenses(db, current_user.id, year, month_number)
    prev_income = _declared_income(db, current_user.id, prev_year, prev_month) or Decimal("0")
    prev_expenses, _ = _month_expenses(db, current_user.id, prev_year, prev_month)

    return MonthlySummary(
        month=month,
        income_set=declared is not None,
        total_income=income,
        total_expenses=expenses,
        net=income - expenses,
        savings_rate=((income - expenses) / income * 100).quantize(Decimal("0.1")) if income > 0 else None,
        transaction_count=count,
        previous=PeriodTotals(
            total_income=prev_income,
            total_expenses=prev_expenses,
            net=prev_income - prev_expenses,
        ),
        expenses_by_category=_expenses_by_category(
            db,
            current_user,
            (extract("year", Transaction.date) == year) & (extract("month", Transaction.date) == month_number),
        ),
    )


@router.get("/yearly-summary", response_model=YearlySummary)
def yearly_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    year: Annotated[str, Query(pattern=r"^\d{4}$")],
):
    year_number = int(year)
    prev_year_number = year_number - 1

    monthly_breakdown = []
    total_income = Decimal("0")
    total_expenses = Decimal("0")
    total_count = 0
    income_set_months = 0
    for month_number in range(1, 13):
        declared = _declared_income(db, current_user.id, year_number, month_number)
        expenses, count = _month_expenses(db, current_user.id, year_number, month_number)
        income = declared or Decimal("0")
        if declared is not None:
            income_set_months += 1
        total_income += income
        total_expenses += expenses
        total_count += count
        monthly_breakdown.append(
            MonthlyBreakdownItem(month=f"{year_number}-{month_number:02d}", income=income, expenses=expenses)
        )

    prev_total_income = Decimal("0")
    prev_total_expenses = Decimal("0")
    for month_number in range(1, 13):
        prev_total_income += _declared_income(db, current_user.id, prev_year_number, month_number) or Decimal("0")
        prev_expenses, _ = _month_expenses(db, current_user.id, prev_year_number, month_number)
        prev_total_expenses += prev_expenses

    return YearlySummary(
        year=year,
        income_set_months=income_set_months,
        total_income=total_income,
        total_expenses=total_expenses,
        net=total_income - total_expenses,
        savings_rate=((total_income - total_expenses) / total_income * 100).quantize(Decimal("0.1"))
        if total_income > 0
        else None,
        transaction_count=total_count,
        previous=PeriodTotals(
            total_income=prev_total_income,
            total_expenses=prev_total_expenses,
            net=prev_total_income - prev_total_expenses,
        ),
        expenses_by_category=_expenses_by_category(
            db, current_user, extract("year", Transaction.date) == year_number
        ),
        monthly_breakdown=monthly_breakdown,
    )
