import pytest

from app.core.limiter import limiter


@pytest.fixture
def rate_limiting_enabled():
    limiter.enabled = True
    limiter.reset()
    try:
        yield
    finally:
        limiter.reset()
        limiter.enabled = False


def test_login_is_rate_limited(client, rate_limiting_enabled):
    client.post(
        "/auth/register",
        json={"email": "ratelimit@example.com", "password": "securepass123"},
    )

    for _ in range(5):
        response = client.post(
            "/auth/login",
            json={"email": "ratelimit@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    blocked_response = client.post(
        "/auth/login",
        json={"email": "ratelimit@example.com", "password": "wrongpassword"},
    )
    assert blocked_response.status_code == 429
