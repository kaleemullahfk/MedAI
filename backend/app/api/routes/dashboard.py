from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.user import User
from app.models.appointment import Appointment
from app.models.medical_record import MedicalReport
from app.models.prescription import Prescription
from app.models.chat_history import ChatHistory

from app.services.role_checker import require_role

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/patient")
def patient_dashboard(
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id
    ).count()

    reports = db.query(MedicalReport).filter(
        MedicalReport.patient_id == current_user.id
    ).count()

    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == current_user.id
    ).count()

    chat_history = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).count()

    return {
        "appointments": appointments,
        "reports": reports,
        "prescriptions": prescriptions,
        "chat_history": chat_history,
    }


@router.get("/doctor")
def doctor_dashboard(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id
    ).count()

    patients = (
        db.query(Appointment.patient_id)
        .filter(Appointment.doctor_id == current_user.id)
        .distinct()
        .count()
    )

    # Reports authored for this doctor's patients.
    patient_ids = (
        db.query(Appointment.patient_id)
        .filter(Appointment.doctor_id == current_user.id)
        .distinct()
        .subquery()
    )
    reports = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id.in_(patient_ids))
        .count()
    )

    chats = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).count()

    return {
        "appointments": appointments,
        "patients": patients,
        "reports": reports,
        "chats": chats,
    }


@router.get("/admin")
def admin_dashboard(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    doctors = db.query(User).filter(
        User.role == "doctor"
    ).count()

    patients = db.query(User).filter(
        User.role == "patient"
    ).count()

    appointments = db.query(Appointment).count()

    return {
        "doctors": doctors,
        "patients": patients,
        "appointments": appointments,
    }
