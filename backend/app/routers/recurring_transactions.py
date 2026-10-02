from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import log_action
from app.models.user import User
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.recurring_transaction import RecurringTransaction
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionOut,
    GenerateResult,
)

router = APIRouter(prefix="/recurring-transactions", tags=["recurring-transactions"])

RECURRING_NOT_FOUND = "Recurring transaction not found"
ACCOUNT_NOT_FOUND = "Account not found"


@router.post(
    "/",
    response_model=RecurringTransactionOut,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"description": ACCOUNT_NOT_FOUND}},
)
def create_recurring_transaction(
    payload: RecurringTransactionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    account = (
        db.query(Account)
        .filter(Account.id == payload.account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail=ACCOUNT_NOT_FOUND)

    new_recurring = RecurringTransaction(
        user_id=current_user.id,
        description=payload.description,
        amount=payload.amount,
        category_id=payload.category_id,
        account_id=payload.account_id,
        day_of_month=payload.day_of_month,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(new_recurring)
    log_action(
        db,
        current_user.id,
        "create_recurring_transaction",
        f"'{new_recurring.description}' — {new_recurring.amount} on day {new_recurring.day_of_month}",
    )
    db.commit()
    db.refresh(new_recurring)
    return new_recurring


@router.get("/", response_model=list[RecurringTransactionOut])
def list_recurring_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == current_user.id)
        .order_by(RecurringTransaction.day_of_month)
        .all()
    )


@router.patch(
    "/{recurring_id}",
    response_model=RecurringTransactionOut,
    responses={404: {"description": RECURRING_NOT_FOUND}},
)
def update_recurring_transaction(
    recurring_id: int,
    payload: RecurringTransactionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    recurring = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.id == recurring_id, RecurringTransaction.user_id == current_user.id)
        .first()
    )
    if not recurring:
        raise HTTPException(status_code=404, detail=RECURRING_NOT_FOUND)

    update_data = payload.model_dump(exclude_unset=True)

    if "account_id" in update_data:
        account = (
            db.query(Account)
            .filter(Account.id == update_data["account_id"], Account.user_id == current_user.id)
            .first()
        )
        if not account:
            raise HTTPException(status_code=404, detail=ACCOUNT_NOT_FOUND)

    for field, value in update_data.items():
        setattr(recurring, field, value)

    log_action(
        db,
        current_user.id,
        "update_recurring_transaction",
        f"'{recurring.description}' — {recurring.amount} on day {recurring.day_of_month}",
    )
    db.commit()
    db.refresh(recurring)
    return recurring


@router.delete(
    "/{recurring_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": RECURRING_NOT_FOUND}},
)
def delete_recurring_transaction(
    recurring_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    recurring = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.id == recurring_id, RecurringTransaction.user_id == current_user.id)
        .first()
    )
    if not recurring:
        raise HTTPException(status_code=404, detail=RECURRING_NOT_FOUND)

    log_action(db, current_user.id, "delete_recurring_transaction", f"'{recurring.description}'")
    db.delete(recurring)
    db.commit()


@router.post("/generate", response_model=GenerateResult)
def generate_due_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Materialize this month's occurrences for any active recurring transaction
    whose day has arrived and hasn't already been generated this month.
    """
    today = date.today()
    current_month = f"{today.year:04d}-{today.month:02d}"

    due = (
        db.query(RecurringTransaction)
        .filter(
            RecurringTransaction.user_id == current_user.id,
            RecurringTransaction.is_active.is_(True),
            RecurringTransaction.day_of_month <= today.day,
            RecurringTransaction.start_date <= today,
        )
        .filter(
            (RecurringTransaction.last_generated_month.is_(None))
            | (RecurringTransaction.last_generated_month != current_month)
        )
        .filter(
            (RecurringTransaction.end_date.is_(None)) | (RecurringTransaction.end_date >= today)
        )
        .all()
    )

    created = 0
    for recurring in due:
        occurrence_date = date(today.year, today.month, recurring.day_of_month)
        db.add(
            Transaction(
                user_id=current_user.id,
                category_id=recurring.category_id,
                account_id=recurring.account_id,
                date=occurrence_date,
                description=recurring.description,
                amount=recurring.amount,
                source="recurring",
            )
        )
        recurring.last_generated_month = current_month
        created += 1

    db.commit()
    return GenerateResult(created=created)
