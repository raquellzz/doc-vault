import asyncio
import uuid
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.schemas import Document
from app.services.ai.tools import extract_text_from_pdf

async def process_document_mock(doc_id: uuid.UUID, file_path: str):
    """
    Função que simula o processamento pesado de IA (OCR, Embeddings, Vector DB).
    Ela roda em background, sem travar o usuário.
    """
    print(f"🤖 IA: Iniciando processamento do documento {doc_id}...")
    
    db: Session = SessionLocal()
    
    try:
        document = db.query(Document).filter(Document.id == doc_id).first()
        if not document:
            print("❌ IA: Documento não encontrado no banco.")
            return
        
        print(f"📖 IA: Lendo arquivo físico: {file_path}")
        
        # Extrai o texto real
        raw_text = extract_text_from_pdf(file_path)

        # Simulação do processamento pesado da IA
        await asyncio.sleep(5) 
        
        fake_chunks_count = 15 # Apenas para testar

        # Atualiza o status no banco para 'active' (sucesso)
        document.status = "active"
        document.total_chunks = fake_chunks_count
        db.commit()
        
        print(f"✅ IA: Documento {doc_id} processado com sucesso! Status: active")

    except Exception as e:
        print(f"🔥 IA: Erro ao processar: {e}")
        if document:
            document.status = "error"
            db.commit()
    finally:
        db.close()