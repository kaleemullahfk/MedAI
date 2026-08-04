from pydantic import BaseModel
from typing import List


class DiseaseRequest(BaseModel):
    disease: str


class DiseaseResponse(BaseModel):
    disease: str
    overview: str
    causes: List[str]
    symptoms: List[str]
    risk_factors: List[str]
    prevention: List[str]
    treatment: List[str]
    when_to_see_doctor: str