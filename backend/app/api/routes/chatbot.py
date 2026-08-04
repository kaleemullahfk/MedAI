from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.chat import Chat
from app.services.current_user import get_current_user
from app.services.groq_service import ask_groq
from app.prompts.chatbot_prompt import SYSTEM_PROMPT
from app.schemas.chat import ChatRequest, ChatResponse

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

Question:

{request.question}
"""

    answer = ask_groq(prompt)

    chat = Chat(
        user_id=current_user.id,
        question=request.question,
        answer=answer
    )

    db.add(chat)
    db.commit()

    return {
        "answer": answer
    }

@router.get("/history")
def chat_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    chats = (
        db.query(Chat)
        .filter(Chat.user_id == current_user.id)
        .all()
    )

    return chats