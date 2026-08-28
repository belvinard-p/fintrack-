from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.jwt import create_access_token
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED, responses={400: {"description": "Email already registered"}})
def register(user_in: UserCreate, db: Annotated[Session, Depends(get_db)]):
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
def login(credentials: UserLogin, db: Annotated[Session, Depends(get_db)]):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user