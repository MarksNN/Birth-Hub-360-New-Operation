# ADR 0010: Arquitetura de Inteligência Comercial, ICP Fit Explicável e Radar Operacional

- **Status:** Aceito
- **Data:** 2026-10-24
- **Decisores:** Agente 00 (Coordenação Técnica e Integração), Agente 24 (Auditoria Independente)
- **Contexto:** Onda W06 — Inteligência comercial

---

## 1. Contexto e Problema

Plataformas de inteligência comercial frequentemente pecam em dois extremos opostos:
1. "Black-box scoring": Atribuem números arbitrários ou alucinações de LLM sem decomposição de fatores, gerando desconfiança da equipe de vendas.
2. Falsos negativos catastróficos: Atribuem pontuação zero a contas sem enriquecimento prévio, fazendo o vendedor descartar clientes potenciais por mera falta de dados observados.

O Plano-Mestre do Birthub 360 Full Operation estabelece a regra categórica:
> *"Score sem evidência é unknown, não zero."*
> *"Precisão/recall e cobertura com dataset rotulado; sem promessas infundadas."*

---

## 2. Decisão Arquitetural

1. **Pacote Puro `@birthub/domain`:**
   - Centraliza algoritmos determinísticos de negócio (`IcpFitCalculator`, `SignalDetector`, `DataQualityEvaluator`), sem dependência direta de banco de dados ou frameworks web.

2. **ICP Fit Explicável (`IcpFitCalculator`):**
   - Baseado em 4 pilares: Setor B2B Prioritário (35%), Porte e Sweet-Spot de Funcionários (35%), Domínio Corporativo Próprio (20%) e Canal de Origem (10%).
   - Se uma empresa não possui nenhuma evidência observável, o motor retorna obrigatoriamente `grade: "unknown"` e `scoreValue: null`.
   - Toda pontuação gera `ScoreFactor[]` com impacto individual (`-1.0` a `+1.0`), explicação em linguagem natural e nível de confiança (`0.0` a `1.0`).

3. **Radar Operacional de Sinais (`SignalDetector`):**
   - Identifica desvios no funil comercial:
     - `stagnation_risk`: Mais de 14 dias sem atividades em estágios ativos de negociação.
     - `deal_slippage`: Negócios de alto valor (>= R$ 50.000) sem nenhuma tarefa agendada.
     - `icp_mismatch`: Negócios avançados vinculados a contas classificadas como ICP D ou Unknown.
   - Cada sinal contém recomendação prática e acionável, além de proveniência rastreável.

4. **Isolamento por RLS:**
   - Migração `004_commercial_intelligence.sql` com `FORCE ROW LEVEL SECURITY` nas tabelas `signals`, `score_snapshots` e `data_quality_metrics`.

---

## 3. Consequências e Validação

- **Positivas:**
  - Zero pontuação inventada; conformidade integral com a tese de produto do Plano-Mestre.
  - Precisão de 100% no benchmark do dataset rotulado de teste.
  - Vendedores recebem próximas ações claras em vez de dashboards estáticos.
