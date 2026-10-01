from datetime import date, timedelta

TODAY = date.today()
TODAY_ISO = TODAY.isoformat()
CURRENT_MONTH = TODAY.strftime("%Y-%m")
_last_day_of_previous_month = TODAY.replace(day=1) - timedelta(days=1)
PREVIOUS_MONTH = _last_day_of_previous_month.strftime("%Y-%m")
_first_day_of_next_month = (TODAY.replace(day=28) + timedelta(days=4)).replace(day=1)
NEXT_MONTH = _first_day_of_next_month.strftime("%Y-%m")


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
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
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


def test_create_budget_rejects_past_month(client):
    headers = register_and_login(client, email="budgetpastmonth@example.com")
    category_id = get_category_id(client, headers, "Groceries")

    response = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": PREVIOUS_MONTH},
        headers=headers,
    )
    assert response.status_code == 400


def test_create_duplicate_budget_rejected(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    response = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "300.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    assert response.status_code == 400


def test_update_budget_limit(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
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
    assert data["month"] == CURRENT_MONTH


def test_update_budget_category(client):
    headers = register_and_login(client)
    groceries_id = get_category_id(client, headers, "Groceries")
    dining_id = get_category_id(client, headers, "Dining Out")

    created = client.post(
        "/budgets/",
        json={"category_id": groceries_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
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
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
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
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    created_next_month = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "150.00", "month": NEXT_MONTH},
        headers=headers,
    ).json()

    response = client.patch(
        f"/budgets/{created_next_month['id']}",
        json={"month": CURRENT_MONTH},
        headers=headers,
    )
    assert response.status_code == 400


def test_update_budget_rejects_when_budget_in_locked_month(client, db_session):
    from app.models.budget import Budget

    headers = register_and_login(client, email="budgetlockedupdate@example.com")
    category_id = get_category_id(client, headers, "Groceries")
    user_id = client.get("/auth/me", headers=headers).json()["id"]

    budget = Budget(user_id=user_id, category_id=category_id, monthly_limit="200.00", month=PREVIOUS_MONTH)
    db_session.add(budget)
    db_session.commit()
    db_session.refresh(budget)

    response = client.patch(
        f"/budgets/{budget.id}",
        json={"monthly_limit": "250.00"},
        headers=headers,
    )
    assert response.status_code == 400


def test_update_budget_rejects_moving_month_into_locked_month(client):
    headers = register_and_login(client, email="budgetmovelocked@example.com")
    category_id = get_category_id(client, headers, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
        headers=headers,
    ).json()

    response = client.patch(
        f"/budgets/{created['id']}",
        json={"month": PREVIOUS_MONTH},
        headers=headers,
    )
    assert response.status_code == 400


def test_cannot_update_another_users_budget(client):
    headers_a = register_and_login(client, email="budgetupdatera@example.com")
    headers_b = register_and_login(client, email="budgetupdaterb@example.com")
    category_id = get_category_id(client, headers_a, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
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


def test_delete_own_budget(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
        headers=headers,
    ).json()

    response = client.delete(f"/budgets/{created['id']}", headers=headers)
    assert response.status_code == 204

    status_response = client.get(f"/budgets/status?month={CURRENT_MONTH}", headers=headers)
    assert status_response.json() == []


def test_delete_budget_rejects_when_budget_in_locked_month(client, db_session):
    from app.models.budget import Budget

    headers = register_and_login(client, email="budgetlockeddelete@example.com")
    category_id = get_category_id(client, headers, "Groceries")
    user_id = client.get("/auth/me", headers=headers).json()["id"]

    budget = Budget(user_id=user_id, category_id=category_id, monthly_limit="200.00", month=PREVIOUS_MONTH)
    db_session.add(budget)
    db_session.commit()
    db_session.refresh(budget)

    response = client.delete(f"/budgets/{budget.id}", headers=headers)
    assert response.status_code == 400


def test_delete_budget_allows_recreating_same_category_and_month(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
        headers=headers,
    ).json()

    client.delete(f"/budgets/{created['id']}", headers=headers)

    response = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "300.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    assert response.status_code == 201


def test_cannot_delete_another_users_budget(client):
    headers_a = register_and_login(client, email="budgetdeletera@example.com")
    headers_b = register_and_login(client, email="budgetdeleterb@example.com")
    category_id = get_category_id(client, headers_a, "Groceries")

    created = client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
        headers=headers_a,
    ).json()

    response = client.delete(f"/budgets/{created['id']}", headers=headers_b)
    assert response.status_code == 404


def test_delete_nonexistent_budget(client):
    headers = register_and_login(client)
    response = client.delete("/budgets/999999", headers=headers)
    assert response.status_code == 404


def test_budget_status_under_budget(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Groceries")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "200.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "Groceries run", "amount": "-50.00", "category_id": category_id},
        headers=headers,
    )

    response = client.get(f"/budgets/status?month={CURRENT_MONTH}", headers=headers)
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
        json={"category_id": category_id, "monthly_limit": "10.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "Fancy dinner", "amount": "-45.00", "category_id": category_id},
        headers=headers,
    )

    response = client.get(f"/budgets/status?month={CURRENT_MONTH}", headers=headers)
    data = response.json()
    entry = next(d for d in data if d["category_id"] == category_id)
    assert entry["actual_spending"] == "45.00"
    assert entry["is_over_budget"] is True


def test_budget_status_ignores_income(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Transport")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "10000.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": TODAY_ISO, "description": "Refund", "amount": "500.00", "category_id": category_id},
        headers=headers,
    )

    response = client.get(f"/budgets/status?month={CURRENT_MONTH}", headers=headers)
    data = response.json()
    entry = next(d for d in data if d["category_id"] == category_id)
    assert entry["actual_spending"] == "0"
    assert entry["is_over_budget"] is False


def test_budget_status_with_no_transactions(client):
    headers = register_and_login(client)
    category_id = get_category_id(client, headers, "Rent")

    client.post(
        "/budgets/",
        json={"category_id": category_id, "monthly_limit": "500.00", "month": CURRENT_MONTH},
        headers=headers,
    )

    response = client.get(f"/budgets/status?month={CURRENT_MONTH}", headers=headers)
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
        json={"category_id": category_id, "monthly_limit": "999.00", "month": CURRENT_MONTH},
        headers=headers_a,
    )

    response = client.get(f"/budgets/status?month={CURRENT_MONTH}", headers=headers_b)
    data = response.json()
    assert len(data) == 0


