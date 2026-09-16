def register_and_login(client, email="goaluser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


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


def test_contribute_to_goal(client):
    headers = register_and_login(client, email="contributor@example.com")
    goal = client.post(
        "/goals/", json={"name": "Vacation", "target_amount": "1000.00"}, headers=headers
    ).json()

    response = client.post(
        f"/goals/{goal['id']}/contribute", json={"amount": "250.00"}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["current_amount"] == "250.00"
    assert response.json()["is_completed"] is False

    second_response = client.post(
        f"/goals/{goal['id']}/contribute", json={"amount": "750.00"}, headers=headers
    )
    assert second_response.json()["current_amount"] == "1000.00"
    assert second_response.json()["is_completed"] is True


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


def test_goal_endpoints_require_auth(client):
    response = client.get("/goals/")
    assert response.status_code == 401
