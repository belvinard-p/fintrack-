"""Demo accounts: what a visitor gets when they click "Try the demo".

Each visitor gets their own account, filled with six months of realistic sample data built from today's date, so the
dashboard is never empty and several visitors never disturb each other. The accounts are deleted after a day.

The data follows the same rules as a real account: income is declared per month, budgets and goal allocations stay
within that income, debt payments are split into principal and interest, and recurring rules do not generate a month
twice. Everything is deterministic: the same date always gives the same data, which is what lets the sample bank
statement (`scripts/generate_demo_csv.py`) contain exact duplicates of it.
"""
import random
import secrets
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.account_data import delete_user_and_data
from app.core.audit import log_action
from app.core.config import settings
from app.core.debt_math import split_payment
from app.core.security import hash_password
from app.models.account import Account, AccountType
from app.models.budget import Budget
from app.models.category import Category
from app.models.debt import Debt, DebtPayment, DebtType
from app.models.goal import Goal, GoalAllocation, GoalContribution
from app.models.monthly_income import MonthlyIncome
from app.models.recurring_transaction import RecurringTransaction
from app.models.transaction import Transaction, TransactionSource
from app.models.user import User

# example.com is reserved for documentation: these addresses can never receive mail, and they pass email validation.
DEMO_EMAIL_DOMAIN = "demo.example.com"
MONTHS = 6

SALARY = Decimal("3200.00")
CATEGORIES = [
    "Groceries", "Transport", "Dining Out", "Utilities", "Rent", "Entertainment", "Health", "Shopping", "Salary",
    "Savings", "Debt Repayment",
]
# Sized so the sample bank statement (demo_statement.py) fits inside them on any day of the month: only Entertainment
# goes over, on purpose. The total (2 280) plus the goal allocations (650) stays within the 3 200 income.
BUDGETS = {
    "Groceries": Decimal("400"),
    "Transport": Decimal("200"),
    "Dining Out": Decimal("150"),
    "Utilities": Decimal("200"),
    "Rent": Decimal("1050"),
    "Entertainment": Decimal("40"),
    "Health": Decimal("120"),
    "Shopping": Decimal("120"),
}
EMERGENCY_ALLOCATION = Decimal("400")
HOLIDAY_ALLOCATION = Decimal("250")


@dataclass(frozen=True)
class Row:
    """One line of the sample data, before it becomes a transaction."""

    day: int
    description: str
    amount: Decimal
    category: str | None
    account: str = "Checking"
    source: TransactionSource = TransactionSource.manual


def money(value: float) -> Decimal:
    return Decimal(str(round(value, 2))).quantize(Decimal("0.01"))


def posted_at(day: date, description: str, now: datetime) -> datetime:
    """When a transaction was recorded: a believable hour of its own day, never in the future.

    Without this every sample row would carry the second the demo was created, and the "Time" column would read the same
    from top to bottom.
    """
    rng = random.Random(f"{day.isoformat()}|{description}")
    stamp = datetime(day.year, day.month, day.day, rng.randint(7, 21), rng.randint(0, 59), tzinfo=timezone.utc)
    return min(stamp, now)


