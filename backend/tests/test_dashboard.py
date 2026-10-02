from datetime import date, timedelta
from decimal import Decimal

from app.models.transaction import Transaction

TODAY = date.today()
TODAY_ISO = TODAY.isoformat()
CURRENT_MONTH = TODAY.strftime("%Y-%m")
_last_day_of_previous_month = TODAY.replace(day=1) - timedelta(days=1)
PREVIOUS_MONTH = _last_day_of_previous_month.strftime("%Y-%m")


def register_and_login(client, email="dashuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def get_category_id(client, headers, name):
    response = client.post("/categories/", json={"name": name}, headers=headers)
    return response.json()["id"]


def get_user_id(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


def insert_transaction(db_session, user_id, date_value, description, amount, category_id=None):
    tx = Transaction(
        user_id=user_id,
        date=date_value,
        description=description,
        amount=Decimal(amount),
        category_id=category_id,
    )
    db_session.add(tx)
    db_session.commit()
    db_session.refresh(tx)
    return tx


def test_spending_by_category(client):
    headers = register_and_login(client)
    groceries_id = get_category_id(client, headers, "Groceries")

    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "Milk", "amount": "-10.00", "category_id": groceries_id},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "Bread", "amount": "-5.00", "category_id": groceries_id},
        headers=headers,
    )

    response = client.get("/transactions/dashboard/by-category", headers=headers)
    assert response.status_code == 200
    data = response.json()

    groceries_entry = next(d for d in data if d["category_name"] == "Groceries")
    assert groceries_entry["total"] == "15.00"


def test_spending_by_category_groups_uncategorized(client):
    headers = register_and_login(client)

    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "Mystery expense", "amount": "-20.00"},
        headers=headers,
    )

    response = client.get("/transactions/dashboard/by-category", headers=headers)
    data = response.json()

    uncategorized_entry = next(d for d in data if d["category_id"] is None)
    assert uncategorized_entry["category_name"] == "Uncategorized"
    assert uncategorized_entry["total"] == "20.00"


def test_spending_by_month(client, db_session):
    headers = register_and_login(client)
    user_id = get_user_id(client, headers)

    # Previous month's expense already existed before the lock — inserted directly.
    insert_transaction(db_session, user_id, _last_day_of_previous_month, "Previous month expense", "-30.00")
    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "Current month expense", "amount": "-15.00"},
        headers=headers,
    )

    response = client.get("/transactions/dashboard/by-month", headers=headers)
    assert response.status_code == 200
    data = response.json()

    previous = next(d for d in data if d["month"] == PREVIOUS_MONTH)
    current = next(d for d in data if d["month"] == CURRENT_MONTH)
    assert previous["total"] == "30.00"
    assert current["total"] == "15.00"


def test_dashboard_only_includes_own_transactions(client):
    headers_a = register_and_login(client, email="dashboardowner@example.com")
    headers_b = register_and_login(client, email="dashboardother@example.com")

    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "User A expense", "amount": "-100.00"},
        headers=headers_a,
    )
    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "User B expense", "amount": "-999.00"},
        headers=headers_b,
    )

    response = client.get("/transactions/dashboard/by-category", headers=headers_a)
    data = response.json()

    total_across_categories = sum(float(d["total"]) for d in data)
    assert total_across_categories == 100.00


def test_dashboard_requires_auth(client):
    response = client.get("/transactions/dashboard/by-category")
    assert response.status_code == 401


def _months_ago_date(months: int, day: int = 15):
    month_index = TODAY.year * 12 + (TODAY.month - 1) - months
    year, month = divmod(month_index, 12)
    return date(year, month + 1, day)


def test_spending_by_month_excludes_income(client, db_session):
    headers = register_and_login(client, email="monthincome@example.com")
    user_id = get_user_id(client, headers)

    insert_transaction(db_session, user_id, TODAY, "Refund", "500.00")
    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "Expense", "amount": "-20.00"},
        headers=headers,
    )

    response = client.get("/transactions/dashboard/by-month", headers=headers)
    data = response.json()
    current = next(d for d in data if d["month"] == CURRENT_MONTH)
    assert current["total"] == "20.00"


def test_spending_by_month_excludes_older_than_12_months(client, db_session):
    headers = register_and_login(client, email="monthwindow@example.com")
    user_id = get_user_id(client, headers)

    insert_transaction(db_session, user_id, _months_ago_date(13), "Too old", "-999.00")
    insert_transaction(db_session, user_id, _months_ago_date(11), "Within window", "-40.00")

    response = client.get("/transactions/dashboard/by-month", headers=headers)
    data = response.json()
    months = {d["month"] for d in data}

    assert _months_ago_date(13).strftime("%Y-%m") not in months
    assert _months_ago_date(11).strftime("%Y-%m") in months
