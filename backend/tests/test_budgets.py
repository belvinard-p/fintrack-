def register_and_login(client, email="budgetuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def get_category_id(client, headers, name):
    categories = client.get("/categories/", headers=headers).json()
    return next(c["id"] for c in categories if c["name"] == name)


def test_create_budget(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    response = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": "2026-08"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["category_name"] == "Groceries"
    assert data["monthly_limit"] == "200.00"


def test_create_budget_invalid_month_format(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    response = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": "2026-8"},
        headers=headers,
    )
    assert response.status_code == 422


def test_create_duplicate_budget_rejected(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": "2026-08"},
        headers=headers,
    )
    response = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "300.00", "month": "2026-08"},
        headers=headers,
    )
    assert response.status_code == 400


def test_budget_status_under_budget(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": "2026-08"},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-08-05", "description": "Groceries run", "amount": "-50.00", "category_id": category_id},
        headers=headers,
    )

    response = client.get("/budgets/status?month=2026-08", headers=headers)
    assert response.status_code == 200
    data = response.json()
    entry = next(d for d in data if d["category_id"] == category_id)
    assert entry["actual_spending"] == "50.00"
    assert entry["is_over_budget"] is False


def test_budget_status_over_budget(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Dining Out")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "10.00", "month": "2026-08"},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-08-05", "description": "Fancy dinner", "amount": "-45.00", "category_id": category_id},
        headers=headers,
    )

    response = client.get("/budgets/status?month=2026-08", headers=headers)
    data = response.json()
    entry = next(d for d in data if d["category_id"] == category_id)
    assert entry["actual_spending"] == "45.00"
    assert entry["is_over_budget"] is True


def test_budget_status_with_no_transactions(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Rent")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "500.00", "month": "2026-08"},
        headers=headers,
    )

    response = client.get("/budgets/status?month=2026-08", headers=headers)
    data = response.json()
    entry = next(d for d in data if d["category_id"] == category_id)
    assert entry["actual_spending"] == "0"
    assert entry["is_over_budget"] is False


def test_budgets_isolated_between_users(client):
    headers_a = register_and_login(client, email="budgetownera@example.com")
    headers_b = register_and_login(client, email="budgetownerb@example.com")
    category_id = get_category_id(client, headers_a, "Groceries")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "999.00", "month": "2026-08"},
        headers=headers_a,
    )

    response = client.get("/budgets/status?month=2026-08", headers=headers_b)
    data = response.json()
    assert len(data) == 0


def test_create_budget_requires_auth(client):
    response = client.post(
        "/budgets/",
        json={"category_id": 1, "monthly_limit": "100.00", "month": "2026-08"},
    )
    assert response.status_code == 401