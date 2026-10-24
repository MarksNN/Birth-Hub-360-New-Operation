# ADR 0014: Estratégia de Resiliência, Disaster Recovery, SLOs e Ameaças STRIDE

- **Status:** Aceito
- **Data:** 2026-10-24
- **Autor:** Agente 00 (Coordenação Técnica e Integração)
- **Revisor:** Agente 24 (Auditoria Independente)
- **Contexto:** Onda W10 — Confiabilidade e Segurança Avançadas

---

## 1. Contexto e Problema

Para operação enterprise crítica e preparação para os pilotos (W11) e GA (W12), o Birthub 360 Full Operation exige garantias contratuais de continuidade operacional e segurança de ponta a ponta:
1. Procedimentos e testes automatizados periódicos de restauração de desastre (*Disaster Recovery Restore Drills*) com RTO (*Recovery Time Objective*) inferior a 15 minutos e RPO (*Recovery Point Objective*) inferior a 5 minutos.
2. Definição clara de SLOs (*Service Level Objectives*) e orçamentos de erro (*Error Budgets*) monitoráveis.
3. Modelagem de ameaças abrangente no padrão STRIDE cobrindo todas as fronteiras de ataque (Identidade, CRM, Sincronização, Inteligência, Agentes de IA e Billing).
4. Auditoria de integridade da cadeia de suprimentos (*Supply Chain Security*) com zero vulnerabilidades críticas conhecidas.

## 2. Decisão

1. **Disaster Recovery e Restore Drills Verificados:**
   - Snapshots contínuos de backup do PostgreSQL com replicação WAL (*Write-Ahead Logging*).
   - Execução rotineira e aferição de restore drill via endpoint dedicado `POST /api/v1/system/drills/restore`.
   - Validação da integridade através de checksum SHA-256 e contagem reconciliada de entidades vitais (tenants, deals, faturas e logs de auditoria).
   - Acesso estritamente restrito a perfis com privilégio `admin` ou `owner`.
2. **Declaração de SLOs e Error Budget:**
   - **Disponibilidade da API:** $99.9\%$ mensal (orçamento de erro de 43.2 minutos).
   - **Latência P95 Transacional:** $< 150\text{ ms}$ em operações de CRM e Auth.
   - **Taxa de Erro 5xx:** $< 0.05\%$.
   - Monitoramento contínuo exposto via `/health/ready` (deep readiness probe) e `/health/slo`.
3. **Modelagem de Ameaças (STRIDE):**
   - **Spoofing:** Autenticação por bearer token com criptografia e validação de claims por request.
   - **Tampering:** Assinatura digital nos webhooks, outbox com checksum e idempotency keys.
   - **Repudiation:** Trilha imutável em `audit_logs` e `revops_ledger` para qualquer operação com impacto financeiro ou de dados.
   - **Information Disclosure:** `FORCE ROW LEVEL SECURITY` obrigatório em 100% das tabelas multi-tenant; dados com segregação lógica por `tenant_id`.
   - **Denial of Service:** Rate limiting fail-closed e cancelamento imediato de cadências para contatos com opt-out LGPD.
   - **Elevation of Privilege:** RBAC estrito e barreira de confirmação humana (*Human-in-the-Loop*) para ações autônomas de IA de nível A4.
4. **Supply Chain:**
   - Auditoria automatizada (`npm audit`) integrada ao pipeline de validação exigindo zero CVEs críticas/altas.

## 3. Consequências

- **Positivas:**
  - Métricas de confiabilidade objetivas e auditáveis para clientes enterprise.
  - Mitigação documentada de todas as superfícies de ataque do sistema.
  - Zero achados críticos abertos.
- **Negativas:**
  - Necessidade de manter réplicas e snapshots periódicos em infraestrutura de nuvem, gerando custo adicional de storage.
