# Relatório de Testes de Consentimento e Cadências — Onda W08

## 1. Escopo de Validação

Os testes automatizados em `apps/api/tests/automations.test.ts` cobrem os critérios do gate de aceite:

| ID | Cenário | Resultado | Duração |
|---|---|---|---|
| T01 | Autenticação e tokens | Passou | ~616ms |
| T02 | Listar e criar workflow de cadência comercial | Passou | ~71ms |
| T03 | Disparo de workflow para oportunidade normal | Passou | ~137ms |
| T04 | **GATE OBRIGATÓRIO: Contato com opt-out cancela execução de automação** | Passou | ~164ms |
| T05 | Geração de proposta comercial reconciliada com dados do Deal | Passou | ~123ms |
| T06 | Consulta de proposta comercial por ID | Passou | ~18ms |
| T07 | Tentativa adversarial cross-tenant bloqueada com 403 | Passou | ~4ms |

## 2. Evidências

- **Total de testes da suíte completa:** 53 testes automatizados (100% verde).
- **Cancelamento por Opt-Out:** 100% comprovado em teste automatizado T04.
- **Isolamento de Segurança:** 100% dos testes negativos cross-tenant retornaram 403 Forbidden.
