from datetime import date

LOCKED_MONTH_DETAIL = "This transaction is in a closed month and can no longer be created, modified, or deleted."


def is_locked_month(value: date) -> bool:
    today = date.today()
    return (value.year, value.month) < (today.year, today.month)
