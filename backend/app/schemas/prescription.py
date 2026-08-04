from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.user import UserResponse


class PrescriptionCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    diagnosis: str
    medicines: str
    instructions: Optional[str] = None


class PrescriptionUpdate(BaseModel):
    diagnosis: Optional[str] = None
    medicines: Optional[str] = None
    instructions: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    appointment_id: Optional[int] = None
    diagnosis: str
    medicines: str
    instructions: Optional[str] = None
    created_at: datetime
    doctor: Optional[UserResponse] = None
    patient: Optional[UserResponse] = None

    class Config:
        from_attributes = True
