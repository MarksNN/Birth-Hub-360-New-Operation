# ADR 0002 — Decisões de agentes mediadas por política

**Status:** proposta — validar W07.

## Decisão

Toda operação de ferramenta possui contrato, escopo por tenant, autenticação, nível de autonomia, orçamento, idempotência, auditoria e aprovação quando exigida. O LLM não concede privilégios a si mesmo.

## Consequências

Há overhead de orquestração, compensado por redução de risco e confiança no resultado. Prompts são versionados e avaliados.
