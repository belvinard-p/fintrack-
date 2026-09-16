def register_and_login(client, email="audituser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_deleting_transaction_creates_audit_log(client):
    headers = register_and_login(client)
    transaction = client.post(
        "/transactions/",
        json={"date": "2026-08-01", "description": "Coffee", "amount": "-4.50"},
        headers=headers,
    ).json()

    client.delete(f"/transactions/{transaction['id']}", headers=headers)

    response = client.get("/audit-logs/", headers=headers)
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 1
    assert logs[0]["action"] == "delete_transaction"
    assert "Coffee" in logs[0]["details"]


def test_deleting_category_creates_audit_log(client):
    headers = register_and_login(client, email="catauditor@example.com")
    category = client.post(
        "/categories/", json={"name": "Temp"}, headers=headers
    ).json()

    client.delete(f"/categories/{category['id']}", headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "delete_category" for log in logs)


def test_deleting_budget_creates_audit_log(client):
    headers = register_and_login(client, email="budgetauditor@example.com")
    category = client.post(
        "/categories/", json={"name": "Groceries"}, headers=headers
    ).json()
    budget = client.post(
        "/budgets/",
        json={"category_id": category["id"], "monthly_limit": "100.00", "month": "2026-08"},
        headers=headers,
    ).json()

    client.delete(f"/budgets/{budget['id']}", headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "delete_budget" for log in logs)


def test_deleting_goal_creates_audit_log(client):
    headers = register_and_login(client, email="goalauditor@example.com")
    goal = client.post(
        "/goals/", json={"name": "Trip", "target_amount": "500.00"}, headers=headers
    ).json()

    client.delete(f"/goals/{goal['id']}", headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "delete_goal" for log in logs)


def test_csv_import_creates_audit_log(client):
    import io

    headers = register_and_login(client, email="csvauditor@example.com")
    csv_content = "date,description,amount\n2026-08-01,Test row,-1.00\n"
    files = {"file": ("statement.csv", io.BytesIO(csv_content.encode()), "text/csv")}

    client.post("/transactions/import", headers=headers, files=files)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "csv_import" for log in logs)


def test_audit_logs_only_show_own(client):
    headers_a = register_and_login(client, email="audita@example.com")
    headers_b = register_and_login(client, email="auditb@example.com")

    transaction = client.post(
        "/transactions/",
        json={"date": "2026-08-01", "description": "A's tx", "amount": "-1.00"},
        headers=headers_a,
    ).json()
    client.delete(f"/transactions/{transaction['id']}", headers=headers_a)

    logs_b = client.get("/audit-logs/", headers=headers_b).json()
    assert logs_b == []


def test_audit_logs_require_auth(client):
    response = client.get("/audit-logs/")
    assert response.status_code == 401
