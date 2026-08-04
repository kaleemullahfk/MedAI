from pydantic import BaseModel
from typing import List


class MedicineRequest(BaseModel):
    symptoms: str


class MedicineResponse(BaseModel):
    possible_conditions: List[str]
    otc_medicines: List[str]
    home_remedies: List[str]
    precautions: List[str]
    doctor_visit: str