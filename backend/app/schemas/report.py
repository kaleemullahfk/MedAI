from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schemas.user import UserResponse


class MedicalReportResponse(BaseModel):
    id: int
    patient_id: int
    title: str
    file_name: str
    file_type: str
    extracted_text: Optional[str] = None
    ai_analysis: Optional[str] = None
    uploaded_at: datetime
    patient: Optional[UserResponse] = None
    # Download URL (same-origin path resolved by the frontend BFF).
    download_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ReportPatientInfo(BaseModel):
    id: int
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None


class ReportAnalysisSummary(BaseModel):
    summary: Optional[str] = None
    abnormal_values: Optional[List[str]] = None
    abnormal_findings: Optional[List[str]] = None
    possible_diseases: Optional[List[str]] = None
    risk_level: Optional[str] = None
    recommendations: Optional[List[str]] = None
    lifestyle_advice: Optional[List[str]] = None
    exercise_advice: Optional[List[str]] = None
    follow_up: Optional[str] = None
    emergency_warning: Optional[str] = None


class ReportDetailResponse(BaseModel):
    id: int
    title: str
    file_name: str
    file_type: str
    uploaded_at: datetime
    download_url: Optional[str] = None
    patient: Optional[ReportPatientInfo] = None
    analysis: Optional[ReportAnalysisSummary] = None
    # Prior reports for this patient (for trend analysis), newest first.
    history: List[MedicalReportResponse] = []
