import csv
from datetime import date
from io import StringIO
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from decimal import Decimal
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.categorization import categorize_transaction
from app.core.month_lock import is_locked_month, LOCKED_MONTH_DETAIL
from app.core.audit import log_action
from app.services.csv_import import parse_csv, CSVParseError
from app.services.pdf_export import generate_transactions_pdf
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.account import Account
from app.models.monthly_income import MonthlyIncome
from app.schemas.dashboard import (
    CategorySpending,
    MonthlySpending,
    MonthlySummary,
    MonthlyBreakdownItem,
    PeriodTotals,
    YearlySummary,
)
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionOut,
    TransactionListResponse,
)

router = APIRouter(prefix="/transactions", tags=["transactions"])

TRANSACTION_NOT_FOUND = "Transaction not found"
ACCOUNT_NOT_FOUND = "Account not found"


def _filtered_transactions_query(
    db: Session,
    current_user: User,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))
    if category_id is not None:
        query = query.filter(Transaction.category_id == category_id)
    if date_from is not None:
        query = query.filter(Transaction.date >= date_from)
    if date_to is not None:
        query = query.filter(Transaction.date <= date_to)

    return query


@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED, responses={400: {"description": LOCKED_MONTH_DETAIL}, 404: {"description": ACCOUNT_NOT_FOUND}})
def create_transaction(
    transaction_in: TransactionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if is_locked_month(transaction_in.date):
        raise HTTPException(status_code=400, detail=LOCKED_MONTH_DETAIL)

    account = (
        db.query(Account)
        .filter(Account.id == transaction_in.account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail=ACCOUNT_NOT_FOUND)

    transaction_data = transaction_in.model_dump()

    if transaction_data["category_id"] is None:
        category_name = categorize_transaction(transaction_data["description"])
        category = (
            db.query(Category)
            .filter(Category.user_id == current_user.id, Category.name == category_name)
            .first()
        )
        if category:
            transaction_data["category_id"] = category.id

    new_transaction = Transaction(
        **transaction_data,
        user_id=current_user.id,
    )
    db.add(new_transaction)
    log_action(
        db,
        current_user.id,
        "create_transaction",
        f"{new_transaction.date} — {new_transaction.description} ({new_transaction.amount})",
    )
    db.commit()
    db.refresh(new_transaction)
    return new_transaction



@router.get("/", response_model=TransactionListResponse)
def list_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    query = _filtered_transactions_query(db, current_user, search, category_id, date_from, date_to)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    items = (
        query.order_by(Transaction.date.desc(), Transaction.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TransactionListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/export")
def export_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    query = _filtered_transactions_query(db, current_user, search, category_id, date_from, date_to)
    transactions = query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()

    category_names = {
        c.id: c.name
        for c in db.query(Category).filter(Category.user_id == current_user.id).all()
    }

    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["date", "description", "amount", "category", "source"])
    for transaction in transactions:
        writer.writerow(
            [
                transaction.date.isoformat(),
                transaction.description,
                transaction.amount,
                category_names.get(transaction.category_id, ""),
                transaction.source.value,
            ]
        )

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.get("/export/pdf")
def export_transactions_pdf(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    lang: Annotated[str, Query(pattern=r"^(en|fr)$")] = "en",
):
    query = _filtered_transactions_query(db, current_user, search, category_id, date_from, date_to)
    transactions = query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()

    category_names = {
        c.id: c.name
        for c in db.query(Category).filter(Category.user_id == current_user.id).all()
    }

    months = {t.date.strftime("%Y-%m") for t in transactions}
    monthly_incomes = {
        income.month: Decimal(income.amount)
        for income in db.query(MonthlyIncome)
        .filter(MonthlyIncome.user_id == current_user.id, MonthlyIncome.month.in_(months))
        .all()
    }

    buffer = generate_transactions_pdf(
        transactions, category_names, current_user.email, monthly_incomes, lang
    )
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=transactions.pdf"},
    )


@router.get("/dashboard/by-category", response_model=list[CategorySpending])
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


SPENDING_OVER_TIME_MONTHS = 12


def _months_ago_first_day(months: int) -> date:
    today = date.today()
    month_index = today.year * 12 + (today.month - 1) - months
    year, month = divmod(month_index, 12)
    return date(year, month + 1, 1)


@router.get("/dashboard/by-month", response_model=list[MonthlySpending])
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


@router.get("/dashboard/monthly-summary", response_model=MonthlySummary)
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

    by_category = (
        db.query(
            Transaction.category_id,
            Category.name.label("category_name"),
            func.sum(Transaction.amount).label("total"),
        )
        .outerjoin(Category, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.amount < 0,
            extract("year", Transaction.date) == year,
            extract("month", Transaction.date) == month_number,
        )
        .group_by(Transaction.category_id, Category.name)
        .all()
    )

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
        expenses_by_category=sorted(
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
        ),
    )


@router.get("/dashboard/yearly-summary", response_model=YearlySummary)
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

    by_category = (
        db.query(
            Transaction.category_id,
            Category.name.label("category_name"),
            func.sum(Transaction.amount).label("total"),
        )
        .outerjoin(Category, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.amount < 0,
            extract("year", Transaction.date) == year_number,
        )
        .group_by(Transaction.category_id, Category.name)
        .all()
    )

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
        expenses_by_category=sorted(
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
        ),
        monthly_breakdown=monthly_breakdown,
    )


