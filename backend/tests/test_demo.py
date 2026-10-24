from collections import Counter
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import text

from app.core.config import settings
from app.models.user import User
from app.services.demo_seed import MONTHS, SALARY, month_key, month_start

TODAY = date.today()
CURRENT_MONTH = month_key(month_start(TODAY, 0))


def start_demo(client):
    response = client.post("/auth/demo")
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def register_and_login(client, email="realuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    token = client.post("/auth/login", json={"email": email, "password": password}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def all_transactions(client, headers):
    """Every transaction of the last six months (the list is paginated: read it page by page)."""
    since = month_start(TODAY, MONTHS - 1).isoformat()
    found, page = [], 1
    while True:
        response = client.get("/transactions/", params={"date_from": since, "page": page, "page_size": 200}, headers=headers)
        assert response.status_code == 200, response.text
        body = response.json()
        found += body["items"]
        if page >= body["total_pages"]:
            return found
        page += 1


def test_a_visitor_is_signed_in_to_a_demo_account_with_no_password(client, db_session):
    headers = start_demo(client)

    me = client.get("/auth/me", headers=headers).json()

    assert me["is_demo"] is True
    assert me["email"].endswith("@demo.example.com")
    assert client.post("/auth/login", json={"email": me["email"], "password": "anything"}).status_code == 401


def test_a_regular_account_is_not_a_demo_account(client):
    headers = register_and_login(client)

    assert client.get("/auth/me", headers=headers).json()["is_demo"] is False


def test_the_demo_comes_with_accounts_categories_and_six_months_of_transactions(client):
    headers = start_demo(client)

    accounts = client.get("/accounts/", headers=headers).json()
    categories = client.get("/categories/", headers=headers).json()
    transactions = all_transactions(client, headers)

    assert {account["name"] for account in accounts} == {"Checking", "Savings", "Cash wallet"}
    assert {"Groceries", "Rent", "Dining Out", "Salary"} <= {category["name"] for category in categories}
    assert len(transactions) > 120
    assert {transaction["date"][:7] for transaction in transactions} == {
        month_key(month_start(TODAY, back)) for back in range(MONTHS)
    }
    # The current month stops at today: no transaction is dated in the future.
    assert all(transaction["date"] <= TODAY.isoformat() for transaction in transactions)


def test_every_month_has_declared_income_and_a_dashboard_that_adds_up(client):
    headers = start_demo(client)

    for back in range(1, MONTHS):
        key = month_key(month_start(TODAY, back))
        summary = client.get("/transactions/dashboard/monthly-summary", params={"month": key}, headers=headers).json()
        assert summary["income_set"] is True
        assert Decimal(summary["total_income"]) == SALARY
        assert Decimal(summary["total_expenses"]) > 0
        assert summary["savings_rate"] is not None
        assert summary["expenses_by_category"], key


def test_budgets_and_goal_allocations_stay_within_each_months_income(client, db_session):
    start_demo(client)

    rows = db_session.execute(
        text(
            """
            select i.month, i.amount,
                   coalesce((select sum(monthly_limit) from budgets b where b.user_id = i.user_id and b.month = i.month), 0)
                 + coalesce((select sum(amount) from goal_allocations g where g.user_id = i.user_id and g.month = i.month), 0)
            from monthly_incomes i
            """
        )
    ).fetchall()

    assert len(rows) == MONTHS
    for month, income, assigned in rows:
        assert assigned <= income, month


def test_recurring_rules_do_not_generate_a_month_twice(client):
    headers = start_demo(client)

    client.post("/recurring-transactions/generate", headers=headers)

    rents = Counter(
        transaction["date"][:7]
        for transaction in all_transactions(client, headers)
        if transaction["description"] == "RENT PAYMENT"
    )
    assert set(rents.values()) == {1}
    assert CURRENT_MONTH in rents


def test_savings_and_debt_payments_are_categorised_so_the_dashboard_has_no_large_uncategorised_slice(client):
    headers = start_demo(client)
    categories = {category["id"]: category["name"] for category in client.get("/categories/", headers=headers).json()}

    by_source = {}
    for transaction in all_transactions(client, headers):
        by_source.setdefault(transaction["source"], set()).add(categories.get(transaction["category_id"]))

    assert by_source["goal_contribution"] == {"Savings"}
    assert by_source["debt_payment"] == {"Debt Repayment"}


def test_transactions_were_recorded_at_different_believable_times_never_in_the_future(client):
    headers = start_demo(client)

    stamps = [datetime.fromisoformat(t["created_at"]) for t in all_transactions(client, headers)]

    assert len({stamp.time() for stamp in stamps}) > 20
    assert max(stamps) <= datetime.now(timezone.utc)
    assert all(7 <= stamp.hour <= 21 or stamp.date() == date.today() for stamp in stamps)


def test_the_dashboard_net_worth_is_comfortably_positive(client):
    headers = start_demo(client)

    assets = sum(Decimal(account["balance"]) for account in client.get("/accounts/", headers=headers).json())
    debts = sum(Decimal(debt["remaining_balance"]) for debt in client.get("/debts/", headers=headers).json())

    assert assets - debts > 3000


def test_goals_show_progress_and_debts_split_payments_into_principal_and_interest(client):
    headers = start_demo(client)

    goals = {goal["name"]: goal for goal in client.get("/goals/", headers=headers).json()}
    debts = {debt["name"]: debt for debt in client.get("/debts/", headers=headers).json()}

    for goal in goals.values():
        assert 0 < Decimal(goal["current_amount"]) < Decimal(goal["target_amount"]), goal["name"]
    assert set(debts) == {"Car loan", "Credit card"}
    for debt in debts.values():
        assert 0 < Decimal(debt["remaining_balance"]) < Decimal(debt["principal"]), debt["name"]
        payments = client.get(f"/debts/{debt['id']}/payments", headers=headers).json()
        assert payments
        assert all(Decimal(payment["interest_portion"]) > 0 for payment in payments)


def test_last_month_has_a_budget_that_was_exceeded(client):
    headers = start_demo(client)
    last_month = month_key(month_start(TODAY, 1))

    budgets = client.get("/budgets/status", params={"month": last_month}, headers=headers).json()
    dining = next(budget for budget in budgets if budget["category_name"] == "Dining Out")

    assert dining["is_over_budget"] is True
    assert Decimal(dining["actual_spending"]) > Decimal(dining["monthly_limit"])


def test_two_visitors_never_see_each_others_data(client):
    first = start_demo(client)
    second = start_demo(client)

    client.post(
        "/transactions/",
        json={
            "account_id": client.get("/accounts/", headers=first).json()[0]["id"],
            "date": TODAY.isoformat(),
            "description": "ONLY MINE",
            "amount": "-5.00",
        },
        headers=first,
    )

    assert "ONLY MINE" in {t["description"] for t in all_transactions(client, first)}
    assert "ONLY MINE" not in {t["description"] for t in all_transactions(client, second)}


def test_a_demo_account_cannot_change_its_password_or_email_or_be_deleted(client):
    headers = start_demo(client)

    password = client.patch("/auth/me/password", headers=headers, json={"current_password": "x", "new_password": "newpassword1"})
    email = client.patch("/auth/me/email", headers=headers, json={"current_password": "x", "new_email": "me@example.com"})
    deletion = client.request("DELETE", "/auth/me", headers=headers, json={"current_password": "x"})

    assert (password.status_code, email.status_code, deletion.status_code) == (403, 403, 403)
    assert client.get("/auth/me", headers=headers).status_code == 200


def test_expired_demo_accounts_are_deleted_with_all_their_data_and_real_accounts_are_kept(client, db_session):
    old = start_demo(client)
    real = register_and_login(client)
    old_email = client.get("/auth/me", headers=old).json()["email"]
    db_session.execute(
        text("update users set created_at = :then where email = :email"),
        {"then": datetime.now(timezone.utc) - timedelta(hours=settings.demo_ttl_hours + 1), "email": old_email},
    )
    db_session.commit()

    start_demo(client)

    assert db_session.query(User).filter(User.email == old_email).first() is None
    assert client.get("/auth/me", headers=real).status_code == 200
    # Nothing of the expired account is left behind.
    for table in ("transactions", "budgets", "goals", "debts", "monthly_incomes", "accounts", "categories"):
        orphans = db_session.execute(
            text(f"select count(*) from {table} where user_id not in (select id from users)")
        ).scalar()
        assert orphans == 0, table


def test_the_number_of_demo_accounts_is_capped_by_removing_the_oldest(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "demo_max_active", 3)
    for _ in range(5):
        start_demo(client)

    assert db_session.query(User).filter(User.is_demo.is_(True)).count() == 3


def test_the_sample_data_is_the_same_for_the_same_day(client, db_session):
    first = start_demo(client)
    second = start_demo(client)

    def fingerprint(headers):
        return Counter((t["date"], t["description"], t["amount"]) for t in all_transactions(client, headers))

    assert fingerprint(first) == fingerprint(second)


def test_the_sample_bank_statement_imports_with_duplicates_skipped_and_broken_rows_reported(client):
    from app.services.demo_statement import NEW_ROWS, build_statement

    headers = start_demo(client)
    account_id = client.get("/accounts/", headers=headers).json()[0]["id"]

    response = client.post(
        "/transactions/import",
        data={"account_id": str(account_id)},
        files={"file": ("bank-statement-demo.csv", build_statement().encode(), "text/csv")},
        headers=headers,
    )

    assert response.status_code == 201, response.text
    result = response.json()
    assert result["created"] == len(NEW_ROWS)
    assert result["skipped_duplicates"] == 2
    assert result["invalid_rows"] == 2
    assert [row["row_number"] for row in result["invalid_row_details"]] == [len(NEW_ROWS) + 4, len(NEW_ROWS) + 5]

    imported = [t for t in all_transactions(client, headers) if t["source"] == "csv_import"]
    assert len(imported) == len(NEW_ROWS)
    # Every description holds a keyword the automatic categorisation knows: none is left uncategorised.
    assert all(transaction["category_id"] is not None for transaction in imported)


def test_importing_the_same_statement_twice_adds_nothing(client):
    from app.services.demo_statement import NEW_ROWS, build_statement

    headers = start_demo(client)
    account_id = client.get("/accounts/", headers=headers).json()[0]["id"]
    upload = lambda: client.post(  # noqa: E731
        "/transactions/import",
        data={"account_id": str(account_id)},
        files={"file": ("statement.csv", build_statement().encode(), "text/csv")},
        headers=headers,
    ).json()

    upload()
    second = upload()

    assert second["created"] == 0
    assert second["skipped_duplicates"] == len(NEW_ROWS) + 2


def test_the_sample_statement_only_ever_exceeds_the_entertainment_budget_whatever_the_day(monkeypatch):
    """Importing the statement must not turn the dashboard into a wall of red, on any day of the year."""
    from app.core.categorization import categorize_transaction
    from app.services.demo_seed import BUDGETS, month_rows
    from app.services.demo_statement import build_statement

    def over_budget(today, first_day):
        spent = Counter()
        already_there = set()
        for row in month_rows(first_day, today):
            already_there.add((first_day.replace(day=row.day), row.description, row.amount))
            if row.category in BUDGETS and row.amount < 0:
                spent[row.category] += -row.amount
        for line in build_statement(today).splitlines()[1:]:
            when, description, amount = line.split(",")[0], ",".join(line.split(",")[1:-1]), line.split(",")[-1]
            try:
                day, value = date.fromisoformat(when), Decimal(amount)
            except (ValueError, ArithmeticError):
                continue  # the broken rows
            if (day, description, value) in already_there:
                continue  # an exact duplicate: the import skips it, so it adds nothing
            if (day.year, day.month) == (first_day.year, first_day.month) and value < 0:
                category = categorize_transaction(description)
                if category in BUDGETS:
                    spent[category] += -value
        return {category for category, total in spent.items() if total > BUDGETS[category]}

    for offset in range(366):
        today = date(2026, 10, 1) + timedelta(days=offset)
        assert over_budget(today, month_start(today, 0)) <= {"Entertainment"}, today
        # Last month already has its own deliberate overrun (the birthday dinner); the statement must not add to it.
        assert over_budget(today, month_start(today, 1)) <= {"Entertainment", "Dining Out"}, today
