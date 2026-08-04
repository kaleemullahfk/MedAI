"""Shared test fixtures.

Sets a test environment + a fixed SECRET_KEY before importing app config, then
rebuilds the engine against an in-memory SQLite DB with a StaticPool so every
session shares one connection. A fresh database is created for each test.
"""

import os
import sys
from pathlib import Path

# Ensure backend/ is importable when pytest runs from backend/.
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["UPLOAD_DIR"] = str(BACKEND_DIR / ".test-uploads")

import pytest  # noqa: E402
import sqlalchemy  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.database.base import Base  # noqa: E402
import app.database.connection as conn  # noqa: E402
import app.models  # noqa: E402,F401  (register all tables)
from app.main import app  # noqa: E402
from app.services.auth import hash_password  # noqa: E402
from app.models.user import User  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture()
def client():
    """Fresh in-memory DB + TestClient for every test."""
    engine = sqlalchemy.create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    conn.engine = engine
    conn.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as c:
        yield c

    Base.metadata.drop_all(bind=engine)


def register(db_session, full_name, email, password, role):
    user = User(
        full_name=full_name,
        email=email,
        password=hash_password(password),
        role=role,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def seeded_users(client):
    """A patient and a doctor, created directly in the DB (roles not public).

    The doctor gets a profile with a 09:00 AM - 05:00 PM availability window.
    """
    from app.models.doctor_profile import DoctorProfile

    s = conn.SessionLocal()
    try:
        patient = register(s, "Test Patient", "patient@test.dev", "strongpass1", "patient")
        doctor = register(s, "Test Doctor", "doctor@test.dev", "strongpass1", "doctor")
        s.add(
            DoctorProfile(
                user_id=doctor.id,
                specialization="Cardiology",
                qualification="MD",
                experience=10,
                hospital="Test Hospital",
                consultation_fee=100,
                available_days="Monday - Friday",
                available_time="09:00 AM - 05:00 PM",
            )
        )
        s.commit()
        # Return plain IDs, not ORM objects (accessing ORM attrs after the
        # session closes raises DetachedInstanceError).
        return {"patient_id": patient.id, "doctor_id": doctor.id}
    finally:
        s.close()


def login(client, email, password):
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
