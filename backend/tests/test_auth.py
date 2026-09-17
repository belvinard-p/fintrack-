def test_register_success(client):
    response = client.post(
        "/auth/register",
        json={"email": "newuser@example.com", "password": "securepass123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "password_hash" not in data
    assert "id" in data


def test_register_duplicate_email(client):
    client.post(
        "/auth/register",
        json={"email": "dupe@example.com", "password": "securepass123"},
    )
    response = client.post(
        "/auth/register",
        json={"email": "dupe@example.com", "password": "anotherpass456"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


def test_login_success(client):
    client.post(
        "/auth/register",
        json={"email": "logintest@example.com", "password": "securepass123"},
    )
    response = client.post(
        "/auth/login",

        json={"email": "logintest@example.com", "password": "securepass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post(
        "/auth/register",
        json={"email": "wrongpass@example.com", "password": "correctpass123"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "wrongpass456"},
    )
    assert response.status_code == 401


def test_protected_route_requires_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_protected_route_with_valid_token(client):
    client.post(
        "/auth/register",
        json={"email": "protected@example.com", "password": "securepass123"},
    )
    login_response = client.post(
        "/auth/login",

        json={"email": "protected@example.com", "password": "securepass123"},
    )
    token = login_response.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "protected@example.com"


def register_and_login(client, email="pwuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_rejects_short_password(client):
    response = client.post(
        "/auth/register",
        json={"email": "shortpass@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_change_password_success(client):
    headers = register_and_login(client, email="changepw@example.com", password="oldpass123")

    response = client.patch(
        "/auth/me/password",
        json={"current_password": "oldpass123", "new_password": "newpass456"},
        headers=headers,
    )
    assert response.status_code == 204

    old_login = client.post(
        "/auth/login", json={"email": "changepw@example.com", "password": "oldpass123"}
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/auth/login", json={"email": "changepw@example.com", "password": "newpass456"}
    )
    assert new_login.status_code == 200


def test_change_password_wrong_current_password(client):
    headers = register_and_login(client, email="wrongcurrentpw@example.com")

    response = client.patch(
        "/auth/me/password",
        json={"current_password": "notmypassword", "new_password": "newpass456"},
        headers=headers,
    )
    assert response.status_code == 401


def test_change_password_requires_auth(client):
    response = client.patch(
        "/auth/me/password",
        json={"current_password": "a", "new_password": "newpass456"},
    )
    assert response.status_code == 401


def test_change_email_success(client):
    headers = register_and_login(client, email="oldemail@example.com", password="securepass123")

    response = client.patch(
        "/auth/me/email",
        json={"current_password": "securepass123", "new_email": "newemail@example.com"},
        headers=headers,
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

    old_login = client.post(
        "/auth/login", json={"email": "oldemail@example.com", "password": "securepass123"}
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/auth/login", json={"email": "newemail@example.com", "password": "securepass123"}
    )
    assert new_login.status_code == 200


def test_change_email_wrong_current_password(client):
    headers = register_and_login(client, email="wrongpwemail@example.com")

    response = client.patch(
        "/auth/me/email",
        json={"current_password": "notmypassword", "new_email": "somenewemail@example.com"},
        headers=headers,
    )
    assert response.status_code == 401


def test_change_email_rejects_duplicate(client):
    client.post("/auth/register", json={"email": "taken@example.com", "password": "securepass123"})
    headers = register_and_login(client, email="wantsemail@example.com", password="securepass123")

    response = client.patch(
        "/auth/me/email",
        json={"current_password": "securepass123", "new_email": "taken@example.com"},
        headers=headers,
    )
    assert response.status_code == 400


def test_change_email_requires_auth(client):
    response = client.patch(
        "/auth/me/email",
        json={"current_password": "a", "new_email": "x@example.com"},
    )
    assert response.status_code == 401


def test_delete_account_removes_user_and_data(client):
    headers = register_and_login(client, email="deleteme@example.com")

    category = client.post(
        "/categories/", json={"name": "To be deleted"}, headers=headers
    ).json()
    transaction = client.post(
        "/transactions/",
        json={"date": "2026-08-01", "description": "Test", "amount": "-10.00", "category_id": category["id"]},
        headers=headers,
    ).json()
    client.post(
        "/budgets/",
        json={"category_id": category["id"], "monthly_limit": "100.00", "month": "2026-08"},
        headers=headers,
    )
    client.post(
        "/goals/",
        json={"name": "Test Goal", "target_amount": "500.00"},
        headers=headers,
    )
    client.post(
        "/recurring-transactions/",
        json={"description": "Rent", "amount": "-1000.00", "day_of_month": 1, "start_date": "2026-01-01"},
        headers=headers,
    )
    # Delete the transaction first so an audit log entry exists for this account too.
    client.delete(f"/transactions/{transaction['id']}", headers=headers)

    response = client.delete("/auth/me", headers=headers)
    assert response.status_code == 204

    login_response = client.post(
        "/auth/login", json={"email": "deleteme@example.com", "password": "securepass123"}
    )
    assert login_response.status_code == 401

    reregistered = client.post(
        "/auth/register", json={"email": "deleteme@example.com", "password": "brandnew123"}
    )
    assert reregistered.status_code == 201


def test_delete_account_requires_auth(client):
    response = client.delete("/auth/me")
    assert response.status_code == 401