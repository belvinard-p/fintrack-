from pydantic import BaseModel, ConfigDict, field_validator
from decimal import Decimal
import re


class BudgetCreate(BaseModel):
    category_id: int
    monthly_limit: Decimal
    month: str

    @field_validator("month")
    @classmethod
    def validate_month_format(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}$", v):
            raise ValueError("month must be in YYYY-MM format")
        return v


class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    category_name: str
    monthly_limit: Decimal
    month: str


class BudgetStatus(BaseModel):
    category_id: int
    category_name: str
    monthly_limit: Decimal
    actual_spending: Decimal
    is_over_budget: bool
