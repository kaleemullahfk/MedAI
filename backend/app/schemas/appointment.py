from pydantic import BaseModel, field_validator
from datetime import date
from typing import Optional

from app.schemas.user import UserResponse
from app.services.schedule import normalize_time


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    appointment_time: str
    reason: str = ""

    @field_validator("appointment_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        try:
            return normalize_time(value)
        except ValueError as exc:
            raise ValueError("appointment_time must be HH:MM (24h) or h:mm AM/PM.") from exc


class AppointmentReschedule(BaseModel):
    new_date: date
    new_time: str
    reason: Optional[str] = None

    @field_validator("new_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        try:
            return normalize_time(value)
        except ValueError as exc:
            raise ValueError("new_time must be HH:MM (24h) or h:mm AM/PM.") from exc


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
