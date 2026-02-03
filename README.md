# 📂 DocVault

![Project Status](https://img.shields.io/badge/status-active-emerald)
<!-- ![License](https://img.shields.io/badge/license-MIT-blue) -->

**DocVault** é uma plataforma inteligente de gestão de documentos. O sistema permite que usuários façam upload de arquivos PDF e interajam com eles através de um chat alimentado por Inteligência Artificial (RAG), permitindo extrair informações, resumos e insights de forma conversacional.

A aplicação conta com autenticação robusta via Keycloak, interface moderna e histórico de conversas persistente.
<!-- 
## 📸 Screenshots

*(Coloque aqui prints da sua tela de Login, Dashboard e Chat)* -->

## 🚀 Tecnologias Utilizadas

### Frontend
- **Framework:** [Next.js 14](https://nextjs.org/)
- **Estilização:** Tailwind CSS
- **Autenticação:** NextAuth.js
- **Http Client:** Axios

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Banco de Dados:** PostgreSQL
- **ORM:** SQLAlchemy
- **IA/LLM:** Integração com OpenAI

### Infraestrutura & Segurança
- **Containerização:** Docker & Docker Compose
- **Identity Provider:** Keycloak (OIDC)

## ✨ Funcionalidades

- [x] **Autenticação Segura:** Login, Logout (Federado) e Proteção de Rotas com Keycloak.
- [x] **Upload de Documentos:** Armazenamento seguro de arquivos PDF.
- [x] **Gestão de Arquivos:** Listagem, Download e Exclusão de documentos.
- [x] **Chat com IA:** Interface conversacional estilo ChatGPT.
- [x] **Histórico de Conversas:** O chat salva o histórico e permite navegar entre sessões anteriores via barra lateral.
- [x] **UI Responsiva:** Interface limpa e adaptável.

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
- **Docker** e **Docker Compose** instalados e rodando.
- **Node.js** (v18 ou superior).
- **Python** (v3.10 ou superior).
- **Git**.

### 1. Clone o repositório
```bash
git clone [https://github.com/seu-usuario/doc-vault.git](https://github.com/seu-usuario/doc-vault.git)
cd doc-vault