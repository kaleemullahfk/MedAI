from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    # Link to the medical report that drove the AI analysis (optional).
    report_id = Column(Integer, ForeignKey("medical_reports.id"), nullable=True, index=True)
    # Reference to the saved AI analysis payload (report's ai_analysis) so we
    # never regenerate it.
    ai_analysis_ref = Column(Text, nullable=True)

    # Status lifecycle: draft -> approved | rejected
    status = Column(String, nullable=False, default="draft", index=True)

    diagnosis = Column(Text, nullable=False)
    clinical_findings = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    severity = Column(String, nullable=True)

    # Structured medicines payload (JSON array of objects with medicine,
    # strength, dosage, frequency, duration, route, instructions).
    medicines = Column(Text, nullable=False)  # JSON string
    lifestyle_advice = Column(Text, nullable=True)
    diet_recommendations = Column(Text, nullable=True)
    exercise_recommendations = Column(Text, nullable=True)
    hydration_advice = Column(Text, nullable=True)
    follow_up = Column(Text, nullable=True)
    lab_tests = Column(Text, nullable=True)
    emergency_warnings = Column(Text, nullable=True)
    interactions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    doctor = relationship("User", foreign_keys=[doctor_id])
    patient = relationship("User", foreign_keys=[patient_id])
    appointment = relationship("Appointment")
    report = relationship("MedicalReport", foreign_keys=[report_id])
