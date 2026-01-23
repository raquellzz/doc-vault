from fastapi import FastAPI, Depends
from app.services.backend.auth import get_current_user, RoleChecker
from app.core.security import User

app = FastAPI(title="DocVault API")

# Rota Pública
@app.get("/")
def read_root():
    return {"message": "API Online"}

# Rota Protegida (Qualquer usuário logado)
@app.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {"user_id": user.id, "roles": user.roles}

# Rota Protegida (Apenas ADM)
@app.post("/admin-only", dependencies=[Depends(RoleChecker(["admin"]))])
def admin_action():
    return {"status": "Ação de administrador realizada com sucesso"}