def month_start(today: date, months_back: int) -> date:
    index = today.year * 12 + today.month - 1 - months_back
    return date(index // 12, index % 12 + 1, 1)


def month_key(first_day: date) -> str:
    return f"{first_day.year:04d}-{first_day.month:02d}"


def recurring_rows() -> list[Row]:
    """Fixed monthly items: they also exist as recurring rules, so the app does not generate them a second time."""
    recurring = TransactionSource.recurring
    return [
        Row(1, "RENT PAYMENT", Decimal("-1050.00"), "Rent", source=recurring),
        Row(8, "INTERNET PROVIDER", Decimal("-39.99"), "Utilities", source=recurring),
        Row(10, "NETFLIX SUBSCRIPTION", Decimal("-15.99"), "Entertainment", source=recurring),
        Row(25, "SALARY DEPOSIT ACME SARL", SALARY, "Salary", source=recurring),
    ]


def variable_rows(first_day: date, previous_month: bool) -> list[Row]:
    """The month's everyday spending. Seeded by the month itself, so a given month never changes."""
    rng = random.Random(first_day.year * 100 + first_day.month)
    rows = [
        Row(6, "ELECTRICITY BILL", -money(rng.uniform(72, 95)), "Utilities"),
        Row(11, "SPOTIFY PREMIUM", Decimal("-10.99"), "Entertainment"),
        Row(2, "TRANSPORT PASS", Decimal("-45.00"), "Transport"),
        Row(7, "ATM WITHDRAWAL", Decimal("-40.00"), None),
        Row(15, "LOCAL BOOKSTORE", -money(rng.uniform(14, 32)), "Shopping"),
        Row(23, "AMAZON PURCHASE", -money(rng.uniform(20, 70)), "Shopping"),
        Row(17, "PHARMACY", -money(rng.uniform(11, 24)), "Health"),
        Row(28, "SAVINGS INTEREST", money(rng.uniform(2.8, 3.6)), None, account="Savings"),
        Row(9, "MARKET STALL (CASH)", -money(rng.uniform(8, 16)), "Groceries", account="Cash wallet"),
    ]
    if first_day.month % 3 == 0:
        rows.append(Row(21, "DOCTOR CONSULTATION", Decimal("-30.00"), "Health"))
    for day, merchant in zip((3, 11, 18, 26), ("WALMART SUPERMARKET", "CARREFOUR MARKET") * 2):
        rows.append(Row(day, merchant, -money(rng.uniform(46, 70)), "Groceries"))
    for day in (4, 12, 19):
        rows.append(Row(day, "UBER TRIP", -money(rng.uniform(9, 19)), "Transport"))
    for day in (5, 16):
        rows.append(Row(day, "STARBUCKS COFFEE", -money(rng.uniform(3.9, 6.2)), "Dining Out"))
    rows.append(Row(13, "MCDONALD'S", -money(rng.uniform(9, 14)), "Dining Out"))
    rows.append(Row(22, "RESTAURANT LE BISTROT", -money(rng.uniform(28, 46)), "Dining Out"))
    if previous_month:
        # One budget is blown last month, so the history shows what an over-budget month looks like.
        rows.append(Row(18, "BIRTHDAY DINNER", Decimal("-110.00"), "Dining Out"))
    return rows


def month_rows(first_day: date, today: date) -> list[Row]:
    """Every transaction of a month, up to today for the current one."""
    previous = month_start(today, 1) == first_day
    rows = recurring_rows() + variable_rows(first_day, previous)
    if first_day == month_start(today, 0):
        rows = [row for row in rows if row.day <= today.day]
    return sorted(rows, key=lambda row: (row.day, row.description))


def create_demo_user(db: Session, today: date | None = None) -> User:
    """Create one visitor account with its sample data. Commits."""
    today = today or date.today()
    now = datetime.now(timezone.utc)
    user = User(
        email=f"demo-{secrets.token_hex(6)}@{DEMO_EMAIL_DOMAIN}",
        # Nobody ever signs in with a password: the visitor gets a token straight away.
        password_hash=hash_password(secrets.token_urlsafe(32)),
        is_demo=True,
    )
    db.add(user)
    db.flush()

    accounts = {
        name: Account(user_id=user.id, name=name, type=kind, opening_balance=opening)
        for name, kind, opening in (
            ("Checking", AccountType.checking, Decimal("2400.00")),
            ("Savings", AccountType.savings, Decimal("8000.00")),
            ("Cash wallet", AccountType.cash, Decimal("120.00")),
        )
    }
    db.add_all(accounts.values())
    categories = {name: Category(name=name, user_id=user.id, is_default=False) for name in CATEGORIES}
    db.add_all(categories.values())
    db.flush()

    months = [month_start(today, back) for back in range(MONTHS - 1, -1, -1)]
    current = months[-1]

    for first_day in months:
        key = month_key(first_day)
        db.add(MonthlyIncome(user_id=user.id, month=key, amount=SALARY))
        for category, limit in BUDGETS.items():
            db.add(Budget(user_id=user.id, category_id=categories[category].id, monthly_limit=limit, month=key))
        for row in month_rows(first_day, today):
            when = first_day.replace(day=row.day)
            db.add(
                Transaction(
                    user_id=user.id,
                    account_id=accounts[row.account].id,
                    category_id=categories[row.category].id if row.category else None,
                    date=when,
                    description=row.description,
                    amount=row.amount,
                    source=row.source,
                    created_at=posted_at(when, row.description, now),
                )
            )

    for row in recurring_rows():
        due_this_month = row.day <= today.day
        db.add(
            RecurringTransaction(
                user_id=user.id,
                category_id=categories[row.category].id,
                account_id=accounts[row.account].id,
                description=row.description,
                amount=row.amount,
                day_of_month=row.day,
                start_date=months[0],
                is_active=True,
                # Already generated up to now: the app only creates the next occurrence once its day comes.
                last_generated_month=month_key(current if due_this_month else months[-2]),
            )
        )

    _seed_goals(db, user, accounts["Checking"], categories["Savings"], months, today, now)
    _seed_debts(db, user, accounts["Checking"], categories["Debt Repayment"], months, today, now)

    log_action(db, user.id, "csv_import", "34 created, 0 duplicates skipped, 0 invalid rows")
    log_action(db, user.id, "create_debt", "'Car loan' — principal 6500.00")
    log_action(db, user.id, "set_income", f"{month_key(current)}: {SALARY}")
    db.commit()
    db.refresh(user)
    return user


def _seed_goals(
    db: Session, user: User, account: Account, category: Category, months: list[date], today: date, now: datetime
) -> None:
    emergency = Goal(
        user_id=user.id,
        name="Emergency fund",
        target_amount=Decimal("4000.00"),
        opening_amount=Decimal("400.00"),
        target_date=today + timedelta(days=300),
    )
    holiday = Goal(
        user_id=user.id,
        name="Summer holiday",
        target_amount=Decimal("1500.00"),
        opening_amount=Decimal("0.00"),
        target_date=today + timedelta(days=180),
    )
    db.add_all([emergency, holiday])
    db.flush()

    for index, first_day in enumerate(months):
        key = month_key(first_day)
        plans = [(emergency, EMERGENCY_ALLOCATION)]
        if index >= MONTHS - 4:
            plans.append((holiday, HOLIDAY_ALLOCATION))
        for goal, amount in plans:
            db.add(GoalAllocation(user_id=user.id, goal_id=goal.id, month=key, amount=amount))
            if first_day.replace(day=26) > today:
                continue
            when = first_day.replace(day=26)
            transaction = Transaction(
                user_id=user.id,
                account_id=account.id,
                category_id=category.id,
                date=when,
                description=f"Contribution — {goal.name}",
                amount=-amount,
                source=TransactionSource.goal_contribution,
                created_at=posted_at(when, goal.name, now),
            )
            db.add(transaction)
            db.flush()
            db.add(GoalContribution(user_id=user.id, goal_id=goal.id, transaction_id=transaction.id))


def _seed_debts(
    db: Session, user: User, account: Account, category: Category, months: list[date], today: date, now: datetime
) -> None:
    started = datetime.combine(months[0], datetime.min.time(), tzinfo=timezone.utc)
    plans = [
        # name, type, principal, annual rate, monthly payment, payment day, first month index
        ("Car loan", DebtType.loan, Decimal("6500.00"), Decimal("5.90"), Decimal("260.00"), 5, 0),
        ("Credit card", DebtType.credit_card, Decimal("900.00"), Decimal("19.90"), Decimal("150.00"), 12, 2),
    ]
    for name, kind, principal, rate, payment, day, first_index in plans:
        debt = Debt(user_id=user.id, name=name, type=kind, principal=principal, annual_rate=rate, created_at=started)
        db.add(debt)
        db.flush()
        remaining = principal
        for first_day in months[first_index:]:
            paid_on = first_day.replace(day=day)
            if paid_on > today:
                continue
            principal_part, interest_part = split_payment(remaining, rate, payment)
            transaction = Transaction(
                user_id=user.id,
                account_id=account.id,
                category_id=category.id,
                date=paid_on,
                description=f"Payment — {name}",
                amount=-payment,
                source=TransactionSource.debt_payment,
                created_at=posted_at(paid_on, name, now),
            )
            db.add(transaction)
            db.flush()
            db.add(
                DebtPayment(
                    user_id=user.id,
                    debt_id=debt.id,
                    transaction_id=transaction.id,
                    principal_portion=principal_part,
                    interest_portion=interest_part,
                )
            )
            remaining -= principal_part


def purge_expired_demo_users(db: Session, now: datetime | None = None) -> int:
    """Delete demo accounts older than their lifetime, then the oldest ones if too many remain. Returns how many."""
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=settings.demo_ttl_hours)
    demo = db.query(User).filter(User.is_demo.is_(True))
    doomed = demo.filter(User.created_at < cutoff).all()

    alive = demo.filter(User.created_at >= cutoff).order_by(User.created_at.desc()).all()
    # Room for the account about to be created.
    doomed += alive[max(settings.demo_max_active - 1, 0):]

    for user in doomed:
        delete_user_and_data(db, user)
    db.commit()
    return len(doomed)
