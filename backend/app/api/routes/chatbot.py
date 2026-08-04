from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.chat_history import ChatHistory
from app.services.current_user import get_current_user
from app.services.groq_service import ask_groq, wrap_user_input, PROMPT_INJECTION_GUARD
from app.prompts.chatbot_prompt import SYSTEM_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryItem

router = APIRouter(
    prefix="/chatbot",
    tags=["AI Health Chatbot"]
)


@router.post("/ask", response_model=ChatResponse)
def ask_chatbot(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    prompt = f"""
{SYSTEM_PROMPT}

{PROMPT_INJECTION_GUARD}

Question:
{wrap_user_input(request.question)}
"""
    try:
        answer = ask_groq(prompt)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service is unavailable. Please try again.",
            headers={"X-MEDAI-CODE": "AI_UNAVAILABLE"},
        )

    chat = ChatHistory(
        user_id=current_user.id,
        question=request.question,
        answer=answer
    )

    db.add(chat)
    db.commit()

    return {"answer": answer}


@router.get("/history", response_model=List[ChatHistoryItem])
def chat_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    chats = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at.asc(), ChatHistory.id.asc())
        .all()
    )

    return chats
