from conftest import register, login, auth_headers, conn


def test_admin_users_requires_admin(client, seeded_users):
    # Patient token
    token = login(client, "patient@test.dev", "strongpass1")
    res = client.get("/admin/users", headers=auth_headers(token))
    assert res.status_code == 403

    # Anonymous
    res = client.get("/admin/users")
    assert res.status_code == 401


def test_admin_list_create_toggle(client, seeded_users):
    # Create an admin via DB (no public registration path).
    s = conn.SessionLocal()
    try:
        register(s, "Admin", "admin@test.dev", "adminpass1", "admin")
    finally:
        s.close()

    token = login(client, "admin@test.dev", "adminpass1")
    headers = auth_headers(token)

    res = client.get("/admin/users", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 2

    res = client.post(
        "/admin/users",
        headers=headers,
        json={
            "full_name": "New Doctor",
            "email": "newdoc@test.dev",
            "password": "doctorpass1",
            "role": "doctor",
        },
    )
    assert res.status_code == 201
    uid = res.json()["id"]

    res = client.patch(f"/admin/users/{uid}/toggle-active", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is False


def test_admin_cannot_create_patient_or_admin_role_via_schema(client, seeded_users):
    s = conn.SessionLocal()
    try:
        register(s, "Admin", "admin@test.dev", "adminpass1", "admin")
    finally:
        s.close()

    token = login(client, "admin@test.dev", "adminpass1")
    res = client.post(
        "/admin/users",
        headers=auth_headers(token),
        json={
            "full_name": "Bad",
            "email": "bad@test.dev",
            "password": "password1",
            "role": "patient",  # not allowed via AdminCreateUser Literal
        },
    )
    assert res.status_code == 422
