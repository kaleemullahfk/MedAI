from conftest import login, auth_headers, conn
from app.services.schedule import normalize_time, slot_in_window
from app.models.doctor_profile import DoctorProfile
import pytest


# --- schedule helpers ---

def test_normalize_time():
    assert normalize_time("10:00 am") == "10:00"
    assert normalize_time("10:00 AM") == "10:00"
    assert normalize_time("10:00 pm") == "22:00"
    assert normalize_time("12:30 am") == "00:30"
    assert normalize_time("22:15") == "22:15"


def test_normalize_time_invalid():
    with pytest.raises(ValueError):
        normalize_time("24:00")
    with pytest.raises(ValueError):
        normalize_time("garbage")
    with pytest.raises(ValueError):
        normalize_time("13:60")


def test_slot_in_window():
    assert slot_in_window("09:00", "09:00 AM - 05:00 PM") is True
    assert slot_in_window("17:00", "09:00 AM - 05:00 PM") is True
    assert slot_in_window("18:00", "09:00 AM - 05:00 PM") is False


# --- API behavior ---

def _book(client, token, doctor_id, date, time, reason="check"):
    return client.post(
        "/appointment/",
        headers=auth_headers(token),
        json={
            "doctor_id": doctor_id,
            "appointment_date": date,
            "appointment_time": time,
            "reason": reason,
        },
    )


def test_appointment_schema_normalizes_time(client, seeded_users):
    from app.schemas.appointment import AppointmentCreate

    a = AppointmentCreate(
        doctor_id=1, appointment_date="2026-08-20", appointment_time="10:00 am", reason="x"
    )
    assert a.appointment_time == "10:00"


def test_appointment_bad_time_rejected(client, seeded_users):
    from pydantic import ValidationError

    from app.schemas.appointment import AppointmentCreate

    with pytest.raises(ValidationError):
        AppointmentCreate(
            doctor_id=1, appointment_date="2026-08-20", appointment_time="banana", reason="x"
        )


def test_appointment_outside_doctor_window(client, seeded_users):
    # Doctor has default available_time 09:00 AM - 05:00 PM.
    token = login(client, "patient@test.dev", "strongpass1")
    doctor_id = seeded_users["doctor_id"]

    res = _book(client, token, doctor_id, "2026-08-20", "18:00")
    assert res.status_code == 400


def test_appointment_booking_and_double_book(client, seeded_users):
    token = login(client, "patient@test.dev", "strongpass1")
    doctor_id = seeded_users["doctor_id"]

    res = _book(client, token, doctor_id, "2026-08-20", "10:00")
    assert res.status_code == 201

    # Same normalized slot via "10:00 am" must be rejected as duplicate.
    res2 = _book(client, token, doctor_id, "2026-08-20", "10:00 am")
    assert res2.status_code == 400


def test_appointment_past_date_rejected(client, seeded_users):
    token = login(client, "patient@test.dev", "strongpass1")
    doctor_id = seeded_users["doctor_id"]

    res = _book(client, token, doctor_id, "2020-01-01", "10:00")
    assert res.status_code == 400
