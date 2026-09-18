def register_and_login(client, email="budgetuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}






def test_income_defaults_when_not_set(client):
    headers = register_and_login(client, email="incomedefault@example.com")
    response = client.get("/income/2026-09", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_set"] is False
    assert data["amount"] == "0"
    assert data["remaining"] == "0"
    assert data["is_over_allocated"] is False


def test_set_income_upserts(client):
    headers = register_and_login(client, email="incomeupsert@example.com")
    first = client.put("/income/2026-09", json={"amount": "16500.00"}, headers=headers)
    assert first.status_code == 200
    assert first.json()["amount"] == "16500.00"
    second = client.put("/income/2026-09", json={"amount": "17000.00"}, headers=headers)
    assert second.json()["amount"] == "17000.00"
    assert client.get("/income/2026-09", headers=headers).json()["is_set"] is True


def test_income_remaining_deducts_budgets(client):
    headers = register_and_login(client, email="incomeremaining@example.com")
    category = client.post("/categories/", json={"name": "Alloc"}, headers=headers).json()
    client.put("/income/2026-09", json={"amount": "10000.00"}, headers=headers)
    client.post(
        "/budgets/",
        json={"category_id": category["id"], "monthly_limit": "4000.00", "month": "2026-09"},
        headers=headers,
    )
    data = client.get("/income/2026-09", headers=headers).json()
    assert data["total_budgeted"] == "4000.00"
    assert data["remaining"] == "6000.00"
    assert data["is_over_allocated"] is False


def test_income_over_allocated_flag(client):
    headers = register_and_login(client, email="incomeover@example.com")
    category = client.post("/categories/", json={"name": "Over"}, headers=headers).json()
    client.put("/income/2026-09", json={"amount": "2000.00"}, headers=headers)
    client.post(
        "/budgets/",
        json={"category_id": category["id"], "monthly_limit": "1500.00", "month": "2026-09"},
        headers=headers,
    )
    client.put("/income/2026-09", json={"amount": "1000.00"}, headers=headers)
    data = client.get("/income/2026-09", headers=headers).json()
    assert data["remaining"] == "-500.00"
    assert data["is_over_allocated"] is True


def test_income_rejects_negative_and_bad_month(client):
    headers = register_and_login(client, email="incomebad@example.com")
    assert client.put("/income/2026-09", json={"amount": "-5"}, headers=headers).status_code == 422
    assert client.get("/income/2026-13", headers=headers).status_code == 422


def test_income_requires_auth(client):
    assert client.get("/income/2026-09").status_code in (401, 403)
