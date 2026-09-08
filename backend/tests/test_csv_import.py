import io


def register_and_login(client, email="csvuser@example.com", password="securepass123"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def make_csv_file(content: str, filename: str = "statement.csv"):
    return {"file": (filename, io.BytesIO(content.encode()), "text/csv")}


def test_import_creates_transactions(client):
    headers = register_and_login(client)
    csv_content = (
        "date,description,amount\n"
        "2026-08-01,STARBUCKS COFFEE,-4.50\n"
        "2026-08-02,SALARY DEPOSIT,2500.00\n"
    )

    response = client.post(
        "/transactions/import",
        headers=headers,
        files=make_csv_file(csv_content),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["created"] == 2
    assert data["skipped_duplicates"] == 0
    assert data["total_rows"] == 2


def test_import_categorizes_transactions(client):
    headers = register_and_login(client)
    csv_content = (
        "date,description,amount\n"
        "2026-08-01,UBER TRIP,-12.30\n"
    )

    client.post("/transactions/import", headers=headers, files=make_csv_file(csv_content))

    list_response = client.get("/transactions/", headers=headers)
    transactions = list_response.json()
    assert len(transactions) == 1
    assert transactions[0]["description"] == "UBER TRIP"
    assert transactions[0]["category_id"] is not None


def test_import_skips_duplicates_on_second_upload(client):
    headers = register_and_login(client)
    csv_content = (
        "date,description,amount\n"
        "2026-08-01,STARBUCKS COFFEE,-4.50\n"
    )

    first_response = client.post(
        "/transactions/import", headers=headers, files=make_csv_file(csv_content)
    )
    assert first_response.json()["created"] == 1

    second_response = client.post(
        "/transactions/import", headers=headers, files=make_csv_file(csv_content)
    )
    data = second_response.json()
    assert data["created"] == 0
    assert data["skipped_duplicates"] == 1


def test_import_rejects_invalid_csv(client):
    headers = register_and_login(client)
    bad_csv = "not,the,right,columns\n1,2,3,4\n"

    response = client.post(
        "/transactions/import", headers=headers, files=make_csv_file(bad_csv)
    )
    assert response.status_code == 400


def test_import_requires_auth(client):
    csv_content = "date,description,amount\n2026-08-01,TEST,-1.00\n"
    response = client.post("/transactions/import", files=make_csv_file(csv_content))
    assert response.status_code == 401
