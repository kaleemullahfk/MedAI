import os
import re

from conftest import login, auth_headers, conn
from app.core.config import settings
from app.models.medical_record import MedicalReport


def _report_headers(client, email="patient@test.dev", password="strongpass1"):
    token = login(client, email, password)
    return auth_headers(token)


def test_upload_unsafe_extension(client, seeded_users):
    res = client.post(
        "/report/upload",
        headers=_report_headers(client),
        files={"file": ("evil.exe", b"%PDF-1.4", "application/octet-stream")},
        data={"title": "T"},
    )
    assert res.status_code == 400


def test_upload_content_mismatch_rejected(client, seeded_users):
    # .pdf extension but HTML content -> magic-byte sniff rejects.
    res = client.post(
        "/report/upload",
        headers=_report_headers(client),
        files={"file": ("fake.pdf", b"<html>not a pdf</html>", "application/pdf")},
        data={"title": "T"},
    )
    assert res.status_code == 422


def test_upload_no_extractable_text_rejected(client, seeded_users):
    # Real PDF magic but empty body -> extraction yields no text -> 422.
    res = client.post(
        "/report/upload",
        headers=_report_headers(client),
        files={"file": ("r.pdf", b"%PDF-1.4 fake", "application/pdf")},
        data={"title": "T"},
    )
    assert res.status_code == 422


def test_upload_stored_name_is_uuid(client, seeded_users, monkeypatch):
    # Monkeypatch extraction + Groq so the happy path works without Tesseract.
    import app.api.routes.report as report_mod

    monkeypatch.setattr(report_mod, "extract_text_from_pdf", lambda p: "blood sugar 120 mg/dL")
    monkeypatch.setattr(
        report_mod,
        "ask_groq_json",
        lambda prompt: {"summary": "Normal", "findings": [], "recommendations": []},
    )

    res = client.post(
        "/report/upload",
        headers=_report_headers(client),
        files={"file": ("My Report.pdf", b"%PDF-1.4 valid-ish", "application/pdf")},
        data={"title": "Lab"},
    )
    assert res.status_code == 201, res.text
    # file_path is intentionally NOT in the response schema; read it from the DB.
    s = conn.SessionLocal()
    try:
        record = s.query(MedicalReport).filter(MedicalReport.id == res.json()["id"]).first()
        stored = os.path.basename(record.file_path)
    finally:
        s.close()
    assert re.match(r"^[0-9a-f]{32}\.pdf$", stored), stored


def test_report_requires_patient_role(client, seeded_users):
    token = login(client, "doctor@test.dev", "strongpass1")
    res = client.post(
        "/report/upload",
        headers=auth_headers(token),
        files={"file": ("r.pdf", b"%PDF-1.4", "application/pdf")},
        data={"title": "T"},
    )
    # 403 (doctor role not allowed) — content sniff happens after auth.
    assert res.status_code == 403


def test_uploads_dir_is_configurable():
    assert settings.UPLOAD_DIR.endswith(".test-uploads")
