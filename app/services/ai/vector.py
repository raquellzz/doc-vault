from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from sqlalchemy import create_engine, text
from app.core.config import settings

# Define connection string. Ensure we use the correct driver if needed.
# langchain-postgres recommends psycopg (v3) but works with drivers supported by SQLAlchemy if configured.
# We will use the standard URL provided.
CONNECTION_STRING = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+psycopg2://"
)

embeddings = OpenAIEmbeddings(
    model=settings.EMBEDDING_MODEL, openai_api_key=settings.OPENAI_API_KEY
)


def get_vector_store(collection_name: str = "documents"):
    """
    Retorna a instância do PGVector conectada ao banco.
    """
    return PGVector(
        embeddings=embeddings,
        collection_name=collection_name,
        connection=CONNECTION_STRING,
        use_jsonb=True,
    )


def delete_vectors_by_document_id(doc_id: str):
    """
    Remove todos os vetores associados a um document_id específico.
    Isso é crucial para manter a consistência quando um documento é deletado.
    """
    # PGVector armazena metadados em JSONB. Podemos filtrar onde cmetadata ->> 'document_id' == doc_id
    # No entanto, a API do PGVector pode não expor delete_by_metadata de forma trivial em todas as versões.
    # Vamos usar SQL direto para garantir a limpeza eficiente.

    # Assumindo que a tabela padrão do langchain_postgres é `langchain_pg_embedding`
    # E a coleção é ligada via uuid.

    # Melhor abordagem usando o store se disponível:
    store = get_vector_store()

    # O método delete do PGVector aceita ids de vetores, não filtro de metadados diretamente na v0.0.1+ facilmente sem busca.
    # Mas podemos fazer uma busca e deletar, ou SQL direto.
    # SQL direto é mais garantido e performático para "delete cascade" manual.

    engine = create_engine(CONNECTION_STRING)
    with engine.connect() as conn:
        # A tabela langchain_pg_embedding tem uma coluna 'cmetadata'.
        # Precisamos apagar onde cmetadata->>'document_id' = doc_id

        stmt = text("""
            DELETE FROM langchain_pg_embedding 
            WHERE cmetadata->>'document_id' = :doc_id
        """)
        conn.execute(stmt, {"doc_id": doc_id})
        conn.commit()

    print(f"🗑️ Vetores do documento {doc_id} removidos.")
