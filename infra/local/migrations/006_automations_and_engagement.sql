-- ============================================================
-- Migração 006: Automações Comerciais, Consentimento LGPD e Propostas
-- Onda W08: Automações e Engajamento (Cadências, Opt-out e Documentos)
-- ============================================================

-- 1. Tabela de Cadências e Workflows Comerciais
CREATE TABLE IF NOT EXISTS cadence_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'deal_stagnant', 'new_lead', 'stage_change'
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Registros de Consentimento e Opt-Out (LGPD Fail-Closed)
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL, -- 'email', 'phone', 'whatsapp'
  status VARCHAR(20) NOT NULL, -- 'opt_in', 'opt_out'
  source VARCHAR(100) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_contact_channel UNIQUE (tenant_id, contact_id, channel)
);

-- 3. Tabela de Propostas Comerciais e Documentos
CREATE TABLE IF NOT EXISTS proposal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  template_id VARCHAR(50) NOT NULL,
  content_markdown TEXT NOT NULL,
  total_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'under_review', 'approved', 'sent', 'signed', 'rejected'
  generated_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Execuções de Workflows (Workflow Runs)
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workflow_id UUID NOT NULL REFERENCES cadence_workflows(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'running', -- 'running', 'paused', 'completed', 'cancelled_opt_out'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. HABILITAÇÃO E ENFORCEMENT DE ROW LEVEL SECURITY (RLS)
ALTER TABLE cadence_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_workflows FORCE ROW LEVEL SECURITY;

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records FORCE ROW LEVEL SECURITY;

ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_documents FORCE ROW LEVEL SECURITY;

ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs FORCE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS FAIL-CLOSED POR TENANT
DROP POLICY IF EXISTS tenant_isolation_cadence_workflows ON cadence_workflows;
CREATE POLICY tenant_isolation_cadence_workflows ON cadence_workflows
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_consent_records ON consent_records;
CREATE POLICY tenant_isolation_consent_records ON consent_records
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_proposal_documents ON proposal_documents;
CREATE POLICY tenant_isolation_proposal_documents ON proposal_documents
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_workflow_runs ON workflow_runs;
CREATE POLICY tenant_isolation_workflow_runs ON workflow_runs
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
