from fastapi import APIRouter, Depends
import json

from app.schemas.medicine import (
    MedicineRequest,
    MedicineResponse
)

from app.prompts.medicine_prompt import SYSTEM_PROMPT
from app.services.groq_service import ask_groq
from app.services.current_user import get_current_user

router = APIRouter(
    prefix="/medicine",
    tags=["AI Medicine Recommendation"]
)


@router.post("/recommend", response_model=MedicineResponse)
def recommend_medicine(
    request: MedicineRequest,
    current_user=Depends(get_current_user)
):

    prompt = f"""
{SYSTEM_PROMPT}

Symptoms:

{request.symptoms}
"""

    response = ask_groq(prompt)

    return json.loads(response)