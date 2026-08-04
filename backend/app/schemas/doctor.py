from pydantic import BaseModel


class DoctorProfileCreate(BaseModel):
    specialization: str
    qualification: str
    experience: int
    hospital: str
    consultation_fee: int
    available_days: str
    available_time: str


class DoctorProfileResponse(BaseModel):
    id: int
    specialization: str
    qualification: str
    experience: int
    hospital: str
    consultation_fee: int
    available_days: str
    available_time: str

    class Config:
        from_attributes = True