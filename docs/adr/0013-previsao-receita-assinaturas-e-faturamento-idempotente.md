# ADR 0013: Previsão de Receita, Planos de Assinatura e Faturamento Idempotente

- **Status:** Aceito
- **Data:** 2026-10-24
- **Autor:** Agente 00 (Coordenação Técnica e Integração)
- **Revisor:** Agente 24 (Auditoria Independente)
- **Contexto:** Onda W09 — RevOps e Monetização

---

## 1. Contexto e Problema

O Birthub 360 Full Operation necessita de uma camada de inteligência financeira e monetização (RevOps) que entregue:
1. Previsão de receita (*Revenue Forecasting*) reconciliada com as etapas reais do pipeline de vendas no CRM, gerando intervalos de confiança matematicamente delimitados (`low`, `mid`, `high`).
2. Gestão de planos de assinatura (*Starter*, *Growth*, *Enterprise*) com franquias de créditos de IA e enforce rígido de cotas para evitar estouro de custos de inferência.
3. Faturamento idempotente (*Idempotent Billing*): emissões de faturas e cobranças jamais podem ser duplicadas por replays de rede, retentativas automáticas de clientes ou falhas transientes.
4. Isolamento estrito de dados (*Fail-closed multi-tenancy*): faturas, snapshots de forecast e ledger de um tenant jamais podem ser acessados ou alterados por outro tenant.

## 2. Decisão

1. **Modelo Matemático de Forecast:**
   - Cada estágio do deal possui um peso de probabilidade histórica de fechamento (`STAGE_WIN_PROBABILITIES`).
   - Categoria `Commit`: $100\%$ dos deals `closed_won` somados a $85\%$ dos deals em `negotiation`.
   - Categoria `Best Case`: soma de `closed_won` + `negotiation` + `proposal_sent`.
   - Intervalos de confiança delimitados por: $\text{Low} = \text{Commit}$, $\text{Mid} = \text{Weighted Pipeline}$, $\text{High} = \text{Best Case}$.
2. **Cotas de IA e Ledger Financeiro:**
   - Cada organização possui um limite contratado de créditos de IA (`aiCreditsLimitBrl`).
   - Cada invocação do `@birthub/ai-runtime` consome créditos calculados com base no modelo (OpenAI/Anthropic/Google).
   - Tentativa de consumo acima da cota é bloqueada com retorno explícito de saldo insuficiente.
   - Todo movimento gera um registro imutável em `revops_ledger`.
3. **Faturamento Idempotente:**
   - O cabeçalho ou payload `Idempotency-Key` é mandatório em requisições de geração de fatura.
   - Se uma chave de idempotência já processada for reenviada para o mesmo tenant:
     - O sistema responde `200 OK` (em vez de `201 Created`).
     - Retorna a fatura original emitida.
     - Insere o cabeçalho `X-Idempotent-Replay: true` e `meta.isDuplicateReplay: true`.
     - Nenhum novo item ou cobrança é gerada.
   - Se um tenant tentar usar a chave de idempotência pertencente a outro tenant, o sistema bloqueia imediatamente com `403 Forbidden` (`CrossTenantViolationError`).
4. **Persistência e RLS Fail-Closed:**
   - Criação da migração SQL `007_revops_and_monetization.sql` com `FORCE ROW LEVEL SECURITY` em todas as novas tabelas (`tenant_subscriptions`, `billing_invoices`, `billing_invoice_items`, `revops_ledger`, `revenue_forecast_snapshots`).

## 3. Consequências

- **Positivas:**
  - Garantia de faturamento zero-duplicidade em cenários de instabilidade de rede.
  - Previsão de receita auditável e compreensível pela liderança executiva.
  - Proteção financeira ativa contra consumo desenfreado de LLMs.
- **Negativas:**
  - Clientes da API financeira devem reter e persistir adequadamente suas chaves de idempotência.
