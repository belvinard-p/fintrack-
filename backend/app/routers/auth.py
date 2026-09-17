from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.jwt import create_access_token
from app.core.limiter import limiter
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.category import Category
from app.models.goal import Goal
from app.models.audit_log import AuditLog
from app.models.recurring_transaction import RecurringTransaction
from app.schemas.user import UserCreate, UserLogin, UserOut, PasswordChange, EmailChange

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED, responses={400: {"description": "Email already registered"}})
@limiter.limit("10/minute")
def register(request: Request, user_in: UserCreate, db: Annotated[Session, Depends(get_db)]):
    new_user = User(
        email=user_in.email,
        password_hash=hash_password(user_in.password),
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    db.refresh(new_user)
    return new_user


@router.post("/login", responses={401: {"description": "Incorrect email or password"}})
@limiter.limit("5/minute")
def login(request: Request, credentials: UserLogin, db: Annotated[Session, Depends(get_db)]):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.patch(
    "/me/password",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"description": "Current password is incorrect"}},
)
def change_password(
    payload: PasswordChange,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()


@router.patch(
    "/me/email",
    responses={
        401: {"description": "Current password is incorrect"},
        400: {"description": "Email already in use"},
    },
)
def change_email(
    payload: EmailChange,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    current_user.email = payload.new_email
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already in use")
    db.refresh(current_user)

    access_token = create_access_token(subject=current_user.email)
    return {"access_token": access_token, "token_type": "bearer"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()
    db.query(RecurringTransaction).filter(RecurringTransaction.user_id == current_user.id).delete()
    db.query(Budget).filter(Budget.user_id == current_user.id).delete()
    db.query(Category).filter(Category.user_id == current_user.id).delete()
    db.query(Goal).filter(Goal.user_id == current_user.id).delete()
    db.query(AuditLog).filter(AuditLog.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()