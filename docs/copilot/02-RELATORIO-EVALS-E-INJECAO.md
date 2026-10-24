# Relatório de Evals, Injeção Adversarial e FinOps — Onda W07

## 1. Escopo de Validação

Os testes automatizados em `apps/api/tests/copilot.test.ts` cobrem todos os requisitos do gate de aceite:

| ID | Teste | Resultado | Duração |
|---|---|---|---|
| T01 | Autenticação e tokens | Passou | ~252ms |
| T02 | Agente de recomendação A0 sem ferramentas | Passou | ~34ms |
| T03 | Agente A1 invoca ferramenta de rascunho autorizada | Passou | ~29ms |
| T04 | Tentativa de violação de autonomia barrada pela política | Passou | ~4ms |
| T05 | **GATE OBRIGATÓRIO: Ação sensível A4 NÃO executa sem aprovação humana** | Passou | ~16ms |
| T06 | Operador humano resolve aprovação com 'approve' | Passou | ~7ms |
| T07 | **GATE OBRIGATÓRIO: Prompt Injection adversarial neutralizado** | Passou | ~8ms |
| T08 | FinOps & Ledger de Custos registra tokens e BRL | Passou | ~3ms |
| T09 | Tentativa adversarial cross-tenant bloqueada com 403 | Passou | ~5ms |

## 2. Resultados

- **Total de testes da suíte completa:** 45 testes automatizados (100% verde).
- **Taxa de bloqueio adversarial:** 100% de neutralização de injeções de prompt.
- **Human-in-the-Loop:** Zero disparos externos efetuados sem assinatura de operador humano.
