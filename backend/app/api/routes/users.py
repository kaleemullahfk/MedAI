from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.user import UserResponse
from app.services.current_user import get_current_user
from app.services.role_checker import require_role

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/doctor/patients", response_model=List[UserResponse])
def get_doctor_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    """Patients who have booked appointments with the current doctor."""
    patient_ids = (
        db.query(Appointment.patient_id)
        .filter(Appointment.doctor_id == current_user.id)
        .distinct()
        .subquery()
    )

    patients = (
        db.query(User)
        .filter(User.id.in_(patient_ids), User.role == "patient")
        .all()
    )

    return patients
