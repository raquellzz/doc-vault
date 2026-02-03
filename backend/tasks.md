## 📅 Fase 1: Fundação (Dias 1–2)

### 👩‍💻 Desenvolvedora Backend
- **Task 1 — Setup da Infraestrutura (Docker & DB)**
    - Ação: criar `infra/docker-compose.yml` usando a imagem `pgvector/pgvector:pg16`.
    - Dica: no `init.sql` do Postgres adicionar:
        ```sql
        CREATE SCHEMA IF NOT EXISTS app;
        CREATE SCHEMA IF NOT EXISTS vector;
        ```
- **Task 2 — Autenticação & Segurança (Keycloak)**
    - Ação: implementar em `app/services/backend/auth.py` a integração com `python-keycloak`.
    - Objetivo: criar uma dependência FastAPI que valide o token e retorne um objeto `User` com `user_id` e `roles`.

### 🧑‍💻 Desenvolvedor IA
- **Task 1 — Ambiente LangChain & PGVector**
    - Ação: configurar a conexão em `app/services/ai/vector.py` usando PGVector do LangChain.
    - Objetivo: garantir que a aplicação crie automaticamente a tabela de embeddings no schema `vector`.
- **Task 2 — Pipeline de Ingestão**
    - Ação: criar a lógica que recebe um PDF em binário, quebra em chunks e salva no banco.
    - Metadados: salvar `document_id` e `user_id` em cada chunk para permitir deleções e filtros futuros.

---

## ⚙️ Fase 2: Core Development (Dias 3–5)

### 👩‍💻 Desenvolvedora Backend
- **Task 3 — Endpoints de Admin**
    - Ação: em `app/api/v1/admin.py`, criar endpoint de upload que salve o arquivo em disco ou S3 via `storage.py` e passe o caminho para o serviço de IA.
- **Task 4 — Controle de Acesso (RBAC)**
    - Ação: criar um decorador ou dependência de permissão `RoleChecker(["admin"])`. Se o usuário do Keycloak não tiver a role, retornar `403 Forbidden`.

### 🧑‍💻 Desenvolvedor IA
- **Task 3 — Motor de RAG**
    - Ação: criar o Retrieval Chain. Usar LCEL para compor o fluxo: Pergunta → Busca Vetorial → Contexto → LLM → Resposta.
- **Task 4 — Agente e Ferramentas**
    - Ação: em `app/services/ai/agent.py`, configurar o agente para usar o banco vetorial como uma Tool. Implementar `ChatMessageHistory` para manter contexto da conversa.

---

## 🔗 Fase 3: Integração & Entrega (Dias 6–7)

### 👩‍💻 Desenvolvedora Backend
- **Task 5 — Endpoint de Chat & Integração Final**
    - Ação: em `app/api/v1/chat.py`, conectar o input do usuário ao `agent.py`.
    - Fluxo: backend recebe JSON → valida JWT → extrai histórico de conversa → chama o motor de IA.

### 🧑‍💻 Desenvolvedor IA
- **Task 5 — Refinamento & Deleção**
    - Ação: implementar função de deleção em `vector.py`. Quando o Admin deletar um documento via rota do backend, a IA deve remover todos os vetores associados ao `document_id`.
