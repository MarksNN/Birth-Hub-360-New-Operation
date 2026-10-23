# ADR 0005 — Ambiente local e isolamento com PostgreSQL 16 e Redis 7

**Status:** Aprovado — Onda W01.

## Contexto

Para o desenvolvimento rápido e reproduzível das fatias verticais sem depender de nuvem ou emuladores incompletos, a equipe necessita de banco relacional com suporte a Row-Level Security (RLS) avançado e de mensageria em memória para o Outbox Pattern e workers assíncronos (BullMQ).

## Decisão

Padronizar o ambiente de desenvolvimento local com `docker compose` em `infra/local/docker-compose.yml`, provendo:
1. **PostgreSQL 16:** com extensões `uuid-ossp` e `pgcrypto`, criando a role restrita `birthub_app` (sem `SUPERUSER` e sem `BYPASSRLS`) para o runtime da aplicação.
2. **Redis 7:** para filas de execução assíncrona, idempotência e dead-letter queue.
3. Healthchecks nativos para garantir que os serviços estejam saudáveis antes da conexão da API.

## Consequências

- **Positivas:** Paridade arquitetural entre ambiente de desenvolvimento e produção, simulação fiel de isolamento multi-tenant fail-closed e testes de integração determinísticos.
- **Negativas / Cuidados:** Desenvolvedores devem possuir Docker ou Docker Desktop configurado localmente; em CI de testes unitários rápidos, o backend continua desacoplado com injeção de dependências.
