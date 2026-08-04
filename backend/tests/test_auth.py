from conftest import login, register, auth_headers, conn
from app.models.user import User


def test_register_admin_role_rejected(client):
    res = client.post(
        "/auth/register",
        json={
            "full_name": "Evil",
            "email": "evil@test.dev",
            "password": "longpass123",
            "role": "admin",
        },
    )
    assert res.status_code == 422  # Literal role in schema


def test_register_weak_password_rejected(client):
    res = client.post(
        "/auth/register",
        json={
            "full_name": "Ann",
            "email": "ann@test.dev",
            "password": "short",
            "role": "patient",
        },
    )
    assert res.status_code == 422


def test_register_and_login_and_me(client):
    res = client.post(
        "/auth/register",
        json={
            "full_name": "Ann",
            "email": "ann@test.dev",
            "password": "strongpass1",
            "role": "patient",
        },
    )
    assert res.status_code == 201

    token = login(client, "ann@test.dev", "strongpass1")
    res = client.get("/auth/me", headers=auth_headers(token))
    assert res.status_code == 200
    assert res.json()["email"] == "ann@test.dev"
    assert res.json()["role"] == "patient"


def test_login_wrong_password(client, seeded_users):
    res = client.post(
        "/auth/login",
        json={"email": "patient@test.dev", "password": "wrongpass1"},
    )
    assert res.status_code == 401


def test_forgot_password_does_not_leak_token(client, seeded_users):
    res = client.post(
        "/auth/forgot-password",
        json={"email": "patient@test.dev"},
    )
    assert res.status_code == 200
    assert "reset_token" not in res.json()
    # Known account message identical to unknown-account message (no enumeration).
    res2 = client.post("/auth/forgot-password", json={"email": "nobody@test.dev"})
    assert res2.json()["message"] == res.json()["message"]


def test_dev_reset_link_gated_by_environment(client, seeded_users):
    # Test env is "test", so the dev-only endpoint must be hidden.
    res = client.get("/auth/dev/reset-link/patient@test.dev")
    assert res.status_code == 404


def test_reset_password_flow(client, seeded_users):
    # Generate a reset token directly (mirrors forgot-password, which no longer
    # returns it in this env).
    s = conn.SessionLocal()
    try:
        user = s.query(User).filter(User.email == "patient@test.dev").first()
        from datetime import datetime, timedelta, timezone

        user.reset_token = "resettoken123"
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        s.commit()
    finally:
        s.close()

    res = client.post(
        "/auth/reset-password",
        json={"token": "resettoken123", "new_password": "newstrongpass1"},
    )
    assert res.status_code == 200

    token = login(client, "patient@test.dev", "newstrongpass1")
    assert token
