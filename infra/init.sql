-- Habilita a extensão de vetores (Necessário para a IA)
CREATE EXTENSION IF NOT EXISTS vector;

-- Cria o schema para tabelas comuns (usuários, metadados de arquivos)
CREATE SCHEMA IF NOT EXISTS app;

-- Cria o schema exclusivo para os embeddings da IA
CREATE SCHEMA IF NOT EXISTS vector;