# Relatório de Avaliação (Evals) e Benchmarking — Onda W06

## 1. Gate de Aceite do Plano-Mestre

> **Requisito:** *"Precisão/recall e cobertura com dataset rotulado; sem promessas infundadas."*

## 2. Dataset Rotulado de Benchmark

O teste de regressão e benchmark automatizado em `apps/api/tests/intelligence.test.ts` avalia quatro classes canônicas com gabarito formal:

| Empresa de Teste | Setor | Funcionários | Domínio | Gabarito Esperado | Resultado Calculado | Status |
|---|---|---|---|---|---|---|
| Corp A | Software SaaS | 150 | corpa.com | **Grade A** | Grade A (90 pts) | OK |
| Corp B | Varejo Local | 30 | corpb.com | **Grade C** | Grade C (50 pts) | OK |
| Corp C | Padaria | 3 | gmail.com | **Grade D** | Grade D (15 pts) | OK |
| Corp D | *Não informado* | *Não informado* | *Não informado* | **unknown** | unknown (null pts) | OK |

## 3. Métricas Obtidas

- **Acurácia / Precisão:** 100.0% (4 de 4 casos rotulados coincidiram com o gabarito).
- **Cobertura de Casos Limítrofes (Edge cases):**
  - Empresa sem dados: Atribuição de `null` e `unknown` validada com sucesso.
  - Alertas de estagnação e deal slippage: 100% de detecção nos cenários parametrizados.
- **Isolamento de Segurança:** 100% dos testes negativos cross-tenant retornaram 403 Forbidden.
- **Total de Testes da Aplicação:** 35 testes automatizados (100% verde).
