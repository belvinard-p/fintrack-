from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.categorization import categorize_transaction
from app.services.csv_import import parse_csv, CSVParseError
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_in: TransactionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    new_transaction = Transaction(
        **transaction_in.model_dump(),
        user_id=current_user.id,
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction



@router.get("/", response_model=list[TransactionOut])
def list_transactions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc())
        .all()
    )


@router.get("/{transaction_id}", response_model=TransactionOut)
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
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionOut)
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
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = transaction_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
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
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()


@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_csv(
    file: UploadFile,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    content = await file.read()

    try:
        parsed_transactions = parse_csv(content)
    except CSVParseError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
            date=parsed.date,
            description=parsed.description,
            amount=parsed.amount,
            category_id=category_id,
            source="csv_import",
        )
        db.add(new_transaction)
        created_count += 1

    db.commit()

    return {
        "created": created_count,
        "skipped_duplicates": skipped_count,
        "total_rows": len(parsed_transactions),
    }