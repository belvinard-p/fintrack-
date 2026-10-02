from datetime import date

TODAY_ISO = date.today().isoformat()
CURRENT_MONTH = date.today().strftime("%Y-%m")


def register_and_login(client, email="audituser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def default_account_id(client, headers):
    return client.get("/accounts/", headers=headers).json()[0]["id"]


def test_creating_transaction_creates_audit_log(client):
    headers = register_and_login(client, email="createtxauditor@example.com")
    account_id = default_account_id(client, headers)
    client.post(
        "/transactions/",
        json={"account_id": account_id, "date": TODAY_ISO, "description": "Coffee", "amount": "-4.50"},
        headers=headers,
    )

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "create_transaction" and "Coffee" in log["details"] for log in logs)


def test_updating_transaction_creates_audit_log(client):
    headers = register_and_login(client, email="updatetxauditor@example.com")
    account_id = default_account_id(client, headers)
    transaction = client.post(
        "/transactions/",
        json={"account_id": account_id, "date": TODAY_ISO, "description": "Coffee", "amount": "-4.50"},
        headers=headers,
    ).json()

    client.patch(f"/transactions/{transaction['id']}", json={"description": "Tea"}, headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "update_transaction" and "Tea" in log["details"] for log in logs)


def test_deleting_transaction_creates_audit_log(client):
    headers = register_and_login(client)
    account_id = default_account_id(client, headers)
    transaction = client.post(
        "/transactions/",
        json={"account_id": account_id, "date": TODAY_ISO, "description": "Coffee", "amount": "-4.50"},
        headers=headers,
    ).json()

    client.delete(f"/transactions/{transaction['id']}", headers=headers)

    response = client.get("/audit-logs/", headers=headers)
    assert response.status_code == 200
    logs = response.json()
    delete_logs = [log for log in logs if log["action"] == "delete_transaction"]
    assert len(delete_logs) == 1
    assert "Coffee" in delete_logs[0]["details"]


def test_deleting_category_creates_audit_log(client):
    headers = register_and_login(client, email="catauditor@example.com")
    category = client.post(
        "/categories/", json={"name": "Temp"}, headers=headers
    ).json()

    client.delete(f"/categories/{category['id']}", headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "delete_category" for log in logs)


def test_creating_budget_creates_audit_log(client):
    headers = register_and_login(client, email="createbudgetauditor@example.com")
    category = client.post("/categories/", json={"name": "Groceries"}, headers=headers).json()
    client.post(
        "/budgets/",
        json={"category_id": category["id"], "monthly_limit": "100.00", "month": CURRENT_MONTH},
        headers=headers,
    )

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "create_budget" for log in logs)


def test_updating_budget_creates_audit_log(client):
    headers = register_and_login(client, email="updatebudgetauditor@example.com")
    category = client.post("/categories/", json={"name": "Groceries"}, headers=headers).json()
    budget = client.post(
        "/budgets/",
        json={"category_id": category["id"], "monthly_limit": "100.00", "month": CURRENT_MONTH},
        headers=headers,
    ).json()

    client.patch(f"/budgets/{budget['id']}", json={"monthly_limit": "150.00"}, headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "update_budget" for log in logs)


def test_deleting_budget_creates_audit_log(client):
    headers = register_and_login(client, email="budgetauditor@example.com")
    category = client.post(
        "/categories/", json={"name": "Groceries"}, headers=headers
    ).json()
    budget = client.post(
        "/budgets/",
        json={"category_id": category["id"], "monthly_limit": "100.00", "month": CURRENT_MONTH},
        headers=headers,
    ).json()

    client.delete(f"/budgets/{budget['id']}", headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "delete_budget" for log in logs)


def test_creating_goal_creates_audit_log(client):
    headers = register_and_login(client, email="creategoalauditor@example.com")
    client.post("/goals/", json={"name": "Trip", "target_amount": "500.00"}, headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "create_goal" for log in logs)


def test_updating_goal_creates_audit_log(client):
    headers = register_and_login(client, email="updategoalauditor@example.com")
    goal = client.post(
        "/goals/", json={"name": "Trip", "target_amount": "500.00"}, headers=headers
    ).json()

    client.patch(f"/goals/{goal['id']}", json={"target_amount": "600.00"}, headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "update_goal" for log in logs)


def test_contributing_to_goal_creates_audit_log(client):
    headers = register_and_login(client, email="contributegoalauditor@example.com")
    account_id = default_account_id(client, headers)
    goal = client.post(
        "/goals/", json={"name": "Trip", "target_amount": "500.00"}, headers=headers
    ).json()

    client.post(
        f"/goals/{goal['id']}/contribute",
        json={"date": TODAY_ISO, "amount": "50.00", "account_id": account_id},
        headers=headers,
    )

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "contribute_to_goal" for log in logs)


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
    account_id = default_account_id(client, headers)
    csv_content = "date,description,amount\n2026-08-01,Test row,-1.00\n"
    files = {"file": ("statement.csv", io.BytesIO(csv_content.encode()), "text/csv")}

    client.post(
        "/transactions/import", headers=headers, files=files, data={"account_id": str(account_id)}
    )

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "csv_import" for log in logs)


def test_audit_logs_only_show_own(client):
    headers_a = register_and_login(client, email="audita@example.com")
    headers_b = register_and_login(client, email="auditb@example.com")
    account_id_a = default_account_id(client, headers_a)

    transaction = client.post(
        "/transactions/",
        json={"account_id": account_id_a, "date": TODAY_ISO, "description": "A's tx", "amount": "-1.00"},
        headers=headers_a,
    ).json()
    client.delete(f"/transactions/{transaction['id']}", headers=headers_a)

    logs_b = client.get("/audit-logs/", headers=headers_b).json()
    assert logs_b == []


def test_audit_logs_require_auth(client):
    response = client.get("/audit-logs/")
    assert response.status_code == 401


def test_creating_recurring_transaction_creates_audit_log(client):
    headers = register_and_login(client, email="createrecurringauditor@example.com")
    account_id = default_account_id(client, headers)
    client.post(
        "/recurring-transactions/",
        json={
            "account_id": account_id,
            "description": "Rent",
            "amount": "-1000.00",
            "day_of_month": 1,
            "start_date": "2026-01-01",
        },
        headers=headers,
    )

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "create_recurring_transaction" for log in logs)


def test_updating_recurring_transaction_creates_audit_log(client):
    headers = register_and_login(client, email="updaterecurringauditor@example.com")
    account_id = default_account_id(client, headers)
    recurring = client.post(
        "/recurring-transactions/",
        json={
            "account_id": account_id,
            "description": "Rent",
            "amount": "-1000.00",
            "day_of_month": 1,
            "start_date": "2026-01-01",
        },
        headers=headers,
    ).json()

    client.patch(f"/recurring-transactions/{recurring['id']}", json={"amount": "-1100.00"}, headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "update_recurring_transaction" for log in logs)


def test_setting_income_creates_audit_log(client):
    headers = register_and_login(client, email="incomeauditor@example.com")
    client.put(f"/income/{CURRENT_MONTH}", json={"amount": "3000.00"}, headers=headers)

    logs = client.get("/audit-logs/", headers=headers).json()
    assert any(log["action"] == "set_income" for log in logs)
