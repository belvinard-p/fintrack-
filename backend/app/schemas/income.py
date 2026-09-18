from decimal import Decimal

from pydantic import BaseModel, Field


class MonthlyIncomeSet(BaseModel):
    amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class MonthlyIncomeOut(BaseModel):
    month: str
    amount: Decimal
    is_set: bool
    total_budgeted: Decimal
    remaining: Decimal
    is_over_allocated: bool
