from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
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

    model_config = {"from_attributes": True}