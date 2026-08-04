from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.medicine import MedicineRequest, MedicineResponse
from app.prompts.medicine_prompt import SYSTEM_PROMPT
from app.services.groq_service import (
    ask_groq_json,
    wrap_user_input,
    PROMPT_INJECTION_GUARD,
)
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

{PROMPT_INJECTION_GUARD}

Symptoms:
{wrap_user_input(request.symptoms)}
"""
    try:
        return ask_groq_json(prompt)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service is unavailable. Please try again.",
            headers={"X-MEDAI-CODE": "AI_UNAVAILABLE"},
        )
