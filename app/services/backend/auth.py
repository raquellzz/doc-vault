import os
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from app.core.security import validate_token_with_keycloak, User

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("KEYCLOAK_REALM", "DocVault")
TOKEN_URL = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=TOKEN_URL)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    return validate_token_with_keycloak(token)

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if not any(role in user.roles for role in self.allowed_roles):
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Acesso negado: Role insuficiente")
        return True