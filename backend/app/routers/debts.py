from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import log_action
from app.core.month_lock import is_locked_month, LOCKED_MONTH_DETAIL
from app.core.debt_math import split_payment
from app.models.user import User
from app.models.debt import Debt, DebtPayment
from app.models.account import Account
from app.models.transaction import Transaction, TransactionSource
from app.schemas.debt import DebtCreate, DebtUpdate, DebtOut, DebtPaymentCreate, DebtPaymentOut

router = APIRouter(prefix="/debts", tags=["debts"])

DEBT_NOT_FOUND = "Debt not found"
ACCOUNT_NOT_FOUND = "Account not found"
DEBT_HAS_PAYMENTS = "This debt still has payments logged against it. Delete them first."


def _to_debt_out(debt: Debt, payments_total) -> DebtOut:
    remaining = debt.principal - Decimal(payments_total)
    if remaining < 0:
        remaining = Decimal("0.00")
    return DebtOut(
        id=debt.id,
        name=debt.name,
        type=debt.type,
        principal=debt.principal,
        annual_rate=debt.annual_rate,
        remaining_balance=remaining,
        created_at=debt.created_at,
    )


def _remaining_balance(db: Session, debt: Debt) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(DebtPayment.principal_portion), 0))
        .filter(DebtPayment.debt_id == debt.id)
        .scalar()
    )
    remaining = debt.principal - Decimal(total)
    return remaining if remaining > 0 else Decimal("0.00")


@router.get("/", response_model=list[DebtOut])
def list_debts(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    rows = (
        db.query(Debt, func.coalesce(func.sum(DebtPayment.principal_portion), 0).label("total"))
        .outerjoin(DebtPayment, DebtPayment.debt_id == Debt.id)
        .filter(Debt.user_id == current_user.id)
        .group_by(Debt.id)
        .order_by(Debt.created_at)
        .all()
    )
    return [_to_debt_out(debt, total) for debt, total in rows]


@router.post("/", response_model=DebtOut, status_code=status.HTTP_201_CREATED)
def create_debt(
    debt_in: DebtCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    new_debt = Debt(
        user_id=current_user.id,
        name=debt_in.name,
        type=debt_in.type,
        principal=debt_in.principal,
        annual_rate=debt_in.annual_rate,
    )
    db.add(new_debt)
    log_action(db, current_user.id, "create_debt", f"'{new_debt.name}' — principal {new_debt.principal}")
    db.commit()
    db.refresh(new_debt)
    return _to_debt_out(new_debt, Decimal("0"))


@router.patch("/{debt_id}", response_model=DebtOut, responses={404: {"description": DEBT_NOT_FOUND}})
def update_debt(
    debt_id: int,
    debt_in: DebtUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail=DEBT_NOT_FOUND)

    update_data = debt_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(debt, field, value)

    log_action(db, current_user.id, "update_debt", f"'{debt.name}'")
    db.commit()
    db.refresh(debt)

    total = (
        db.query(func.coalesce(func.sum(DebtPayment.principal_portion), 0))
        .filter(DebtPayment.debt_id == debt.id)
        .scalar()
    )
    return _to_debt_out(debt, total)


@router.delete(
    "/{debt_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": DEBT_NOT_FOUND}, 400: {"description": DEBT_HAS_PAYMENTS}},
)
def delete_debt(
    debt_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail=DEBT_NOT_FOUND)

    has_payment = db.query(DebtPayment.id).filter(DebtPayment.debt_id == debt_id).first()
    if has_payment:
        raise HTTPException(status_code=400, detail=DEBT_HAS_PAYMENTS)

    log_action(db, current_user.id, "delete_debt", f"'{debt.name}'")
    db.delete(debt)
    db.commit()


@router.post(
    "/{debt_id}/payments",
    response_model=DebtPaymentOut,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"description": LOCKED_MONTH_DETAIL},
        404: {"description": f"{DEBT_NOT_FOUND} or {ACCOUNT_NOT_FOUND}"},
    },
)
def create_debt_payment(
    debt_id: int,
    payload: DebtPaymentCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if is_locked_month(payload.date):
        raise HTTPException(status_code=400, detail=LOCKED_MONTH_DETAIL)

    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail=DEBT_NOT_FOUND)

    account = (
        db.query(Account)
        .filter(Account.id == payload.account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail=ACCOUNT_NOT_FOUND)

    remaining_balance = _remaining_balance(db, debt)
    principal_portion, interest_portion = split_payment(remaining_balance, debt.annual_rate, payload.amount)

    new_transaction = Transaction(
        user_id=current_user.id,
        account_id=payload.account_id,
        category_id=None,
        date=payload.date,
        description=payload.description or f"Payment — {debt.name}",
        amount=-payload.amount,
        source=TransactionSource.debt_payment,
    )
    db.add(new_transaction)
    db.flush()

    new_payment = DebtPayment(
        user_id=current_user.id,
        debt_id=debt.id,
        transaction_id=new_transaction.id,
        principal_portion=principal_portion,
        interest_portion=interest_portion,
    )
    db.add(new_payment)

    log_action(
        db,
        current_user.id,
        "create_debt_payment",
        f"'{debt.name}' — {payload.amount} (principal {principal_portion}, interest {interest_portion})",
    )
    db.commit()
    db.refresh(new_payment)
    db.refresh(new_transaction)

    return DebtPaymentOut(
        id=new_payment.id,
        debt_id=new_payment.debt_id,
        transaction_id=new_transaction.id,
        date=new_transaction.date,
        amount=-new_transaction.amount,
        principal_portion=new_payment.principal_portion,
        interest_portion=new_payment.interest_portion,
        created_at=new_payment.created_at,
    )


@router.get("/{debt_id}/payments", response_model=list[DebtPaymentOut], responses={404: {"description": DEBT_NOT_FOUND}})
def list_debt_payments(
    debt_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    debt = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not debt:
        raise HTTPException(status_code=404, detail=DEBT_NOT_FOUND)

    rows = (
        db.query(DebtPayment, Transaction)
        .join(Transaction, Transaction.id == DebtPayment.transaction_id)
        .filter(DebtPayment.debt_id == debt_id)
        .order_by(Transaction.date.desc(), DebtPayment.id.desc())
        .all()
    )

    return [
        DebtPaymentOut(
            id=payment.id,
            debt_id=payment.debt_id,
            transaction_id=transaction.id,
            date=transaction.date,
            amount=-transaction.amount,
            principal_portion=payment.principal_portion,
            interest_portion=payment.interest_portion,
            created_at=payment.created_at,
        )
        for payment, transaction in rows
    ]
