from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.base import Base


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    specialization = Column(String, nullable=False, default="General Medicine")
    qualification = Column(String, nullable=False, default="MBBS")
    experience = Column(Integer, nullable=False, default=1)
    hospital = Column(String, nullable=False, default="General Hospital")
    consultation_fee = Column(Integer, nullable=False, default=50)
    available_days = Column(String, nullable=False, default="Monday - Friday")
    available_time = Column(String, nullable=False, default="09:00 AM - 05:00 PM")
    is_verified = Column(Boolean, default=True)

    user = relationship("User")