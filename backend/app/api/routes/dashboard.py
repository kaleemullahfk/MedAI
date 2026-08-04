from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.user import User
from app.models.appointment import Appointment

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

    return {
        "appointments": appointments,
        "reports": 0,
        "prescriptions": 0,
        "chat_history": 0,
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

    return {
        "appointments": appointments,
        "patients": patients,
        "reports": 0,
        "chats": 0,
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