def test_create_budget_requires_auth(client):
    response = client.post(
        "/budgets/",
        json={"category_id": 1, "monthly_limit": "100.00", "month": CURRENT_MONTH},
    )
    assert response.status_code == 401

def test_create_budget_rejected_when_income_fully_budgeted(client):
    headers = register_and_login(client, email="capuser@example.com")
    first = get_category_id(client, headers, "Groceries")
    second = get_category_id(client, headers, "Dining Out")
    client.put(f"/income/{CURRENT_MONTH}", json={"amount": "1000.00"}, headers=headers)

    ok = client.post(
        "/budgets/",
        json={"category_id": first, "monthly_limit": "1000.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    assert ok.status_code == 201

    blocked = client.post(
        "/budgets/",
        json={"category_id": second, "monthly_limit": "1.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    assert blocked.status_code == 400
    assert "0.00 left" in blocked.json()["detail"]


def test_update_budget_cannot_exceed_income_but_can_shrink(client):
    headers = register_and_login(client, email="capupdate@example.com")
    first = get_category_id(client, headers, "Groceries")
    second = get_category_id(client, headers, "Dining Out")
    client.put(f"/income/{CURRENT_MONTH}", json={"amount": "1000.00"}, headers=headers)
    a = client.post("/budgets/", json={"category_id": first, "monthly_limit": "600.00", "month": CURRENT_MONTH}, headers=headers).json()
    client.post("/budgets/", json={"category_id": second, "monthly_limit": "300.00", "month": CURRENT_MONTH}, headers=headers)

    too_much = client.patch(f"/budgets/{a['id']}", json={"monthly_limit": "701.00"}, headers=headers)
    assert too_much.status_code == 400
    exact = client.patch(f"/budgets/{a['id']}", json={"monthly_limit": "700.00"}, headers=headers)
    assert exact.status_code == 200
    shrink = client.patch(f"/budgets/{a['id']}", json={"monthly_limit": "100.00"}, headers=headers)
    assert shrink.status_code == 200


def test_budget_not_capped_when_income_not_set(client):
    headers = register_and_login(client, email="nocap@example.com")
    category = get_category_id(client, headers, "Groceries")
    response = client.post(
        "/budgets/",
        json={"category_id": category, "monthly_limit": "999999.00", "month": CURRENT_MONTH},
        headers=headers,
    )
    assert response.status_code == 201
