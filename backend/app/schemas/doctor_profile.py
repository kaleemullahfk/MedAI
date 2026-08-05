from pydantic import BaseModel
from typing import Optional
from app.schemas.user import UserResponse


class DoctorProfileCreate(BaseModel):
    specialization: str
    qualification: str
    experience: int
    hospital: str
    consultation_fee: int
    available_days: str
    available_time: str
    license_number: Optional[str] = None


class DoctorProfileUpdate(BaseModel):
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[int] = None
    hospital: Optional[str] = None
    consultation_fee: Optional[int] = None
    available_days: Optional[str] = None
    available_time: Optional[str] = None
    license_number: Optional[str] = None


class DoctorProfileResponse(BaseModel):
    id: int
    user_id: int
    specialization: str
    qualification: str
    experience: int
    hospital: str
    consultation_fee: int
    available_days: str
    available_time: str
    license_number: Optional[str] = None
    is_verified: bool = True
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}