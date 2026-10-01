from datetime import date

LOCKED_MONTH_DETAIL = "This transaction is in a closed month and can no longer be created, modified, or deleted."
LOCKED_BUDGET_MONTH_DETAIL = "This budget is for a closed month and can no longer be created, modified, or deleted."
LOCKED_INCOME_MONTH_DETAIL = "This month's income is closed and can no longer be modified."


def is_locked_month(value: date) -> bool:
    today = date.today()
    return (value.year, value.month) < (today.year, today.month)


def is_locked_month_str(value: str) -> bool:
    """Same check as is_locked_month, for a "YYYY-MM" string (budgets, income)."""
    year, month = int(value[:4]), int(value[5:7])
    today = date.today()
    return (year, month) < (today.year, today.month)
