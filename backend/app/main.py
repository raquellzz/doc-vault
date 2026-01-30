from fastapi import FastAPI, Depends
from app.services.backend.auth import get_current_user, RoleChecker
from app.models.schemas import User
from app.api.v1 import documents, chat
from app.core.database import engine, Base
from app.models import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocVault API")

app.include_router(documents.router, prefix="/v1")
app.include_router(chat.router, prefix="/v1")

@app.get("/")
def read_root():
    return {"message": "DocVault Running", "docs": "/docs"}

@app.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "user_id": str(user.id),
        "username": user.email,
        "role": user.role,
        "status": "Synced with DB",
    }

