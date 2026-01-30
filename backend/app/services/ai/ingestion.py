import uuid
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.schemas import Document
from app.services.ai.tools import extract_text_from_pdf
from app.services.ai.vector import get_vector_store
from langchain_text_splitters import RecursiveCharacterTextSplitter


def process_document(doc_id: uuid.UUID, file_path: str):
    """
    Processa o documento PDF:
    1. Extrai texto.
    2. Divide em chunks.
    3. Gera embeddings e salva no Vector DB.
    4. Atualiza status no banco Transactional.
    """
    print(f"🤖 IA: Iniciando processamento do documento {doc_id}...")

    db: Session = SessionLocal()

    try:
        document = db.query(Document).filter(Document.id == doc_id).first()
        if not document:
            print("❌ IA: Documento não encontrado no banco.")
            return

        # 1. Extração
        print(f"📖 IA: Lendo arquivo físico: {file_path}")
        raw_text = extract_text_from_pdf(file_path)

        if not raw_text.strip():
            print("⚠️ IA: Arquivo vazio ou ilegível.")
            document.status = "error"
            db.commit()
            return

        # 2. Chunking
        print("✂️ IA: Dividindo texto em chunks...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200, separators=["\n\n", "\n", " ", ""]
        )
        chunks = text_splitter.split_text(raw_text)
        print(f"🧩 Gerados {len(chunks)} chunks.")

        # 3. Vector DB (Embeddings)
        print("🧠 IA: Gerando embeddings e salvando no PGVector...")
        vector_store = get_vector_store()

        # Preparar metadados
        metadatas = []
        for _ in chunks:
            metadatas.append(
                {
                    "document_id": str(doc_id),
                    "source": document.filename,
                    "user_id": str(document.uploaded_by),
                }
            )

        vector_store.add_texts(texts=chunks, metadatas=metadatas)

        # 4. Atualizar DB Relacional
        document.status = "active"
        document.total_chunks = len(chunks)
        db.commit()

        print(f"✅ IA: Documento {doc_id} processado com sucesso! Status: active")

    except Exception as e:
        print(f"🔥 IA: Erro ao processar: {e}")
        if document:
            document.status = "error"
            # Opcional: salvar mensagem de erro
            db.commit()
    finally:
        db.close()
