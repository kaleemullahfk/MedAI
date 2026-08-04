from fastapi import APIRouter, Depends
import json

from app.schemas.symptom import SymptomRequest, SymptomResponse
from app.services.groq_service import ask_groq
from app.prompts.symptom_prompt import SYSTEM_PROMPT
from app.services.current_user import get_current_user

router = APIRouter(
    prefix="/symptom",
    tags=["AI Symptom Checker"]
)


@router.post("/check", response_model=SymptomResponse)
def check_symptoms(
    request: SymptomRequest,
    current_user=Depends(get_current_user)
):

    prompt = f"""
{SYSTEM_PROMPT}

Symptoms:

{request.symptoms}
"""
    response = ask_groq(prompt)

    print("\n========== GROQ RESPONSE ==========")
    print(response)
    print("===================================\n")

    return json.loads(response)