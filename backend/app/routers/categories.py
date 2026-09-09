from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryOut])
def list_categories(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return (
        db.query(Category)
        .filter((Category.user_id == current_user.id) | (Category.is_default == True))
        .order_by(Category.name)
        .all()
    )
