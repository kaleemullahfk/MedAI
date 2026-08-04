from pydantic import BaseModel, Field
from typing import List


class DiseaseRequest(BaseModel):
    disease: str = Field(min_length=1, max_length=4000)


class DiseaseResponse(BaseModel):
    disease: str
    overview: str
    causes: List[str]
    symptoms: List[str]
    risk_factors: List[str]
    prevention: List[str]
    treatment: List[str]
    when_to_see_doctor: str
