def register_and_login(client, email="dashuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def get_category_id(client, headers, name):
    categories = client.get("/categories/", headers=headers).json()
    return next(c["id"] for c in categories if c["name"] == name)


def test_spending_by_category(client):
    headers = register_and_login(client)
    groceries_id = get_category_id(client, headers, "Groceries")

    client.post(
        "/transactions/",
        json={"date": "2026-08-01", "description": "Milk", "amount": "-10.00", "category_id": groceries_id},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-08-05", "description": "Bread", "amount": "-5.00", "category_id": groceries_id},
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
        json={"date": "2026-08-01", "description": "Mystery expense", "amount": "-20.00"},
        headers=headers,
    )

    response = client.get("/transactions/dashboard/by-category", headers=headers)
    data = response.json()

    uncategorized_entry = next(d for d in data if d["category_id"] is None)
    assert uncategorized_entry["category_name"] == "Uncategorized"
    assert uncategorized_entry["total"] == "20.00"


def test_spending_by_month(client):
    headers = register_and_login(client)

    client.post(
        "/transactions/",
        json={"date": "2026-08-01", "description": "August expense", "amount": "-30.00"},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-09-01", "description": "September expense", "amount": "-15.00"},
        headers=headers,
    )

    response = client.get("/transactions/dashboard/by-month", headers=headers)
    assert response.status_code == 200
    data = response.json()

    august = next(d for d in data if d["month"] == "2026-08")
    september = next(d for d in data if d["month"] == "2026-09")
    assert august["total"] == "30.00"
    assert september["total"] == "15.00"


def test_dashboard_only_includes_own_transactions(client):
    headers_a = register_and_login(client, email="dashboardowner@example.com")
    headers_b = register_and_login(client, email="dashboardother@example.com")

    client.post(
        "/transactions/",
        json={"date": "2026-08-01", "description": "User A expense", "amount": "-100.00"},
        headers=headers_a,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-08-01", "description": "User B expense", "amount": "-999.00"},
        headers=headers_b,
    )

    response = client.get("/transactions/dashboard/by-category", headers=headers_a)
    data = response.json()

    total_across_categories = sum(float(d["total"]) for d in data)
    assert total_across_categories == 100.00


def test_dashboard_requires_auth(client):
    response = client.get("/transactions/dashboard/by-category")
    assert response.status_code == 401