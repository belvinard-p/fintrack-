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