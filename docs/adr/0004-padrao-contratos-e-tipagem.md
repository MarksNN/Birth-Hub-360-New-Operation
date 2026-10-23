# ADR 0004 — Contratos compartilhados tipados no monorepo

**Status:** Aprovado — Onda W01.

## Contexto

A plataforma Birthub 360 Full Operation integra múltiplos domínios (identidade, CRM, agentes, inteligência e conectores) em um monorepo com frontend React e backend Fastify. A duplicação de tipos ou uso de contratos frouxos gera risco de dessincronização, bugs em tempo de execução e vazamento de modelos internos de banco de dados para a API pública.

## Decisão

Adotar o pacote central `@birthub/contracts` como fonte única da verdade para DTOs, interfaces de entidades, contratos de API e modelos de execução de agentes. Nenhum endpoint deve expor diretamente entidades brutas do banco de dados; todas as respostas e payloads devem ser tipados e referenciados por contratos.

## Consequências

- **Positivas:** Tipagem estrita de ponta a ponta, autocompletion confiável no cliente e servidor, evolução controlada de schemas de eventos e agentes.
- **Negativas / Cuidados:** Alterações em contratos centrais requerem build e verificação em todos os workspaces dependentes (`apps/api`, `apps/web`).
