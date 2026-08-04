from pydantic import BaseModel, Field
from typing import List


class MedicineRequest(BaseModel):
    symptoms: str = Field(min_length=1, max_length=4000)


class MedicineResponse(BaseModel):
    possible_conditions: List[str]
    otc_medicines: List[str]
    home_remedies: List[str]
    precautions: List[str]
    doctor_visit: str
