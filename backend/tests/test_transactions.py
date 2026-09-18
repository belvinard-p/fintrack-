from datetime import date, timedelta


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


def test_create_transaction_rejects_future_date(client):
    headers = register_and_login(client, email="futuredateuser@example.com")
    future_date = (date.today() + timedelta(days=1)).isoformat()
    response = client.post(
        "/transactions/",
        json={"date": future_date, "description": "Not yet", "amount": "10.00"},
        headers=headers,
    )
    assert response.status_code == 422


def test_update_transaction_rejects_future_date(client):
    headers = register_and_login(client, email="futureupdateuser@example.com")
    created = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Groceries", "amount": "45.99"},
        headers=headers,
    ).json()

    future_date = (date.today() + timedelta(days=1)).isoformat()
    response = client.patch(
        f"/transactions/{created['id']}",
        json={"date": future_date},
        headers=headers,
    )
    assert response.status_code == 422


def test_update_transaction_accepts_valid_date(client):
    headers = register_and_login(client, email="validupdateuser@example.com")
    category = client.post(
        "/categories/", json={"name": "Valid Update Category"}, headers=headers
    ).json()
    created = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Groceries", "amount": "45.99"},
        headers=headers,
    ).json()

    response = client.patch(
        f"/transactions/{created['id']}",
        json={
            "date": date.today().isoformat(),
            "description": "Updated groceries",
            "amount": "50.00",
            "category_id": category["id"],
        },
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == date.today().isoformat()
    assert data["description"] == "Updated groceries"
    assert data["category_id"] == category["id"]


def test_create_transaction_auto_categorizes_when_matching_category_exists(client):
    headers = register_and_login(client, email="autocatuser@example.com")
    category = client.post(
        "/categories/", json={"name": "Transport"}, headers=headers
    ).json()

    response = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "UBER TRIP", "amount": "-12.30"},
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["category_id"] == category["id"]


def test_create_transaction_leaves_uncategorized_when_no_matching_category(client):
    headers = register_and_login(client, email="nocatuser@example.com")

    response = client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "UBER TRIP", "amount": "-12.30"},
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["category_id"] is None


def test_create_transaction_respects_explicit_category(client):
    headers = register_and_login(client, email="explicitcatuser@example.com")
    transport_category = client.post(
        "/categories/", json={"name": "Transport"}, headers=headers
    ).json()
    custom_category = client.post(
        "/categories/", json={"name": "My Custom Category"}, headers=headers
    ).json()

    response = client.post(
        "/transactions/",
        json={
            "date": "2026-08-15",
            "description": "UBER TRIP",
            "amount": "-12.30",
            "category_id": custom_category["id"],
        },
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["category_id"] == custom_category["id"]
    assert response.json()["category_id"] != transport_category["id"]


def test_export_transactions_csv(client):
    headers = register_and_login(client, email="exportuser@example.com")
    category = client.post(
        "/categories/", json={"name": "Export Category"}, headers=headers
    ).json()
    client.post(
        "/transactions/",
        json={
            "date": "2026-08-15",
            "description": "Exported tx",
            "amount": "-25.00",
            "category_id": category["id"],
        },
        headers=headers,
    )

    response = client.get("/transactions/export", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]

    body = response.text
    lines = body.strip().splitlines()
    assert lines[0] == "date,description,amount,category,source"
    assert "Exported tx" in lines[1]
    assert "Export Category" in lines[1]


def test_export_transactions_requires_auth(client):
    response = client.get("/transactions/export")
    assert response.status_code == 401


def test_export_transactions_pdf(client):
    headers = register_and_login(client, email="exportpdfuser@example.com")
    category = client.post(
        "/categories/", json={"name": "PDF Category"}, headers=headers
    ).json()
    client.post(
        "/transactions/",
        json={
            "date": "2026-08-15",
            "description": "PDF export tx",
            "amount": "-30.00",
            "category_id": category["id"],
        },
        headers=headers,
    )

    response = client.get("/transactions/export/pdf", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF")


def test_export_transactions_pdf_requires_auth(client):
    response = client.get("/transactions/export/pdf")
    assert response.status_code == 401


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
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["description"] == "User A tx"


def test_list_transactions_pagination(client):
    headers = register_and_login(client, email="paginationuser@example.com")

    for i in range(5):
        client.post(
            "/transactions/",
            json={"date": "2026-08-15", "description": f"Tx {i}", "amount": "10.00"},
            headers=headers,
        )

    response = client.get("/transactions/?page=1&page_size=2", headers=headers)
    data = response.json()
    assert data["total"] == 5
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] == 3
    assert len(data["items"]) == 2

    page_two = client.get("/transactions/?page=2&page_size=2", headers=headers).json()
    assert len(page_two["items"]) == 2
    assert page_two["items"] != data["items"]


def test_list_transactions_search(client):
    headers = register_and_login(client, email="searchuser@example.com")
    client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Starbucks Coffee", "amount": "-4.50"},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Rent payment", "amount": "-1200.00"},
        headers=headers,
    )

    response = client.get("/transactions/?search=coffee", headers=headers)
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["description"] == "Starbucks Coffee"


