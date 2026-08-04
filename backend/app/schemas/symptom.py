from pydantic import BaseModel
from typing import List


class SymptomRequest(BaseModel):
    symptoms: str


class SymptomResponse(BaseModel):
    possible_conditions: List[str]
    urgency: str
    recommended_specialist: str
    advice: List[str]