from datetime import date, timedelta

from conftest import login, auth_headers, conn
from app.models.appointment import Appointment
from app.models.chat_history import ChatHistory
from app.models.medical_record import MedicalReport


def test_patient_dashboard_real_counts(client, seeded_users):
    token = login(client, "patient@test.dev", "strongpass1")
    s = conn.SessionLocal()
    try:
        patient_id = seeded_users["patient_id"]
        doctor_id = seeded_users["doctor_id"]
        s.add(
            Appointment(
                patient_id=patient_id,
                doctor_id=doctor_id,
                appointment_date=date.today() + timedelta(days=1),
                appointment_time="10:00",
                reason="x",
                status="Pending",
            )
        )
        s.add(
            ChatHistory(user_id=patient_id, question="hi", answer="hello")
        )
        s.add(
            MedicalReport(
                patient_id=patient_id,
                title="Lab",
                file_name="lab.pdf",
                file_path="/tmp/lab.pdf",
                file_type="pdf",
                extracted_text="ok",
                ai_analysis="{}",
            )
        )
        s.commit()
    finally:
        s.close()

    res = client.get("/dashboard/patient", headers=auth_headers(token))
    assert res.status_code == 200
    body = res.json()
    # Previously these were hardcoded zeros.
    assert body["appointments"] >= 1
    assert body["reports"] >= 1
    assert body["chat_history"] >= 1
