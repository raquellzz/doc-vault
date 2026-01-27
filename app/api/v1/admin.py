from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import uuid
import os
from pathlib import Path
from app.core.database import get_db
from app.models.schemas import Document, User
from app.services.backend.auth import RoleChecker, get_current_user
from app.services.backend.storage import save_upload_file
from app.services.ai.ingestion import process_document
from app.services.ai.vector import delete_vectors_by_document_id

router = APIRouter(tags=["Admin Operations"])
allow_admin_only = RoleChecker(["admin"])


@router.post("/admin/upload", dependencies=[Depends(allow_admin_only)])
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDF.")

    file_path = await save_upload_file(file)

    new_doc = Document(
        filename=file.filename,
        status="processing",
        uploaded_by=user.id,
        file_path=file_path,
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    background_tasks.add_task(process_document, new_doc.id, file_path)

    return {
        "document_id": str(new_doc.id),
        "status": new_doc.status,
        "message": "Upload recebido. O processamento iniciou em segundo plano.",
    }


@router.delete("/admin/documents/{doc_id}", dependencies=[Depends(allow_admin_only)])
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db)
):
    try:
        uuid_id = uuid.UUID(doc_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido.")

    doc = db.query(Document).filter(Document.id == uuid_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    
    db.delete(doc)
    db.commit()

    return {"status": "success", "message": f"Documento {doc.filename} apagado com sucesso."}