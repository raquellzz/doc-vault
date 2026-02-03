from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
import uuid
from typing import List, Optional

# Imports do seu projeto
from app.core.database import get_db
from app.models.schemas import User, Conversation, Message, SenderType
from app.services.backend.auth import get_current_user
# Import do Agente de IA (certifique-se que o caminho está correto)
from app.services.ai.agent import get_chat_response

router = APIRouter(tags=["Chat Operations"])

class CreateConversationRequest(BaseModel):
    title: str = "Nova Conversa"

class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str
    created_at: str

class MessageRequest(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: uuid.UUID
    sender: str
    content: str
    created_at: str

    class Config:
        from_attributes = True


@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Retorna a lista de todas as conversas do usuário atual.
    """
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(desc(Conversation.created_at))
        .all()
    )
    
    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            created_at=c.created_at.strftime("%Y-%m-%d %H:%M")
        ) for c in conversations
    ]

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    request: CreateConversationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Cria uma nova conversa para o usuário atual.
    """
    new_id = uuid.uuid4()
    
    new_conv = Conversation(id=new_id, user_id=user.id, title=request.title)
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    return ConversationResponse(
        id=new_conv.id, 
        title=new_conv.title, 
        created_at=new_conv.created_at.strftime("%Y-%m-%d %H:%M")
    )

@router.get("/conversations/{conversation_id}", response_model=List[MessageResponse])
def get_conversation_history(
    conversation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Obtém o histórico de mensagens de uma conversa específica.
    """
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")

    chat = db.query(Conversation).filter(Conversation.id == conv_uuid, Conversation.user_id == user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    messages = db.query(Message).filter(Message.conversation_id == conv_uuid).order_by(Message.created_at.asc()).all()
    
    return [
        MessageResponse(
            id=m.id,
            sender=m.sender_type.value,
            content=m.content,
            created_at=m.created_at.strftime("%H:%M")
        ) for m in messages
    ]

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    request: MessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Envia uma nova mensagem para a conversa especificada.
    """
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de conversa inválido")

    conversation = db.query(Conversation).filter(
        Conversation.id == conv_uuid, 
        Conversation.user_id == user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    user_msg = Message(
        conversation_id=conversation.id,
        sender_type=SenderType.USER,
        content=request.content,
    )
    db.add(user_msg)
    db.commit()

    # Recuperar histórico para contexto (RAG)
    # Pegamos as últimas 10, ordenamos por data desc para pegar as recentes,
    # depois invertemos [::-1] para mandar cronologicamente para a IA
    past_messages_objs = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(desc(Message.created_at))
        .limit(10)
        .all()
    )
    past_messages_objs = past_messages_objs[::-1]

    chat_history = []
    for msg in past_messages_objs:
        role = "user" if msg.sender_type == SenderType.USER else "assistant"
        chat_history.append({"role": role, "content": msg.content})

    try:
        response_text = get_chat_response(
            message=request.content, 
            chat_history=chat_history, 
            user_id=str(user.id)
        )
    except Exception as e:
        print(f"Erro na IA: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar resposta da IA.")

    ai_msg = Message(
        conversation_id=conversation.id,
        sender_type=SenderType.ASSISTANT,
        content=response_text,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    if conversation.title == "Nova Conversa":
        conversation.title = request.content[:30] + "..."
        db.commit()

    return MessageResponse(
        id=ai_msg.id,
        sender=ai_msg.sender_type.value,
        content=ai_msg.content,
        created_at=ai_msg.created_at.strftime("%H:%M")
    )