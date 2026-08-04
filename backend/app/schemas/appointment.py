from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.schemas.user import UserResponse


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    appointment_time: str
    reason: str


class AppointmentReschedule(BaseModel):
    new_date: date
    new_time: str
    reason: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: str
    reason: str
    status: str
    patient: Optional[UserResponse] = None
    doctor: Optional[UserResponse] = None

    class Config:
        from_attributes = True