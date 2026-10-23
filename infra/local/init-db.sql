-- ============================================================
-- Birthub 360 Full Operation — Inicialização Segura do Banco Local
-- Onda W01 — Fundação de Engenharia / Segurança
-- ============================================================

-- 1. Extensões essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Role de aplicação runtime com privilégio restrito (sem SUPERUSER, sem BYPASSRLS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'birthub_app') THEN
    CREATE ROLE birthub_app WITH LOGIN PASSWORD 'birthub_app_dev_secret';
  END IF;
END
$$;

-- 3. Grants mínimos
GRANT CONNECT ON DATABASE birthub_local TO birthub_app;
GRANT USAGE ON SCHEMA public TO birthub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO birthub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO birthub_app;

-- 4. Função auxiliar para resolução de Tenant atual no PostgreSQL
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;
