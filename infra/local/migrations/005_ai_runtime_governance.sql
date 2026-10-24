-- ============================================================
-- Migração 005: Governança de IA, Autonomia A0-A4 e Aprovações
-- Onda W07: Copiloto e Agentes Seguros (Tool Registry, Policy e FinOps)
-- ============================================================

-- 1. Tabela de Execuções de Agentes (Agent Runs)
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  agent_type VARCHAR(50) NOT NULL, -- 'radar', 'research', 'sales_copilot', 'executor'
  autonomy_level VARCHAR(10) NOT NULL, -- 'A0', 'A1', 'A2', 'A3', 'A4'
  goal TEXT NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt_hash VARCHAR(64) NOT NULL,
  tokens_used JSONB NOT NULL DEFAULT '{"prompt":0,"completion":0,"total":0}'::jsonb,
  estimated_cost_brl NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  idempotency_key VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'executed', 'failed'
  output_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Execuções de Ferramentas (Tool Executions)
CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Requisições de Aprovação Humana (Human-in-the-Loop)
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  tool_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  justification TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_by UUID REFERENCES users(id),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Ledger de Custos de IA (FinOps)
CREATE TABLE IF NOT EXISTS ai_cost_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  model VARCHAR(100) NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost_brl NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. HABILITAÇÃO E ENFORCEMENT DE ROW LEVEL SECURITY (RLS)
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs FORCE ROW LEVEL SECURITY;

ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions FORCE ROW LEVEL SECURITY;

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE ai_cost_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_ledger FORCE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS FAIL-CLOSED POR TENANT
DROP POLICY IF EXISTS tenant_isolation_agent_runs ON agent_runs;
CREATE POLICY tenant_isolation_agent_runs ON agent_runs
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_tool_executions ON tool_executions;
CREATE POLICY tenant_isolation_tool_executions ON tool_executions
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_approval_requests ON approval_requests;
CREATE POLICY tenant_isolation_approval_requests ON approval_requests
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_ai_cost_ledger ON ai_cost_ledger;
CREATE POLICY tenant_isolation_ai_cost_ledger ON ai_cost_ledger
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
