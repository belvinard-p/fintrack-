from datetime import date, timedelta

TODAY = date.today()
TODAY_ISO = TODAY.isoformat()
FUTURE_ISO = (TODAY + timedelta(days=1)).isoformat()
_last_day_of_previous_month = TODAY.replace(day=1) - timedelta(days=1)


def register_and_login(client, email="debtuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def default_account_id(client, headers):
    return client.get("/accounts/", headers=headers).json()[0]["id"]


def create_debt(client, headers, **overrides):
    payload = {"name": "Car loan", "type": "loan", "principal": "10000.00", "annual_rate": "6.00"}
    payload.update(overrides)
    return client.post("/debts/", json=payload, headers=headers).json()


def test_create_debt(client):
    headers = register_and_login(client)
    response = client.post(
        "/debts/",
        json={"name": "Car loan", "type": "loan", "principal": "10000.00", "annual_rate": "6.00"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Car loan"
    assert data["remaining_balance"] == "10000.00"


def test_list_debts_empty_for_new_user(client):
    headers = register_and_login(client, email="nodebtsuser@example.com")
    response = client.get("/debts/", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_create_debt_payment_creates_transaction_and_splits_interest(client):
    headers = register_and_login(client, email="paymentuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers)

    response = client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "500.00", "account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 201
    payment = response.json()
    assert payment["interest_portion"] == "50.00"
    assert payment["principal_portion"] == "450.00"

    transactions = client.get("/transactions/", headers=headers).json()["items"]
    debt_tx = next(t for t in transactions if t["id"] == payment["transaction_id"])
    assert debt_tx["source"] == "debt_payment"
    assert debt_tx["amount"] == "-500.00"
    assert debt_tx["account_id"] == account_id

    debts = client.get("/debts/", headers=headers).json()
    assert debts[0]["remaining_balance"] == "9550.00"


def test_create_debt_payment_interest_free_debt_is_all_principal(client):
    headers = register_and_login(client, email="interestfreeuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers, annual_rate=None)

    response = client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "300.00", "account_id": account_id},
        headers=headers,
    )
    payment = response.json()
    assert payment["interest_portion"] == "0.00"
    assert payment["principal_portion"] == "300.00"


def test_create_debt_payment_overpayment_clamps_principal_to_zero(client):
    headers = register_and_login(client, email="overpayuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers, principal="100.00", annual_rate=None)

    response = client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "500.00", "account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 201
    payment = response.json()
    assert payment["principal_portion"] == "100.00"

    debts = client.get("/debts/", headers=headers).json()
    assert debts[0]["remaining_balance"] == "0.00"


def test_create_debt_payment_rejects_locked_month(client):
    headers = register_and_login(client, email="lockedpaymentuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers)

    response = client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": _last_day_of_previous_month.isoformat(), "amount": "100.00", "account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 400


def test_create_debt_payment_rejects_future_date(client):
    headers = register_and_login(client, email="futurepaymentuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers)

    response = client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": FUTURE_ISO, "amount": "100.00", "account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 422


def test_create_debt_payment_requires_valid_account(client):
    headers = register_and_login(client, email="badaccountuser@example.com")
    debt = create_debt(client, headers)

    response = client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "100.00", "account_id": 999999},
        headers=headers,
    )
    assert response.status_code == 404


def test_create_debt_payment_requires_valid_debt(client):
    headers = register_and_login(client, email="baddebtuser@example.com")
    account_id = default_account_id(client, headers)

    response = client.post(
        "/debts/999999/payments",
        json={"date": TODAY_ISO, "amount": "100.00", "account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 404


def test_delete_debt_blocked_when_has_payments(client):
    headers = register_and_login(client, email="blockeddebtdeleteuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers)
    client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "100.00", "account_id": account_id},
        headers=headers,
    )

    response = client.delete(f"/debts/{debt['id']}", headers=headers)
    assert response.status_code == 400


def test_delete_debt_allowed_when_no_payments(client):
    headers = register_and_login(client, email="emptydebtdeleteuser@example.com")
    debt = create_debt(client, headers)

    response = client.delete(f"/debts/{debt['id']}", headers=headers)
    assert response.status_code == 204

    remaining = client.get("/debts/", headers=headers).json()
    assert remaining == []


def test_deleting_transaction_cascades_debt_payment(client):
    headers = register_and_login(client, email="cascadeuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers)

    payment = client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "500.00", "account_id": account_id},
        headers=headers,
    ).json()

    delete_response = client.delete(f"/transactions/{payment['transaction_id']}", headers=headers)
    assert delete_response.status_code == 204

    payments = client.get(f"/debts/{debt['id']}/payments", headers=headers).json()
    assert payments == []

    debts = client.get("/debts/", headers=headers).json()
    assert debts[0]["remaining_balance"] == "10000.00"


def test_list_debt_payments_history(client):
    headers = register_and_login(client, email="historyuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers)

    client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "500.00", "account_id": account_id},
        headers=headers,
    )
    client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "200.00", "account_id": account_id},
        headers=headers,
    )

    response = client.get(f"/debts/{debt['id']}/payments", headers=headers)
    assert response.status_code == 200
    payments = response.json()
    assert len(payments) == 2
    for p in payments:
        assert p["date"] == TODAY_ISO
        assert "amount" in p


def test_debt_endpoints_require_auth(client):
    response = client.get("/debts/")
    assert response.status_code == 401


def test_debts_scoped_to_user(client):
    headers_a = register_and_login(client, email="debtsa@example.com")
    headers_b = register_and_login(client, email="debtsb@example.com")

    create_debt(client, headers_a)

    debts_b = client.get("/debts/", headers=headers_b).json()
    assert debts_b == []


def test_update_debt_recalculates_remaining_balance_after_principal_change(client):
    headers = register_and_login(client, email="updatedebtuser@example.com")
    account_id = default_account_id(client, headers)
    debt = create_debt(client, headers)

    client.post(
        f"/debts/{debt['id']}/payments",
        json={"date": TODAY_ISO, "amount": "500.00", "account_id": account_id},
        headers=headers,
    )

    response = client.patch(
        f"/debts/{debt['id']}",
        json={"principal": "20000.00"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["remaining_balance"] == "19550.00"
