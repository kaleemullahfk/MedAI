from fastapi import APIRouter, Depends
import json

from app.schemas.disease import (
    DiseaseRequest,
    DiseaseResponse
)

from app.prompts.disease_prompt import SYSTEM_PROMPT
from app.services.groq_service import ask_groq
from app.services.current_user import get_current_user

router = APIRouter(
    prefix="/disease",
    tags=["AI Disease Explanation"]
)


@router.post("/explain", response_model=DiseaseResponse)
def explain_disease(
    request: DiseaseRequest,
    current_user=Depends(get_current_user)
):

    prompt = f"""
{SYSTEM_PROMPT}

Disease:

{request.disease}
"""

    response = ask_groq(prompt)

    return json.loads(response)