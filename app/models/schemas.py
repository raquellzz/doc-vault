import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class SenderType(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "app"}

    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="viewer")
    
    documents = relationship("Document", back_populates="uploader")
    conversations = relationship("Conversation", back_populates="user")

class Document(Base):
    __tablename__ = "documents"
    __table_args__ = {"schema": "app"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    # Status: pending (upload feito), processing (ia lendo), active (pronto), error
    status = Column(String, default="pending") 
    total_chunks = Column(Integer, default=0)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("app.users.id"))
    
    uploader = relationship("User", back_populates="documents")

class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = {"schema": "app"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("app.users.id"))
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    __table_args__ = {"schema": "app"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("app.conversations.id"))
    sender_type = Column(Enum(SenderType), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")