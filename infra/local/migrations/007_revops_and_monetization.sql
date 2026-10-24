-- ============================================================
-- Migração 007: RevOps, Forecasting e Faturamento Idempotente
-- Onda W09: RevOps e Monetização (Cálculo Reconciliado, Faturamento Idempotente e Isolamento)
-- ============================================================

-- 1. Tabela de Assinaturas e Cotas por Tenant
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT UNIQUE,
  plan_slug VARCHAR(50) NOT NULL DEFAULT 'growth', -- 'starter', 'growth', 'enterprise'
  status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'cancelled', 'trialing'
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  ai_credits_used_brl NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  ai_credits_limit_brl NUMERIC(15, 4) NOT NULL DEFAULT 500.0000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Faturas Comerciais (Billing Invoices com Idempotência Estrita)
CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(100) NOT NULL,
  period VARCHAR(20) NOT NULL, -- ex: '2026-10'
  amount_brl NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'open', 'paid', 'void'
  idempotency_key VARCHAR(255) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_billing_invoice_tenant_period UNIQUE (tenant_id, period),
  CONSTRAINT uq_billing_invoice_idempotency UNIQUE (idempotency_key)
);

-- 3. Tabela de Itens de Fatura
CREATE TABLE IF NOT EXISTS billing_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  description VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_brl NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  amount_brl NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ledger de Custos e Transações Financeiras RevOps
CREATE TABLE IF NOT EXISTS revops_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  category VARCHAR(50) NOT NULL, -- 'ai_inference', 'platform_subscription', 'add_on'
  description VARCHAR(255) NOT NULL,
  amount_brl NUMERIC(15, 4) NOT NULL,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Snapshots de Forecasting
CREATE TABLE IF NOT EXISTS revenue_forecast_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  period VARCHAR(20) NOT NULL,
  commit_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  best_case_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  pipeline_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  win_weighted_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  confidence_low NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  confidence_mid NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  confidence_high NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  breakdown_stages JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. HABILITAÇÃO E ENFORCEMENT DE ROW LEVEL SECURITY (RLS)
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE billing_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoice_items FORCE ROW LEVEL SECURITY;

ALTER TABLE revops_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_ledger FORCE ROW LEVEL SECURITY;

ALTER TABLE revenue_forecast_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecast_snapshots FORCE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS FAIL-CLOSED POR TENANT
DROP POLICY IF EXISTS tenant_isolation_subscriptions ON tenant_subscriptions;
CREATE POLICY tenant_isolation_subscriptions ON tenant_subscriptions
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_billing_invoices ON billing_invoices;
CREATE POLICY tenant_isolation_billing_invoices ON billing_invoices
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_billing_invoice_items ON billing_invoice_items;
CREATE POLICY tenant_isolation_billing_invoice_items ON billing_invoice_items
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_revops_ledger ON revops_ledger;
CREATE POLICY tenant_isolation_revops_ledger ON revops_ledger
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_forecast_snapshots ON revenue_forecast_snapshots;
CREATE POLICY tenant_isolation_forecast_snapshots ON revenue_forecast_snapshots
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
