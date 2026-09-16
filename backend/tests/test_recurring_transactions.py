from datetime import date, timedelta


def register_and_login(client, email="recurringuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_recurring_transaction(client):
    headers = register_and_login(client)
    response = client.post(
        "/recurring-transactions/",
        json={
            "description": "Rent",
            "amount": "-1200.00",
            "day_of_month": 1,
            "start_date": "2026-01-01",
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["description"] == "Rent"
    assert data["is_active"] is True
    assert data["last_generated_month"] is None


def test_create_recurring_transaction_rejects_invalid_day(client):
    headers = register_and_login(client)
    response = client.post(
        "/recurring-transactions/",
        json={
            "description": "Bad",
            "amount": "-10.00",
            "day_of_month": 31,
            "start_date": "2026-01-01",
        },
        headers=headers,
    )
    assert response.status_code == 422


def test_list_recurring_transactions_only_returns_own(client):
    headers_a = register_and_login(client, email="recurringa@example.com")
    headers_b = register_and_login(client, email="recurringb@example.com")

    client.post(
        "/recurring-transactions/",
        json={"description": "A's rent", "amount": "-500.00", "day_of_month": 1, "start_date": "2026-01-01"},
        headers=headers_a,
    )

    response = client.get("/recurring-transactions/", headers=headers_b)
    assert response.json() == []


def test_update_recurring_transaction(client):
    headers = register_and_login(client, email="recurringupdater@example.com")
    recurring = client.post(
        "/recurring-transactions/",
        json={"description": "Netflix", "amount": "-15.99", "day_of_month": 5, "start_date": "2026-01-01"},
        headers=headers,
    ).json()

    response = client.patch(
        f"/recurring-transactions/{recurring['id']}",
        json={"amount": "-17.99", "is_active": False},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["amount"] == "-17.99"
    assert response.json()["is_active"] is False


def test_delete_recurring_transaction(client):
    headers = register_and_login(client, email="recurringdeleter@example.com")
    recurring = client.post(
        "/recurring-transactions/",
        json={"description": "Gym", "amount": "-30.00", "day_of_month": 10, "start_date": "2026-01-01"},
        headers=headers,
    ).json()

    response = client.delete(f"/recurring-transactions/{recurring['id']}", headers=headers)
    assert response.status_code == 204

    remaining = client.get("/recurring-transactions/", headers=headers).json()
    assert remaining == []


def test_generate_creates_transaction_for_due_recurring(client):
    headers = register_and_login(client, email="generateuser@example.com")
    today = date.today()

    client.post(
        "/recurring-transactions/",
        json={
            "description": "Salary",
            "amount": "2500.00",
            "day_of_month": 1,
            "start_date": "2020-01-01",
        },
        headers=headers,
    )

    response = client.post("/recurring-transactions/generate", headers=headers)
    assert response.status_code == 200
    assert response.json()["created"] == 1

    transactions = client.get("/transactions/", headers=headers).json()["items"]
    assert len(transactions) == 1
    assert transactions[0]["description"] == "Salary"
    assert transactions[0]["source"] == "recurring"

    # Calling generate again this month should not duplicate it.
    second_response = client.post("/recurring-transactions/generate", headers=headers)
    assert second_response.json()["created"] == 0
    transactions_after = client.get("/transactions/", headers=headers).json()["items"]
    assert len(transactions_after) == 1


def test_generate_skips_recurring_not_yet_started(client):
    headers = register_and_login(client, email="notstarteduser@example.com")
    future_start = date.today() + timedelta(days=365)

    client.post(
        "/recurring-transactions/",
        json={
            "description": "Future bill",
            "amount": "-50.00",
            "day_of_month": 1,
            "start_date": future_start.isoformat(),
        },
        headers=headers,
    )

    response = client.post("/recurring-transactions/generate", headers=headers)
    assert response.json()["created"] == 0


def test_generate_skips_inactive_recurring(client):
    headers = register_and_login(client, email="inactiveuser@example.com")
    recurring = client.post(
        "/recurring-transactions/",
        json={
            "description": "Cancelled sub",
            "amount": "-9.99",
            "day_of_month": 1,
            "start_date": "2020-01-01",
        },
        headers=headers,
    ).json()
    client.patch(
        f"/recurring-transactions/{recurring['id']}",
        json={"is_active": False},
        headers=headers,
    )

    response = client.post("/recurring-transactions/generate", headers=headers)
    assert response.json()["created"] == 0


def test_recurring_transaction_endpoints_require_auth(client):
    response = client.get("/recurring-transactions/")
    assert response.status_code == 401
