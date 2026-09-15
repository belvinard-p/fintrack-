def register_and_login(client, email="budgetuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def get_category_id(client, headers, name):
    response = client.post("/categories/", json={"name": name}, headers=headers)
    return response.json()["id"]


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


def test_update_budget_limit(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": "2026-08"},
        headers=headers,
    ).json()

    response = client.patch(
        f"/budgets/{created['id']}",
        json={"monthly_limit": "250.00"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_limit"] == "250.00"
    assert data["category_name"] == "Groceries"
    assert data["month"] == "2026-08"


def test_update_budget_category(client):
    headers = register_and_login(client)
    groceries_id = get_category_id(client, headers, "Groceries")
    dining_id = get_category_id(client, headers, "Dining Out")

    created = client.post(
        "/budgets/",
        json={"category_id": groceries_id, "monthly_limit": "200.00", "month": "2026-08"},
        headers=headers,
    ).json()

    response = client.patch(
        f"/budgets/{created['id']}",
        json={"category_id": dining_id},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category_id"] == dining_id
    assert data["category_name"] == "Dining Out"


def test_update_budget_nonexistent_category_rejected(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": "2026-08"},
        headers=headers,
    ).json()

    response = client.patch(
        f"/budgets/{created['id']}",
        json={"category_id": 999999},
        headers=headers,
    )
    assert response.status_code == 404


def test_update_budget_conflict_rejected(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": "2026-08"},
        headers=headers,
    )
    created_september = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "150.00", "month": "2026-09"},
        headers=headers,
    ).json()

    response = client.patch(
        f"/budgets/{created_september['id']}",
        json={"month": "2026-08"},
        headers=headers,
    )
    assert response.status_code == 400


def test_cannot_update_another_users_budget(client):
    headers_a = register_and_login(client, email="budgetupdatera@example.com")
    headers_b = register_and_login(client, email="budgetupdaterb@example.com")
    category_id = get_category_id(client, headers_a, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": "2026-08"},
        headers=headers_a,
    ).json()

    response = client.patch(
        f"/budgets/{created['id']}",
        json={"monthly_limit": "1.00"},
        headers=headers_b,
    )
    assert response.status_code == 404


def test_update_nonexistent_budget(client):
    headers = register_and_login(client)
    response = client.patch(
        "/budgets/999999",
        json={"monthly_limit": "100.00"},
        headers=headers,
    )
    assert response.status_code == 404


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