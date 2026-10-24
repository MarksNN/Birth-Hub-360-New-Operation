# ADR 0012: Cadências Comerciais, Gestão de Consentimento LGPD/Opt-out e Propostas

- **Status:** Aceito
- **Data:** 2026-10-24
- **Decisores:** Agente 00 (Coordenação Técnica e Integração), Agente 24 (Auditoria Independente)
- **Contexto:** Onda W08 — Automações e engajamento

---

## 1. Contexto e Problema

Automações comerciais sem governança geram riscos graves de spam, violação da LGPD e quebra de confiança:
1. **Disparo para contatos que solicitaram descadastramento (opt-out):** Exposição legal e quebra de conformidade.
2. **Propostas comerciais desatualizadas:** Valores gerados fora do CRM levando a divergências financeiras.
3. **Falta de trilhas de auditoria:** Workflows rodando em segundo plano sem registro de paradas ou erros.

---

## 2. Decisão Arquitetural

1. **Gestão de Consentimento Fail-Closed (`consent_records`):**
   - Mapeamento por canal (`email`, `phone`, `whatsapp`) com status `opt_in` ou `opt_out`.
   - **Regra do Gate de Aceite:** Se um contato registrar `opt_out`, qualquer workflow que o envolva é imediatamente cancelado com status `cancelled_opt_out`, sem criar tarefas ou comunicações.

2. **Workflows Determinísticos em Estágios (`cadence_workflows`):**
   - Passos estruturados com tipo de ação tipado (`create_task`, `generate_draft`, `notify_rep`).
   - Cada execução gera um registro imutável em `workflow_runs`.

3. **Gerador de Propostas Comerciais (`proposal_documents`):**
   - Reconciliação direta com a entidade `Deal` do CRM. O valor total e moeda são espelhados fielmente, e o documento nasce em status `draft` com trilha para aprovação.

4. **Isolamento Multi-Tenant com RLS:**
   - Migração `006_automations_and_engagement.sql` com políticas RLS por organização.

---

## 3. Consequências e Validação

- 100% de cancelamento comprovado quando há solicitação de opt-out (Teste T04 em `automations.test.ts`).
- Propostas reconciliadas e zero vazamento cross-tenant.
