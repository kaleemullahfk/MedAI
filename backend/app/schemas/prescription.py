from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from app.schemas.user import UserResponse


class MedicineItem(BaseModel):
    medicine: str
    strength: str = ""
    dosage: str = ""
    frequency: str = ""
    duration: str = ""
    route: str = ""
    instructions: str = ""


class PrescriptionCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    report_id: Optional[int] = None
    diagnosis: str
    clinical_findings: Optional[str] = None
    ai_summary: Optional[str] = None
    severity: Optional[str] = None
    medicines: str  # JSON string of MedicineItem[]
    lifestyle_advice: Optional[str] = None
    diet_recommendations: Optional[str] = None
    exercise_recommendations: Optional[str] = None
    hydration_advice: Optional[str] = None
    follow_up: Optional[str] = None
    lab_tests: Optional[str] = None
    emergency_warnings: Optional[str] = None
    interactions: Optional[str] = None
    notes: Optional[str] = None
    status: str = "draft"


class PrescriptionUpdate(BaseModel):
    diagnosis: Optional[str] = None
    clinical_findings: Optional[str] = None
    ai_summary: Optional[str] = None
    severity: Optional[str] = None
    medicines: Optional[str] = None
    lifestyle_advice: Optional[str] = None
    diet_recommendations: Optional[str] = None
    exercise_recommendations: Optional[str] = None
    hydration_advice: Optional[str] = None
    follow_up: Optional[str] = None
    lab_tests: Optional[str] = None
    emergency_warnings: Optional[str] = None
    interactions: Optional[str] = None
    notes: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    appointment_id: Optional[int] = None
    report_id: Optional[int] = None
    status: str
    diagnosis: str
    clinical_findings: Optional[str] = None
    ai_summary: Optional[str] = None
    severity: Optional[str] = None
    medicines: str
    lifestyle_advice: Optional[str] = None
    diet_recommendations: Optional[str] = None
    exercise_recommendations: Optional[str] = None
    hydration_advice: Optional[str] = None
    follow_up: Optional[str] = None
    lab_tests: Optional[str] = None
    emergency_warnings: Optional[str] = None
    interactions: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    doctor: Optional[UserResponse] = None
    patient: Optional[UserResponse] = None
    report_title: Optional[str] = None

    model_config = {"from_attributes": True}
