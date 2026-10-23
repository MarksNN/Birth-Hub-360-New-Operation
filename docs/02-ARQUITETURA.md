# Arquitetura de referência

## Decisão central

**Monólito modular** para o core comercial, com API única e workers separados por processo; extrair serviços independentes apenas quando carga, autonomia de equipe ou requisitos de disponibilidade justificarem. Não começar com malha de microserviços.

## Stack proposta

| Camada | Proposta | Critério |
|---|---|---|
| Web | React + TypeScript + Vite | produtividade, testes, desempenho |
| UI | Tailwind + Radix/shadcn como base + tokens próprios | consistência e acessibilidade |
| API | TypeScript + Fastify + OpenAPI | schemas, plugins e contratos |
| Domínio | módulos DDD leves + use cases | regras independentes do framework |
| DB | PostgreSQL + Prisma + RLS | integridade e segregação |
| Jobs | Redis + BullMQ + outbox transacional | processamento resiliente |
| Vetores | pgvector no começo; Qdrant só se necessidade demonstrada | reduzir número de bancos |
| Arquivos | S3 + criptografia + URLs de curta duração | arquivos/documentos |
| IA | gateway com modelos intercambiáveis e registry de ferramentas | controle de custo/risco |
| Deploy | AWS ECS/Fargate + RDS, IAM, Secrets Manager | operação gradual |
| Telemetria | OpenTelemetry, métricas, logs estruturados, error tracking | evidência ponta a ponta |

## Contextos de domínio

- **identity:** tenancy, membership, grants, políticas, auditoria de permissão.
- **crm:** contas/empresas, contatos, leads, oportunidades, pipeline, atividades, notas.
- **integrations:** conexões, external IDs, webhooks, sync cursor, reconciliação.
- **intelligence:** sinais, ICP, scores, risco, next-best-action, forecast.
- **agents:** agent definitions, tool calls, plans, approvals, evaluations, costs.
- **engagement:** cadências, tarefas, mensagens consentidas, opt-out.
- **revenue:** propostas, metas, planos, cotas, cobrança, entitlements.
- **governance:** auditoria, data retention, incidents, DSR, observabilidade.

## Dependências permitidas

```text
apps/web ──────► packages/contracts ◄───── apps/api
     │                   ▲                     │
     ▼                   │                     ▼
packages/design-system   │                 packages/domain
                         │                     ▲
apps/workers ──────────────────────────────┘
     │
     ├──► packages/integration-kit
     └──► packages/ai-runtime
```

Dependências entre módulos de domínio só por interfaces/eventos versionados, nunca importando controllers ou modelos ORM uns dos outros. Contratos não importam infraestrutura.

## Design de APIs

- REST versionada (`/api/v1`) com OpenAPI; eventual GraphQL apenas se necessidade demonstrada.
- Schema por rota, normalização de erro com `code`, `message`, `requestId`, `details` seguros.
- Paginação cursor-based em listagens extensas.
- `Idempotency-Key` para escritas externas/repetíveis.
- ETag ou versão de entidade nas mutações concorrentes.
- Autenticação e autorização server-side em toda rota privada.
- API sem pressupor formato legado `response.data.data` ou wrappers ambíguos.

## Eventos, filas e idempotência

1. Estado e `outbox_event` gravados na mesma transação de banco.
2. Worker publica/processa com `event_id` e `organization_id` explícitos.
3. Consumer valida tenant e política; reprocessamento idempotente.
4. Tentativas e backoff; DLQ com replay auditado.
5. Métricas de lag, falha por conector e reconciliação.

## Estratégia multi-tenant

- ID organizacional obrigatório em entidade tenant-scoped, chaves únicas compostas quando aplicáveis.
- RLS ativado e `FORCE ROW LEVEL SECURITY` onde apropriado; roles runtime sem `BYPASSRLS`.
- Contexto de tenant por transação/connection-scoped, com limpeza e testes de pooling.
- Jobs, cache keys, vetores, objetos S3 e exportações sempre organizacionais.
- Dados administrativos globais mínimos e explicitamente separados.
- Verificações de fuga cruzada automatizadas (API, filas, consultas, arquivos, logs).

## Modos de falha

Definir timeout, circuit breaker e retries por conector; leitura degradada quando provedores externos falham; filas com deduplicação; fail closed em autorização; dashboards distinguem `unknown` de `zero`.

## Operação por ambiente

`local → test isolado → preview de PR → homologação → produção`, com configurações e dados separados. Sem chave de produção em CI de PR. Migrations `expand → migrate → contract`; rollback de aplicação não implica rollback destrutivo do esquema.
