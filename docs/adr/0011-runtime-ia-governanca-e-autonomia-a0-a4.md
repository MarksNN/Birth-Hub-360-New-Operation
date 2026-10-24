# ADR 0011: Runtime de IA, Governança, Autonomia A0-A4 e FinOps

- **Status:** Aceito
- **Data:** 2026-10-24
- **Decisores:** Agente 00 (Coordenação Técnica e Integração), Agente 24 (Auditoria Independente)
- **Contexto:** Onda W07 — Copiloto e agentes seguros

---

## 1. Contexto e Problema

Integrar modelos de linguagem (LLMs) em processos operacionais comerciais sem guardrails traz riscos severos:
1. **Ações externas não autorizadas:** LLM disparando comunicações errôneas ou promessas contratuais sem supervisão.
2. **Elevação de privilégio e Prompt Injection:** Conteúdo malicioso manipulando o agente para contornar verificações.
3. **Custos descontrolados de API:** Chamadas recursivas gerando faturas exorbitantes sem rate limits ou ledger.

---

## 2. Decisão Arquitetural

1. **Separação Técnica em Camadas (`@birthub/ai-runtime`):**
   - **`ToolRegistry`:** Ferramentas fortemente tipadas com classificação de sensibilidade (`read_only`, `draft`, `internal_write`, `sensitive_external_write`).
   - **`PolicyEngine`:** Avalia decisões de forma determinística **fora** do modelo. O LLM não tem permissão para elevar seu próprio nível de autonomia.
   - **`ModelGateway`:** Roteamento com rastreamento de tokens e precificação em BRL por execução.

2. **Classificação Rigorosa de Autonomia:**
   - **A0:** Somente recomendar (sem invocar ferramentas).
   - **A1:** Rascunhar (gera texto em staging sem disparar).
   - **A2:** Leitura autorizada (pesquisa em bases de dados).
   - **A3:** Escrita interna permitida (criação de tarefas internas).
   - **A4:** Ação sensível: **Aprovação humana explícita obrigatória**. A ação fica em estado `pending` na tabela `approval_requests` até que um operador humano aprove.

3. **Defesa contra Injeção de Prompt:**
   - Filtros de detecção de comandos de override (`ignore previous instructions`, `elevate autonomy`, `bypass approval`). Execuções com padrões adversariais falham de forma segura antes de consumir tokens ou ferramentas.

4. **FinOps e Ledger Imutável:**
   - Cada chamada gera registro em `ai_cost_ledger` auditável por tenant com isolamento por RLS.

---

## 3. Consequências e Validação

- 100% de conformidade com os critérios do Plano-Mestre.
- O gate de aceite de aprovação humana A4 e defesa contra injeção foi validado em teste automatizado sem waivers.
