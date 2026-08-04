from pydantic import BaseModel
from typing import List


class PrescriptionResponse(BaseModel):
    medicines: List[str]
    purpose: List[str]
    dosage: List[str]
    precautions: List[str]
    doctor_advice: str