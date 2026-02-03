import os
from keycloak import KeycloakOpenID
from fastapi import HTTPException, status
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

load_dotenv()

keycloak_openid = KeycloakOpenID(
    server_url=os.getenv("KEYCLOAK_URL"),
    client_id=os.getenv("KEYCLOAK_CLIENT_ID"),
    realm_name=os.getenv("KEYCLOAK_REALM"),
    client_secret_key=os.getenv("KEYCLOAK_CLIENT_SECRET")
)

class TokenUser(BaseModel):
    id: str
    username: str
    roles: List[str]

def validate_token_with_keycloak(token: str) -> TokenUser:
    try:
        token_info = keycloak_openid.introspect(token)
        
        if not token_info.get("active"):
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")

        realm_roles = token_info.get("realm_access", {}).get("roles", [])
        client_id = os.getenv("KEYCLOAK_CLIENT_ID")
        client_roles = token_info.get("resource_access", {}).get(client_id, {}).get("roles", [])
        
        all_roles = list(set(realm_roles + client_roles))

        return TokenUser(
            id=token_info.get("sub"),
            username=token_info.get("preferred_username"),
            roles=all_roles
        )
    except Exception as e:
        print(f"Erro na validação: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Erro na validação de segurança"
        )
