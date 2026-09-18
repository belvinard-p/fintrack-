from pydantic import BaseModel
from decimal import Decimal


class CategorySpending(BaseModel):
    category_id: int | None
    category_name: str
    total: Decimal


class MonthlySpending(BaseModel):
    month: str  # "YYYY-MM"
    total: Decimal

class PeriodTotals(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net: Decimal


class MonthlySummary(BaseModel):
    month: str  # "YYYY-MM"
    income_set: bool
    total_income: Decimal
    total_expenses: Decimal
    net: Decimal
    savings_rate: Decimal | None
    transaction_count: int
    previous: PeriodTotals
    expenses_by_category: list[CategorySpending]
