# ADR 0001 — Monólito modular primeiro

**Status:** proposta — validar W01.

## Contexto

O projeto original possui grande número de módulos e workflows; iniciar com microsserviços amplifica superfície operacional e contratos.

## Decisão

API principal monólito modular em Node/TypeScript e workers separados por processo. Extração de serviços somente com análise de carga, ownership, confiabilidade e custo.

## Consequências

Reduz overhead e facilita transações/depuração; exige enforcement de limites de módulos, dependências e observabilidade desde o início.
