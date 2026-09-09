from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])

CATEGORY_KEYWORDS = {
    "Groceries": ["grocery", "supermarket", "walmart", "carrefour"],
    "Transport": ["uber", "lyft", "taxi", "transport", "fuel", "gas station"],
    "Dining Out": ["restaurant", "starbucks", "coffee", "mcdonald", "kfc"],
    "Utilities": ["electricity", "water bill", "internet", "phone bill"],
    "Rent": ["rent"],
    "Entertainment": ["netflix", "spotify", "cinema", "movie"],
    "Health": ["pharmacy", "doctor", "hospital", "clinic"],
    "Salary": ["salary", "payroll", "deposit"],
}


def categorize_transaction(description: str) -> str:
    """Return the matching category name based on keywords found in the description.
    Falls back to 'Uncategorized' if no keyword matches.
    """
    normalized = description.lower()
    for category_name, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return category_name
    return "Uncategorized"


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