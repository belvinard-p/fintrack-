from pydantic import BaseModel
from decimal import Decimal


class CategorySpending(BaseModel):
    category_id: int | None
    category_name: str
    total: Decimal


class MonthlySpending(BaseModel):
    month: str  # "YYYY-MM"
    total: Decimal