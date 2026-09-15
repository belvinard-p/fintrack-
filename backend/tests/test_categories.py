def register_and_login(client, email="catuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_category(client):
    headers = register_and_login(client)
    response = client.post("/categories/", json={"name": "Freelance Income"}, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Freelance Income"
    assert data["is_default"] is False


def test_create_duplicate_category_rejected(client):
    headers = register_and_login(client)
    client.post("/categories/", json={"name": "Side Projects"}, headers=headers)
    response = client.post("/categories/", json={"name": "Side Projects"}, headers=headers)
    assert response.status_code == 400



def test_get_nonexistent_category(client):
    headers = register_and_login(client)
    response = client.get("/categories/999999", headers=headers)
    assert response.status_code == 404


def test_update_own_category(client):
    headers = register_and_login(client)
    created = client.post("/categories/", json={"name": "Old Name"}, headers=headers).json()

    response = client.patch(f"/categories/{created['id']}", json={"name": "New Name"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_cannot_update_another_users_category(client):
    headers_a = register_and_login(client, email="catowner_a@example.com")
    headers_b = register_and_login(client, email="catowner_b@example.com")

    created = client.post("/categories/", json={"name": "A's Category"}, headers=headers_a).json()

    response = client.patch(
        f"/categories/{created['id']}", json={"name": "Hijacked"}, headers=headers_b
    )
    assert response.status_code == 404


def test_delete_own_category(client):
    headers = register_and_login(client)
    created = client.post("/categories/", json={"name": "To Delete"}, headers=headers).json()

    response = client.delete(f"/categories/{created['id']}", headers=headers)
    assert response.status_code == 204

    get_response = client.get(f"/categories/{created['id']}", headers=headers)
    assert get_response.status_code == 404


def test_delete_category_nullifies_transactions(client):
    headers = register_and_login(client)
    created = client.post("/categories/", json={"name": "Temp Category"}, headers=headers).json()

    tx = client.post(

        "/transactions/",
        json={"date": "2026-08-01", "description": "Test", "amount": "-10.00", "category_id": created["id"]},
        headers=headers,
    ).json()

    client.delete(f"/categories/{created['id']}", headers=headers)

    updated_tx = client.get(f"/transactions/{tx['id']}", headers=headers).json()
    assert updated_tx["category_id"] is None


def test_category_endpoints_require_auth(client):
    response = client.get("/categories/")
    assert response.status_code == 401