def test_list_transactions_filter_by_category(client):
    headers = register_and_login(client, email="filteruser@example.com")
    category = client.post(
        "/categories/", json={"name": "Test Category"}, headers=headers
    ).json()

    client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Categorized", "amount": "-10.00", "category_id": category["id"]},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "Uncategorized", "amount": "-20.00"},
        headers=headers,
    )

    response = client.get(f"/transactions/?category_id={category['id']}", headers=headers)
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["description"] == "Categorized"


def test_list_transactions_filter_by_date_range(client):
    headers = register_and_login(client, email="daterangeuser@example.com")
    client.post(
        "/transactions/",
        json={"date": "2026-01-01", "description": "January", "amount": "-10.00"},
        headers=headers,
    )
    client.post(
        "/transactions/",
        json={"date": "2026-08-15", "description": "August", "amount": "-10.00"},
        headers=headers,
    )

    response = client.get(
        "/transactions/?date_from=2026-08-01&date_to=2026-08-31", headers=headers
    )
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["description"] == "August"


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

def test_monthly_summary_totals_and_previous_month(client):
    headers = register_and_login(client, email="summaryuser@example.com")
    client.put("/income/2026-08", json={"amount": "1000.00"}, headers=headers)
    client.put("/income/2026-09", json={"amount": "3000.00"}, headers=headers)
    for d, desc, amount in [
        ("2026-08-12", "Old rent", "-400.00"),
        ("2026-09-05", "Groceries", "-250.00"),
        ("2026-09-06", "Bus", "-50.00"),
    ]:
        client.post("/transactions/", json={"date": d, "description": desc, "amount": amount}, headers=headers)

    response = client.get("/transactions/dashboard/monthly-summary?month=2026-09", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["income_set"] is True
    assert data["total_income"] == "3000.00"
    assert data["total_expenses"] == "300.00"
    assert data["net"] == "2700.00"
    assert data["savings_rate"] == "90.0"
    assert data["transaction_count"] == 2
    assert data["previous"]["total_income"] == "1000.00"
    assert data["previous"]["total_expenses"] == "400.00"
    assert data["previous"]["net"] == "600.00"


def test_monthly_summary_empty_month(client):
    headers = register_and_login(client, email="emptysummary@example.com")
    response = client.get("/transactions/dashboard/monthly-summary?month=2026-01", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_count"] == 0
    assert data["income_set"] is False
    assert data["savings_rate"] is None
    assert data["expenses_by_category"] == []


def test_monthly_summary_rejects_bad_month(client):
    headers = register_and_login(client, email="badmonth@example.com")
    response = client.get("/transactions/dashboard/monthly-summary?month=2026-13", headers=headers)
    assert response.status_code == 422


def test_pdf_report_totals_use_declared_monthly_income():
    from datetime import date
    from decimal import Decimal
    from types import SimpleNamespace

    from app.services.pdf_export import build_month_rows, compute_totals

    transactions = [
        SimpleNamespace(date=date(2026, 9, 5), amount=Decimal("-250.00")),
        SimpleNamespace(date=date(2026, 9, 6), amount=Decimal("-50.00")),
        SimpleNamespace(date=date(2026, 8, 1), amount=Decimal("-100.00")),
        SimpleNamespace(date=date(2026, 8, 2), amount=Decimal("40.00")),
    ]
    rows = build_month_rows(transactions, {"2026-09": Decimal("3000.00")})
    assert rows == [
        ("2026-08", None, Decimal("100.00")),
        ("2026-09", Decimal("3000.00"), Decimal("300.00")),
    ]
    income, expenses, net = compute_totals(rows)
    assert income == Decimal("3000.00")
    assert expenses == Decimal("400.00")
    assert net == Decimal("2600.00")


def test_pdf_export_endpoint_with_monthly_income(client):
    headers = register_and_login(client, email="pdfincome@example.com")
    client.put("/income/2026-09", json={"amount": "3000.00"}, headers=headers)
    client.post(
        "/transactions/",
        json={"date": "2026-09-05", "description": "Groceries", "amount": "-250.00"},
        headers=headers,
    )
    response = client.get("/transactions/export/pdf", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
