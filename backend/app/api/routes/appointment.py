from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentReschedule
)
from app.services.current_user import get_current_user
from app.services.role_checker import require_role

router = APIRouter(
    prefix="/appointment",
    tags=["Appointments"]
)


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    # Validation 1: Prevent booking in past dates
    if appointment.appointment_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book an appointment for a past date."
        )

    # Validation 2: Ensure target user exists and is a doctor
    doctor = db.query(User).filter(
        User.id == appointment.doctor_id,
        User.role == "doctor",
        User.is_active == True
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found or inactive."
        )

    # Validation 3: Prevent doctor double booking at exact date and time slot
    existing_doctor_slot = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.appointment_date == appointment.appointment_date,
        Appointment.appointment_time == appointment.appointment_time,
        Appointment.status.in_(["Pending", "Accepted"])
    ).first()

    if existing_doctor_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is already booked for the selected doctor. Please choose another time."
        )

    # Validation 4: Prevent patient double booking at exact date and time slot
    existing_patient_slot = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        Appointment.appointment_date == appointment.appointment_date,
        Appointment.appointment_time == appointment.appointment_time,
        Appointment.status.in_(["Pending", "Accepted"])
    ).first()

    if existing_patient_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active appointment scheduled at this date and time."
        )

    new_appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time.strip(),
        reason=appointment.reason.strip(),
        status="Pending"
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return new_appointment


@router.get("/my", response_model=List[AppointmentResponse])
def my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    # Patient Data Privacy: Return only this patient's appointments
    appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.doctor))
        .filter(Appointment.patient_id == current_user.id)
        .order_by(Appointment.appointment_date.desc())
        .all()
    )

    return appointments


@router.get("/doctor", response_model=List[AppointmentResponse])
def doctor_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    # Doctor Data Privacy: Return only appointments assigned to this doctor
    appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient))
        .filter(Appointment.doctor_id == current_user.id)
        .order_by(Appointment.appointment_date.asc())
        .all()
    )

    return appointments


@router.put("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Authorization Check
    if current_user.role == "patient" and appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this appointment.")
    if current_user.role == "doctor" and appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this appointment.")

    if appointment.status in ["Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail=f"Appointment is already {appointment.status.lower()}.")

    appointment.status = "Cancelled"
    db.commit()
    db.refresh(appointment)

    return appointment


@router.put("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    reschedule_data: AppointmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user.role == "patient" and appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    if current_user.role == "doctor" and appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")

    if reschedule_data.new_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot reschedule to a past date.")

    # Check slot collision
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.appointment_date == reschedule_data.new_date,
        Appointment.appointment_time == reschedule_data.new_time,
        Appointment.id != appointment.id,
        Appointment.status.in_(["Pending", "Accepted"])
    ).first()

    if conflict:
        raise HTTPException(status_code=400, detail="The requested time slot is not available.")

    appointment.appointment_date = reschedule_data.new_date
    appointment.appointment_time = reschedule_data.new_time
    if reschedule_data.reason:
        appointment.reason = reschedule_data.reason

    appointment.status = "Pending"
    db.commit()
    db.refresh(appointment)

    return appointment


@router.put("/{appointment_id}/accept", response_model=AppointmentResponse)
def accept_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appointment.status == "Accepted":
        raise HTTPException(status_code=400, detail="Appointment is already accepted.")
    if appointment.status in ["Completed", "Rejected", "Cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot accept an appointment that is {appointment.status.lower()}.")

    appointment.status = "Accepted"
    db.commit()
    db.refresh(appointment)

    return appointment


@router.put("/{appointment_id}/reject", response_model=AppointmentResponse)
def reject_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appointment.status in ["Completed", "Rejected", "Cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot reject an appointment that is {appointment.status.lower()}.")

    appointment.status = "Rejected"
    db.commit()
    db.refresh(appointment)

    return appointment


@router.put("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appointment.status == "Completed":
        raise HTTPException(status_code=400, detail="Appointment is already completed.")

    appointment.status = "Completed"
    db.commit()
    db.refresh(appointment)

    return appointment