@router.get("/{transaction_id}", response_model=TransactionOut, responses={404: {"description": TRANSACTION_NOT_FOUND}})
def get_transaction(
    transaction_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail=TRANSACTION_NOT_FOUND)
    return transaction


@router.patch(
    "/{transaction_id}",
    response_model=TransactionOut,
    responses={404: {"description": TRANSACTION_NOT_FOUND}, 400: {"description": LOCKED_MONTH_DETAIL}},
)
def update_transaction(
    transaction_id: int,

    transaction_in: TransactionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail=TRANSACTION_NOT_FOUND)

    if is_locked_month(transaction.date):
        raise HTTPException(status_code=400, detail=LOCKED_MONTH_DETAIL)

    update_data = transaction_in.model_dump(exclude_unset=True)

    if "date" in update_data and is_locked_month(update_data["date"]):
        raise HTTPException(status_code=400, detail=LOCKED_MONTH_DETAIL)

    if "account_id" in update_data:
        account = (
            db.query(Account)
            .filter(Account.id == update_data["account_id"], Account.user_id == current_user.id)
            .first()
        )
        if not account:
            raise HTTPException(status_code=404, detail=ACCOUNT_NOT_FOUND)

    for field, value in update_data.items():
        setattr(transaction, field, value)

    log_action(
        db,
        current_user.id,
        "update_transaction",
        f"{transaction.date} — {transaction.description} ({transaction.amount})",
    )
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": TRANSACTION_NOT_FOUND}, 400: {"description": LOCKED_MONTH_DETAIL}},
)
def delete_transaction(
    transaction_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )

    if not transaction:
        raise HTTPException(status_code=404, detail=TRANSACTION_NOT_FOUND)

    if is_locked_month(transaction.date):
        raise HTTPException(status_code=400, detail=LOCKED_MONTH_DETAIL)

    log_action(
        db,
        current_user.id,
        "delete_transaction",
        f"{transaction.date} — {transaction.description} ({transaction.amount})",
    )
    db.delete(transaction)
    db.commit()


@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_csv(
    file: UploadFile,
    account_id: Annotated[int, Form()],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=400, detail=ACCOUNT_NOT_FOUND)

    content = await file.read()

    try:
        parse_result = parse_csv(content)
    except CSVParseError as e:
        raise HTTPException(status_code=400, detail=str(e))

    parsed_transactions = parse_result.transactions

    # Build a lookup of category name -> id, for fast access during the loop
    categories = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.is_default == True)
    ).all()
    category_map = {c.name: c.id for c in categories}

    # Fetch existing transactions for this user, to check for duplicates
    existing = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    existing_keys = {(t.date, t.description, t.amount) for t in existing}

    created_count = 0
    skipped_count = 0


    for parsed in parsed_transactions:
        key = (parsed.date, parsed.description, parsed.amount)
        if key in existing_keys:
            skipped_count += 1
            continue

        category_name = categorize_transaction(parsed.description)
        category_id = category_map.get(category_name)

        new_transaction = Transaction(
            user_id=current_user.id,
            account_id=account_id,
            date=parsed.date,
            description=parsed.description,
            amount=parsed.amount,
            category_id=category_id,
            source="csv_import",
        )
        db.add(new_transaction)
        created_count += 1

    log_action(
        db,
        current_user.id,
        "csv_import",
        f"{created_count} created, {skipped_count} duplicates skipped, "
        f"{len(parse_result.skipped_rows)} invalid rows",
    )
    db.commit()

    return {
        "created": created_count,
        "skipped_duplicates": skipped_count,
        "invalid_rows": len(parse_result.skipped_rows),
        "invalid_row_details": [
            {"row_number": row.row_number, "reason": row.reason}
            for row in parse_result.skipped_rows
        ],
        "total_rows": len(parsed_transactions) + len(parse_result.skipped_rows),
    }