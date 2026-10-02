from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import log_action
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.recurring_transaction import RecurringTransaction
from app.schemas.account import AccountCreate, AccountUpdate, AccountOut

router = APIRouter(prefix="/accounts", tags=["accounts"])

ACCOUNT_NOT_FOUND = "Account not found"
ACCOUNT_HAS_REFERENCES = (
    "This account still has transactions or recurring transactions linked to it. "
    "Reassign or delete them first."
)
ACCOUNT_LAST_ONE = "You must keep at least one account."


def _to_account_out(account: Account, transactions_total) -> AccountOut:
    return AccountOut(
        id=account.id,
        name=account.name,
        type=account.type,
        opening_balance=account.opening_balance,
        balance=account.opening_balance + Decimal(transactions_total),
        created_at=account.created_at,
    )


@router.get("/", response_model=list[AccountOut])
def list_accounts(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    rows = (
        db.query(Account, func.coalesce(func.sum(Transaction.amount), 0).label("total"))
        .outerjoin(Transaction, Transaction.account_id == Account.id)
        .filter(Account.user_id == current_user.id)
        .group_by(Account.id)
        .order_by(Account.created_at)
        .all()
    )
    return [_to_account_out(account, total) for account, total in rows]


@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    new_account = Account(
        user_id=current_user.id,
        name=account_in.name,
        type=account_in.type,
        opening_balance=account_in.opening_balance,
    )
    db.add(new_account)
    log_action(
        db,
        current_user.id,
        "create_bank_account",
        f"'{new_account.name}' — opening balance {new_account.opening_balance}",
    )
    db.commit()
    db.refresh(new_account)
    return _to_account_out(new_account, Decimal("0"))


@router.patch("/{account_id}", response_model=AccountOut, responses={404: {"description": ACCOUNT_NOT_FOUND}})
def update_account(
    account_id: int,
    account_in: AccountUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail=ACCOUNT_NOT_FOUND)

    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    log_action(db, current_user.id, "update_bank_account", f"'{account.name}'")
    db.commit()
    db.refresh(account)

    total = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.account_id == account.id)
        .scalar()
    )
    return _to_account_out(account, total)


@router.delete(
    "/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": ACCOUNT_NOT_FOUND}, 400: {"description": ACCOUNT_HAS_REFERENCES}},
)
def delete_bank_account(
    account_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail=ACCOUNT_NOT_FOUND)

    remaining_accounts = db.query(Account).filter(Account.user_id == current_user.id).count()
    if remaining_accounts <= 1:
        raise HTTPException(status_code=400, detail=ACCOUNT_LAST_ONE)

    has_transaction = db.query(Transaction.id).filter(Transaction.account_id == account_id).first()
    has_recurring = db.query(RecurringTransaction.id).filter(RecurringTransaction.account_id == account_id).first()
    if has_transaction or has_recurring:
        raise HTTPException(status_code=400, detail=ACCOUNT_HAS_REFERENCES)

    log_action(db, current_user.id, "delete_bank_account", f"'{account.name}'")
    db.delete(account)
    db.commit()
