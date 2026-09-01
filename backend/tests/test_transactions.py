def register_and_login(client, email="txuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_transaction(client):
    headers = register_and_login(client)
    response = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Groceries", "amount": "45.99"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["description"] == "Groceries"
    assert data["amount"] == "45.99"
    assert data["source"] == "manual"


def test_create_transaction_requires_auth(client):
    response = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Groceries", "amount": "45.99"},
    )
    assert response.status_code == 401


def test_list_transactions_only_returns_own(client):
    headers_a = register_and_login(client, email="usera@example.com")
    headers_b = register_and_login(client, email="userb@example.com")


    client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "User A tx", "amount": "10.00"},
        headers=headers_a,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "User B tx", "amount": "20.00"},
        headers=headers_b,
    )

    response = client.get("/transactions/", headers=headers_a)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["description"] == "User A tx"


def test_get_single_transaction(client):
    headers = register_and_login(client)
    create_response = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Coffee", "amount": "4.50"},
        headers=headers,
    )
    tx_id = create_response.json()["id"]

    response = client.get(f"/transactions/{tx_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["description"] == "Coffee"



def test_get_nonexistent_transaction(client):
    headers = register_and_login(client)
    response = client.get("/transactions/9999", headers=headers)
    assert response.status_code == 404


def test_cannot_access_another_users_transaction(client):
    headers_a = register_and_login(client, email="ownera@example.com")
    headers_b = register_and_login(client, email="ownerb@example.com")

    create_response = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Private tx", "amount": "99.00"},
        headers=headers_a,
    )
    tx_id = create_response.json()["id"]

    response = client.get(f"/transactions/{tx_id}", headers=headers_b)
    assert response.status_code == 404


def test_update_transaction(client):
    headers = register_and_login(client)
    create_response = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Original", "amount": "10.00"},
        headers=headers,
    )
    tx_id = create_response.json()["id"]

    response = client.patch(

        f"/transactions/{tx_id}",
        json={"amount": "15.00"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == "15.00"
    assert data["description"] == "Original"  # unchanged


def test_delete_transaction(client):
    headers = register_and_login(client)
    create_response = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "To delete", "amount": "5.00"},
        headers=headers,
    )
    tx_id = create_response.json()["id"]

    delete_response = client.delete(f"/transactions/{tx_id}", headers=headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/transactions/{tx_id}", headers=headers)
    assert get_response.status_code == 404