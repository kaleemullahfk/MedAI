from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, image
    extracted_text = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)  # JSON formatted analysis string
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("User", foreign_keys=[patient_id])
