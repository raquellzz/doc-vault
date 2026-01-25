from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas import Document, User
from app.services.backend.auth import RoleChecker, get_current_user
from app.services.backend.storage import save_upload_file

router = APIRouter(tags=["Admin Operations"])
allow_admin_only = RoleChecker(["admin"])

@router.post("/admin/upload", dependencies=[Depends(allow_admin_only)])
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user) 
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDF.")

    file_path = await save_upload_file(file)

    new_doc = Document(
        filename=file.filename,
        status="processing", # Status inicial para a IA pegar depois
        uploaded_by=user.id,
        total_chunks=0 
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {
        "document_id": str(new_doc.id),
        "status": new_doc.status,
        "message": "Upload iniciado. Aguardando processamento da IA."
    }