from sqlalchemy import Column, Integer, String, ForeignKey, Date
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