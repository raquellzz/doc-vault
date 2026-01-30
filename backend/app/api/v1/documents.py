from typing import List, Optional
import uuid
import os
from pathlib import Path

from fastapi.responses import FileResponse
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.schemas import Document, User
from app.services.backend.auth import RoleChecker, get_current_user
from app.services.backend.storage import save_upload_file
from app.services.ai.ingestion import process_document
from app.services.ai.vector import delete_vectors_by_document_id

router = APIRouter(tags=["Documents"])
allow_admin_only = RoleChecker(["admin"])

class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    total_chunks: int
    created_at: str 

    class Config:
        from_attributes = True


@router.get("/documents", response_model=List[DocumentResponse], dependencies=[Depends(allow_admin_only)])
def list_documents(db: Session = Depends(get_db)):
    """
    Lista todos os documentos do sistema.
    """
    docs = db.query(Document).all()
    results = []
    for d in docs:
        results.append(DocumentResponse(
            id=d.id,
            filename=d.filename,
            status=d.status,
            total_chunks=d.total_chunks or 0,
            created_at=d.upload_date.strftime("%Y-%m-%d %H:%M") if d.upload_date else ""
        ))
    return results

@router.post("/documents", dependencies=[Depends(allow_admin_only)])
async def create_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Faz upload de um novo documento.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDF.")

    file_path = await save_upload_file(file)

    new_doc = Document(
        filename=file.filename,
        status="processing", 
        uploaded_by=user.id,
        file_path=file_path
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    background_tasks.add_task(process_document, new_doc.id, file_path)

    return {"id": new_doc.id, "status": "processing", "message": "Upload iniciado."}

@router.delete("/documents/{doc_id}", dependencies=[Depends(allow_admin_only)])
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    """
    Deleta um documento do banco e do disco.
    """
    try:
        uuid_id = uuid.UUID(doc_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido.")

    doc = db.query(Document).filter(Document.id == uuid_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Erro ao apagar arquivo: {e}")
    
    db.delete(doc)
    db.commit()

    return {"status": "success", "id": doc_id}

