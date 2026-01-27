from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from app.core.config import settings
from app.services.ai.vector import get_vector_store

llm = ChatOpenAI(
    model=settings.CHAT_MODEL, temperature=0.2, openai_api_key=settings.OPENAI_API_KEY
)


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def get_chat_response(
    message: str, chat_history: List[Dict[str, str]], user_id: str
) -> str:
    """
    Gera uma resposta usando RAG + Histórico com LCEL.
    """

    # 1. Retriever com filtro
    vector_store = get_vector_store()
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 5, "filter": {"user_id": user_id}}
    )

    # 2. Formatar histórico
    history_str = ""
    for msg in chat_history[-10:]:
        role = "Usuário" if msg["role"] == "user" else "Assistente"
        history_str += f"{role}: {msg['content']}\n"

    # 3. Prompt
    system_prompt = """
    Você é um assistente de IA especialista em análise jurídica e documentos.
    Use o contexto abaixo (recuperado de documentos PDF) para responder à pergunta do usuário.
    Se a resposta não estiver no contexto, diga que não encontrou a informação, mas tente ajudar.
    Responda em Português do Brasil.
    
    Contexto:
    {context}
    
    Histórico da Conversa:
    {history}
    """

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("user", "{question}"),
        ]
    )

    # 4. Chain LCEL (RAG puro)
    # input espera: {"question": "...", "history": "..."}
    # context é preenchido pelo retriever pegando 'question'

    rag_chain = (
        {
            "context": (lambda x: x["question"]) | retriever | format_docs,
            "question": lambda x: x["question"],
            "history": lambda x: x["history"],
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    # 5. Invoke
    response_text = rag_chain.invoke({"question": message, "history": history_str})

    return response_text
