from sqlalchemy import Column, Integer, String, ForeignKey, Date, Index
from sqlalchemy.orm import relationship

from app.database.base import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, ForeignKey("users.id"))

    doctor_id = Column(Integer, ForeignKey("users.id"))

    appointment_date = Column(Date, nullable=False)

    appointment_time = Column(String, nullable=False)

    reason = Column(String, nullable=False)

    status = Column(String, default="Pending")

    patient = relationship("User", foreign_keys=[patient_id])

    doctor = relationship("User", foreign_keys=[doctor_id])

    # Indexes for the double-booking lookups and dashboard counts
    __table_args__ = (
        Index("ix_appointments_doctor_date", "doctor_id", "appointment_date"),
        Index("ix_appointments_patient_date", "patient_id", "appointment_date"),
    )
