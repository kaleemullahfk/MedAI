from pydantic import BaseModel, Field
from typing import List


class SymptomRequest(BaseModel):
    symptoms: str = Field(min_length=1, max_length=4000)


class SymptomResponse(BaseModel):
    possible_conditions: List[str]
    urgency: str
    recommended_specialist: str
    advice: List[str]
