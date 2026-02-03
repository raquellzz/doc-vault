from fastapi import FastAPI, Depends
from app.services.backend.auth import get_current_user, RoleChecker
from app.models.schemas import User
from app.api.v1 import documents, chat
from app.core.database import engine, Base
from app.models import schemas
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocVault API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

