from datetime import date, timedelta

TODAY = date.today()
TODAY_ISO = TODAY.isoformat()
FUTURE_ISO = (TODAY + timedelta(days=1)).isoformat()
_last_day_of_previous_month = TODAY.replace(day=1) - timedelta(days=1)


def register_and_login(client, email="goaluser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def default_account_id(client, headers):
    return client.get("/accounts/", headers=headers).json()[0]["id"]


def contribute(client, headers, goal_id, amount, date_value=TODAY_ISO, account_id=None):
    if account_id is None:
        account_id = default_account_id(client, headers)
    return client.post(
        f"/goals/{goal_id}/contribute",
        json={"date": date_value, "amount": amount, "account_id": account_id},
        headers=headers,
    )


def test_create_goal(client):
    headers = register_and_login(client)
    response = client.post(
        "/goals/",
        json={"name": "Emergency Fund", "target_amount": "1000.00", "target_date": "2026-12-31"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Emergency Fund"
    assert data["target_amount"] == "1000.00"
    assert data["current_amount"] == "0.00"
    assert data["is_completed"] is False


def test_create_goal_with_opening_amount(client):
    headers = register_and_login(client, email="openingamountuser@example.com")
    response = client.post(
        "/goals/",
        json={"name": "Already started", "target_amount": "1000.00", "opening_amount": "300.00"},
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["current_amount"] == "300.00"


def test_create_goal_requires_positive_target(client):
    headers = register_and_login(client)
    response = client.post(
        "/goals/",
        json={"name": "Bad Goal", "target_amount": "0.00"},
        headers=headers,
    )
    assert response.status_code == 422


def test_list_goals_only_returns_own(client):
    headers_a = register_and_login(client, email="goala@example.com")
    headers_b = register_and_login(client, email="goalb@example.com")

    client.post("/goals/", json={"name": "A's Goal", "target_amount": "500.00"}, headers=headers_a)
    client.post("/goals/", json={"name": "B's Goal", "target_amount": "500.00"}, headers=headers_b)

    response = client.get("/goals/", headers=headers_a)
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "A's Goal"


def test_contribute_to_goal_creates_transaction(client):
    headers = register_and_login(client, email="contributor@example.com")
    account_id = default_account_id(client, headers)
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()

    response = contribute(client, headers, goal["id"], "250.00", account_id=account_id)
    assert response.status_code == 201
    data = response.json()
    assert data["current_amount"] == "250.00"
    assert data["is_completed"] is False

    transactions = client.get("/transactions/", headers=headers).json()["items"]
    tx = transactions[0]
    assert tx["source"] == "goal_contribution"
    assert tx["amount"] == "-250.00"
    assert tx["account_id"] == account_id

    second_response = contribute(client, headers, goal["id"], "750.00", account_id=account_id)
    assert second_response.json()["current_amount"] == "1000.00"
    assert second_response.json()["is_completed"] is True


def test_contribute_to_goal_rejects_locked_month(client):
    headers = register_and_login(client, email="lockedgoaluser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()

    response = contribute(
        client, headers, goal["id"], "100.00", date_value=_last_day_of_previous_month.isoformat()
    )
    assert response.status_code == 400


def test_contribute_to_goal_rejects_future_date(client):
    headers = register_and_login(client, email="futuregoaluser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()

    response = contribute(client, headers, goal["id"], "100.00", date_value=FUTURE_ISO)
    assert response.status_code == 422


def test_contribute_to_goal_requires_valid_account(client):
    headers = register_and_login(client, email="badaccountgoaluser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()

    response = client.post(
        f"/goals/{goal['id']}/contribute",
        json={"date": TODAY_ISO, "amount": "100.00", "account_id": 999999},
        headers=headers,
    )
    assert response.status_code == 404


def test_update_goal(client):
    headers = register_and_login(client, email="updategoal@example.com")
    goal = client.post(
        "/goals/", json={"name": "Old Name", "target_amount": "500.00"}, headers=headers
    ).json()

    response = client.patch(
        f"/goals/{goal['id']}", json={"name": "New Name", "target_amount": "600.00"}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"
    assert response.json()["target_amount"] == "600.00"


def test_cannot_update_another_users_goal(client):
    headers_a = register_and_login(client, email="goalownera@example.com")
    headers_b = register_and_login(client, email="goalownerb@example.com")

    goal = client.post(
        "/goals/", json={"name": "Private Goal", "target_amount": "500.00"}, headers=headers_a
    ).json()

    response = client.patch(
        f"/goals/{goal['id']}", json={"name": "Hijacked"}, headers=headers_b
    )
    assert response.status_code == 404


def test_delete_goal(client):
    headers = register_and_login(client, email="deletegoal@example.com")
    goal = client.post(
        "/goals/", json={"name": "To Delete", "target_amount": "500.00"}, headers=headers
    ).json()

    response = client.delete(f"/goals/{goal['id']}", headers=headers)
    assert response.status_code == 204

    list_response = client.get("/goals/", headers=headers)
    assert list_response.json() == []


def test_delete_goal_blocked_when_has_contributions(client):
    headers = register_and_login(client, email="blockedgoaldeleteuser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()
    contribute(client, headers, goal["id"], "100.00")

    response = client.delete(f"/goals/{goal['id']}", headers=headers)
    assert response.status_code == 400


def test_deleting_transaction_cascades_goal_contribution(client):
    headers = register_and_login(client, email="cascadegoaluser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()

    contribute(client, headers, goal["id"], "250.00")

    transactions = client.get("/transactions/", headers=headers).json()["items"]
    tx_id = next(t["id"] for t in transactions if t["source"] == "goal_contribution")

    delete_response = client.delete(f"/transactions/{tx_id}", headers=headers)
    assert delete_response.status_code == 204

    goals = client.get("/goals/", headers=headers).json()
    assert goals[0]["current_amount"] == "0.00"

    contributions = client.get(f"/goals/{goal['id']}/contributions", headers=headers).json()
    assert contributions == []


def test_goal_endpoints_require_auth(client):
    response = client.get("/goals/")
    assert response.status_code == 401


def test_list_goal_contributions_history(client):
    headers = register_and_login(client, email="goalhistoryuser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()

    contribute(client, headers, goal["id"], "100.00")
    contribute(client, headers, goal["id"], "50.00")

    response = client.get(f"/goals/{goal['id']}/contributions", headers=headers)
    assert response.status_code == 200
    contributions = response.json()
    assert len(contributions) == 2
    for c in contributions:
        assert c["date"] == TODAY_ISO


def test_set_goal_allocation_upserts(client):
    headers = register_and_login(client, email="allocationuser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()
    current_month = TODAY.strftime("%Y-%m")

    response = client.put(
        f"/goals/{goal['id']}/allocations/{current_month}",
        json={"amount": "200.00"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["monthly_allocation"] == "200.00"

    response2 = client.put(
        f"/goals/{goal['id']}/allocations/{current_month}",
        json={"amount": "300.00"},
        headers=headers,
    )
    assert response2.json()["monthly_allocation"] == "300.00"

    status_response = client.get(f"/goals/status?month={current_month}", headers=headers)
    statuses = status_response.json()
    assert len(statuses) == 1
    assert statuses[0]["monthly_allocation"] == "300.00"


def test_set_goal_allocation_rejects_exceeding_income(client):
    headers = register_and_login(client, email="allocationincomeuser@example.com")
    current_month = TODAY.strftime("%Y-%m")
    client.put(f"/income/{current_month}", json={"amount": "100.00"}, headers=headers)
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()

    response = client.put(
        f"/goals/{goal['id']}/allocations/{current_month}",
        json={"amount": "150.00"},
        headers=headers,
    )
    assert response.status_code == 400


def test_set_goal_allocation_rejects_locked_month(client):
    headers = register_and_login(client, email="allocationlockeduser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()
    previous_month = _last_day_of_previous_month.strftime("%Y-%m")

    response = client.put(
        f"/goals/{goal['id']}/allocations/{previous_month}",
        json={"amount": "100.00"},
        headers=headers,
    )
    assert response.status_code == 400


def test_goal_status_scoped_to_month(client):
    headers = register_and_login(client, email="statusmonthuser@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()
    contribute(client, headers, goal["id"], "100.00", date_value=_last_day_of_previous_month.isoformat())

    current_month = TODAY.strftime("%Y-%m")
    response = client.get(f"/goals/status?month={current_month}", headers=headers)
    statuses = response.json()
    assert statuses[0]["monthly_contributed"] == "0.00"
