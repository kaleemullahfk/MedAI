from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

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

    admins = db.query(User).filter(
        User.role == "admin"
    ).count()

    appointments = db.query(Appointment).count()

    return {
        "doctors": doctors,
        "patients": patients,
        "admins": admins,
        "appointments": appointments,
    }


@router.get("/admin/analytics")
def admin_analytics(
    days: int = 30,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """Aggregated counts for the admin analytics dashboard.

    Returns daily counts of new users, appointments, reports, prescriptions
    and AI chats over the last ``days`` days, plus current totals.
    """
    days = max(1, min(days, 90))
    start = date.today() - timedelta(days=days - 1)

    def daily_counts(table_col):
        rows = (
            db.query(table_col, func.count())
            .filter(table_col >= start)
            .group_by(table_col)
            .all()
        )
        return {str(k): v for k, v in rows}

    appointments_by_day = daily_counts(Appointment.appointment_date)
    user_created_by_day = daily_counts(User.created_at)
    reports_by_day = daily_counts(MedicalReport.uploaded_at)
    prescriptions_by_day = daily_counts(Prescription.created_at)
    chats_by_day = daily_counts(ChatHistory.created_at)

    # Fill the full range so the frontend can chart a continuous series.
    series = []
    for i in range(days):
        day = start + timedelta(days=i)
        key = str(day)
        series.append(
            {
                "date": key,
                "new_users": user_created_by_day.get(key, 0),
                "appointments": appointments_by_day.get(key, 0),
                "reports": reports_by_day.get(key, 0),
                "prescriptions": prescriptions_by_day.get(key, 0),
                "chats": chats_by_day.get(key, 0),
            }
        )

    return {
        "days": days,
        "totals": {
            "doctors": db.query(User).filter(User.role == "doctor").count(),
            "patients": db.query(User).filter(User.role == "patient").count(),
            "admins": db.query(User).filter(User.role == "admin").count(),
            "appointments": db.query(Appointment).count(),
            "reports": db.query(MedicalReport).count(),
            "prescriptions": db.query(Prescription).count(),
            "chats": db.query(ChatHistory).count(),
        },
        "series": series,
    }
