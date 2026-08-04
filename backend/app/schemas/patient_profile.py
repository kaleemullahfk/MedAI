from pydantic import BaseModel
from typing import Optional


class PatientProfileCreate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None


class PatientProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None


class PatientProfileResponse(BaseModel):
    id: int
    user_id: int
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None

    model_config = {"from_attributes": True}