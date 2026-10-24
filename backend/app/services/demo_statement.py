"""A sample bank statement to import into the demo account, to show off the CSV import (and to take screenshots).

It is built to show every outcome of an import: new transactions that sort themselves into the right category, exact
duplicates of transactions the demo already holds (skipped), and broken rows (reported, without failing the import).
Dates are relative to today, so the statement always covers the last few weeks.
"""
from datetime import date, timedelta
from decimal import Decimal

from app.services.demo_seed import month_rows, month_start

# Header names a real bank might use: the import recognises the common variants.
HEADER = "Transaction Date,Details,Amount"

# (days before today, description, amount). Every description holds a keyword the automatic categorisation knows.
NEW_ROWS = [
    (2, "CINEMA CITY TICKETS", "-24.00"),  # pushes Entertainment over its 40 budget: the one deliberate overrun
    (3, "GAS STATION TOTAL", "-52.30"),
    (4, "KFC DOWNTOWN", "-11.40"),
    (5, "CLINIC CHECK-UP", "-35.00"),
    (6, "WATER BILL", "-28.60"),
    (7, "LYFT RIDE", "-13.20"),
    (8, "CARREFOUR MARKET", "-58.45"),
    (9, "STARBUCKS COFFEE", "-5.30"),
    (10, "MOVIE NIGHT TICKETS", "-4.99"),
    (11, "UBER TRIP", "-16.80"),
    (13, "PHARMACY", "-14.75"),
    (14, "RESTAURANT CHEZ MAMAN", "-38.00"),
    (18, "HOSPITAL PARKING", "-6.00"),
    (19, "MCDONALD'S", "-9.90"),
    (23, "PHONE BILL", "-24.99"),
    (26, "GROCERY OUTLET", "-33.85"),
]


def _already_in_the_demo(today: date) -> list[tuple[date, str, Decimal]]:
    """Two transactions the demo already holds, last month, copied exactly: the import must skip them."""
    last_month = month_start(today, 1)
    wanted = {"CARREFOUR MARKET", "PHARMACY"}
    found = {}
    for row in month_rows(last_month, today):
        if row.description in wanted and row.description not in found:
            found[row.description] = (last_month.replace(day=row.day), row.description, row.amount)
    return [found[name] for name in sorted(found)]


def build_statement(today: date | None = None) -> str:
    """The CSV text. 16 new rows, 2 duplicates of the demo's data, 2 broken rows."""
    today = today or date.today()
    lines = [HEADER]
    for days_back, description, amount in NEW_ROWS:
        lines.append(f"{(today - timedelta(days=days_back)).isoformat()},{description},{amount}")
    for when, description, amount in _already_in_the_demo(today):
        lines.append(f"{when.isoformat()},{description},{amount}")
    # Broken rows: an impossible date, and an amount that is not a number.
    lines.append(f"{today.year}-13-45,UNREADABLE DATE ROW,-12.00")
    lines.append(f"{(today - timedelta(days=1)).isoformat()},BAD AMOUNT ROW,twelve euros")
    return "\n".join(lines) + "\n"
