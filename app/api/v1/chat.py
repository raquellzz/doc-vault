from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
import uuid
from typing import List, Dict, Any

from app.core.database import get_db
from app.models.schemas import User, Conversation, Message, SenderType
from app.services.backend.auth import get_current_user
from app.services.ai.agent import get_chat_response

router = APIRouter(tags=["Chat"])


class CreateConversationRequest(BaseModel):
    title: str = "Nova Conversa"


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str
    created_at: str


class ChatRequest(BaseModel):
    conversation_id: uuid.UUID
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    request: CreateConversationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Loop de segurança para garantir ID único (pedido explícito do usuário)
    while True:
        new_id = uuid.uuid4()
        exists = db.query(Conversation).filter(Conversation.id == new_id).first()
        if not exists:
            break

    new_conv = Conversation(id=new_id, user_id=user.id, title=request.title)
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    return ConversationResponse(
        id=new_conv.id, title=new_conv.title, created_at=str(new_conv.created_at)
    )


@router.post("/chat", response_model=ChatResponse)
def chat_with_docs(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 1. Verificar Conversa
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == request.conversation_id, Conversation.user_id == user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404, detail="Conversa não encontrada ou acesso negado."
        )

    # 2. Salvar mensagem do usuário
    user_msg = Message(
        conversation_id=conversation.id,
        sender_type=SenderType.USER,
        content=request.message,
    )
    db.add(user_msg)
    db.commit()  # Commit para garantir que ordem esteja certa no banco

    # 3. Recuperar histórico recente para contexto (ex: últimas 10 msgs)
    # Ordenamos por data descrescente e depois invertemos para cronológico
    past_messages_objs = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(desc(Message.created_at))
        .limit(10)
        .all()
    )

    # Inverter para ordem cronológica (antiga -> nova)
    past_messages_objs = past_messages_objs[::-1]

    # Formatar para o Agente
    chat_history = []
    for msg in past_messages_objs:
        role = "user" if msg.sender_type == SenderType.USER else "assistant"
        chat_history.append({"role": role, "content": msg.content})

    # 4. Invocar o Agente de IA com RAG
    # Importante: passamos user.id (string) para o filtro de segurança
    try:
        response_text = get_chat_response(
            message=request.message, chat_history=chat_history, user_id=str(user.id)
        )
    except Exception as e:
        print(f"Erro na IA: {e}")
        # Opcional: Retornar erro ou mensagem amigável
        # Vamos lançar erro 500 para debug, ou fallback
        raise HTTPException(
            status_code=500, detail=f"Erro ao processar resposta da IA: {str(e)}"
        )

    # 5. Salvar resposta do Assistente
    ai_msg = Message(
        conversation_id=conversation.id,
        sender_type=SenderType.ASSISTANT,
        content=response_text,
    )
    db.add(ai_msg)
    db.commit()

    return ChatResponse(response=response_text)
