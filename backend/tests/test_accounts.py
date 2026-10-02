from datetime import date

TODAY_ISO = date.today().isoformat()


def register_and_login(client, email="accountuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_creates_default_account(client):
    headers = register_and_login(client)
    response = client.get("/accounts/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Main account"
    assert data[0]["balance"] == "0.00" or data[0]["balance"] == "0"


def test_create_account(client):
    headers = register_and_login(client, email="createaccountuser@example.com")
    response = client.post(
        "/accounts/",
        json={"name": "Savings", "type": "savings", "opening_balance": "100.00"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Savings"
    assert data["type"] == "savings"
    assert data["opening_balance"] == "100.00"
    assert data["balance"] == "100.00"

    accounts = client.get("/accounts/", headers=headers).json()
    assert len(accounts) == 2


def test_list_accounts_computes_balance_from_transactions(client):
    headers = register_and_login(client, email="balanceuser@example.com")
    account = client.get("/accounts/", headers=headers).json()[0]

    client.post(
        "/transactions/",
        json={
            "account_id": account["id"],
            "date": TODAY_ISO,
            "description": "Salary",
            "amount": "1000.00",
        },
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={
            "account_id": account["id"],
            "date": TODAY_ISO,
            "description": "Groceries",
            "amount": "-50.00",
        },
        headers=headers,
    )

    accounts = client.get("/accounts/", headers=headers).json()
    assert accounts[0]["balance"] == "950.00"


def test_update_account_opening_balance_recalculates_balance(client):
    headers = register_and_login(client, email="updatebalanceuser@example.com")
    account = client.get("/accounts/", headers=headers).json()[0]

    client.post(
        "/transactions/",
        json={
            "account_id": account["id"],
            "date": TODAY_ISO,
            "description": "Groceries",
            "amount": "-50.00",
        },
        headers=headers,
    )

    response = client.patch(
        f"/accounts/{account['id']}",
        json={"opening_balance": "200.00"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["balance"] == "150.00"


def test_delete_account_blocked_when_referenced(client):
    headers = register_and_login(client, email="blockeddeleteuser@example.com")
    account = client.get("/accounts/", headers=headers).json()[0]
    client.post(
        "/accounts/",
        json={"name": "Second account"},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={
            "account_id": account["id"],
            "date": TODAY_ISO,
            "description": "Groceries",
            "amount": "-50.00",
        },
        headers=headers,
    )

    response = client.delete(f"/accounts/{account['id']}", headers=headers)
    assert response.status_code == 400


def test_delete_account_allowed_when_empty(client):
    headers = register_and_login(client, email="emptydeleteuser@example.com")
    second_account = client.post(
        "/accounts/",
        json={"name": "Second account"},
        headers=headers,
    ).json()

    response = client.delete(f"/accounts/{second_account['id']}", headers=headers)
    assert response.status_code == 204

    remaining = client.get("/accounts/", headers=headers).json()
    assert len(remaining) == 1


def test_delete_account_blocked_when_last_one(client):
    headers = register_and_login(client, email="lastaccountuser@example.com")
    account = client.get("/accounts/", headers=headers).json()[0]

    response = client.delete(f"/accounts/{account['id']}", headers=headers)
    assert response.status_code == 400


def test_account_endpoints_require_auth(client):
    response = client.get("/accounts/")
    assert response.status_code == 401


def test_accounts_scoped_to_user(client):
    headers_a = register_and_login(client, email="accountsa@example.com")
    headers_b = register_and_login(client, email="accountsb@example.com")

    client.post("/accounts/", json={"name": "A's extra account"}, headers=headers_a)

    accounts_b = client.get("/accounts/", headers=headers_b).json()
    assert len(accounts_b) == 1
    assert accounts_b[0]["name"] == "Main account"
