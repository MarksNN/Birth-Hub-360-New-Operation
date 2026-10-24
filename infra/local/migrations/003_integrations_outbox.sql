-- ============================================================
-- Migração 003: Hub de Integrações, Outbox Pattern e Resolução de Conflitos
-- Onda W05: Integrações e Sincronização (Bitrix24, Outbox, Cursors e DLQ)
-- ============================================================

-- 1. Tabela de Integrações Externas Ativas por Tenant
CREATE TABLE IF NOT EXISTS external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider VARCHAR(50) NOT NULL, -- 'bitrix24', 'webhook_custom', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'error'
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_provider UNIQUE (tenant_id, provider)
);

-- 2. Tabela de Mapeamento de Identidades Externas (Bi-direcional e Proveniência)
CREATE TABLE IF NOT EXISTS external_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'company', 'contact', 'deal', 'task'
  local_id UUID NOT NULL,
  external_id VARCHAR(100) NOT NULL,
  sync_version INTEGER NOT NULL DEFAULT 1,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT uq_tenant_provider_external UNIQUE (tenant_id, provider, entity_type, external_id)
);

-- 3. Tabela Transacional Outbox com Dead-Letter Queue (DLQ)
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  event_type VARCHAR(100) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'dead_letter'
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  idempotency_key VARCHAR(255) NOT NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT uq_tenant_outbox_idempotency UNIQUE (tenant_id, idempotency_key)
);

-- 4. Tabela de Cursors para Sincronização Incremental Confiável
CREATE TABLE IF NOT EXISTS sync_cursors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  cursor_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_provider_cursor UNIQUE (tenant_id, provider, entity_type)
);

-- 5. Tabela de Conflitos de Sincronização e Auditoria de Resolução
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  local_id UUID NOT NULL,
  external_id VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  local_value JSONB,
  external_value JSONB,
  resolution VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'keep_local', 'overwrite_with_external', 'manual_merge'
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. HABILITAÇÃO E ENFORCEMENT DE ROW LEVEL SECURITY (RLS)
ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_integrations FORCE ROW LEVEL SECURITY;

ALTER TABLE external_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_identities FORCE ROW LEVEL SECURITY;

ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;

ALTER TABLE sync_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_cursors FORCE ROW LEVEL SECURITY;

ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts FORCE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS FAIL-CLOSED POR TENANT
DROP POLICY IF EXISTS tenant_isolation_external_integrations ON external_integrations;
CREATE POLICY tenant_isolation_external_integrations ON external_integrations
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_external_identities ON external_identities;
CREATE POLICY tenant_isolation_external_identities ON external_identities
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_outbox_events ON outbox_events;
CREATE POLICY tenant_isolation_outbox_events ON outbox_events
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_sync_cursors ON sync_cursors;
CREATE POLICY tenant_isolation_sync_cursors ON sync_cursors
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_sync_conflicts ON sync_conflicts;
CREATE POLICY tenant_isolation_sync_conflicts ON sync_conflicts
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
