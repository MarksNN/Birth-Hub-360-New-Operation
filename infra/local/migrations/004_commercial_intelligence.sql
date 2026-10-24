-- ============================================================
-- Migração 004: Inteligência Comercial, Sinais e ICP Fit Explicável
-- Onda W06: Inteligência Comercial (Radar, Scoring e Qualidade de Dados)
-- ============================================================

-- 1. Tabela de Sinais e Alertas do Radar Operacional
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  entity_type VARCHAR(50) NOT NULL, -- 'deal', 'company', 'contact'
  entity_id UUID NOT NULL,
  signal_type VARCHAR(50) NOT NULL, -- 'stagnation_risk', 'deal_slippage', 'engagement_drop', 'icp_mismatch', 'high_intent'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL, -- 0.00 a 1.00
  recommended_action TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_by UUID REFERENCES users(id),
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Snapshots de Pontuação (ICP Fit e Probabilidade com Explicabilidade)
CREATE TABLE IF NOT EXISTS score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  entity_type VARCHAR(50) NOT NULL, -- 'company', 'deal'
  entity_id UUID NOT NULL,
  score_type VARCHAR(50) NOT NULL, -- 'icp_fit', 'win_probability', 'data_quality'
  score_value NUMERIC(5, 2), -- Pode ser NULL se for desconhecido ("unknown")
  grade VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D', 'unknown'
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_version VARCHAR(50) NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Métricas Históricas de Qualidade de Dados
CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  overall_score INTEGER NOT NULL,
  completeness_rate NUMERIC(3, 2) NOT NULL,
  freshness_rate NUMERIC(3, 2) NOT NULL,
  issues_found INTEGER NOT NULL DEFAULT 0,
  unverified_sources_count INTEGER NOT NULL DEFAULT 0,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. HABILITAÇÃO E ENFORCEMENT DE ROW LEVEL SECURITY (RLS)
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals FORCE ROW LEVEL SECURITY;

ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots FORCE ROW LEVEL SECURITY;

ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics FORCE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS FAIL-CLOSED POR TENANT
DROP POLICY IF EXISTS tenant_isolation_signals ON signals;
CREATE POLICY tenant_isolation_signals ON signals
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_score_snapshots ON score_snapshots;
CREATE POLICY tenant_isolation_score_snapshots ON score_snapshots
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_data_quality_metrics ON data_quality_metrics;
CREATE POLICY tenant_isolation_data_quality_metrics ON data_quality_metrics
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
