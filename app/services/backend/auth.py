import os
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.security import TokenUser, validate_token_with_keycloak
from app.core.database import SessionLocal
from app.models.schemas import User as UserModel
import uuid
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("KEYCLOAK_REALM", "DocVault")
TOKEN_URL = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=TOKEN_URL)

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def sync_user_to_db(token_user: TokenUser, db: Session) -> UserModel:
    """
    Sincroniza o usuário do Token (Keycloak) com o Banco Local.
    """
    db_user = db.query(UserModel).filter(UserModel.id == token_user.id).first()
    
    determined_role = "admin" if "admin" in token_user.roles else "viewer"
    
    if not db_user:
        # Cria novo usuário
        new_user = UserModel(
            id=uuid.UUID(token_user.id),
            email=token_user.username, 
            full_name=token_user.username,
            role=determined_role 
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    else:
        if db_user.role != determined_role:
            db_user.role = determined_role
            db.commit()
            db.refresh(db_user)
            
        return db_user

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserModel:
    token_user_data = validate_token_with_keycloak(token)
    
    db = SessionLocal()
    try:
        user_db = sync_user_to_db(token_user_data, db)
        return user_db
    finally:
        db.close()

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserModel = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            print(f"DEBUG: Acesso negado. User Role: {user.role} | Allowed: {self.allowed_roles}")
            raise HTTPException(status_code=403, detail="Acesso negado: Role insuficiente")
        return True
