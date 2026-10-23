# ADR 0006 — Isolamento multi-tenant fail-closed e Row-Level Security (RLS)

**Status:** Aprovado — Onda W02.

## Contexto

A plataforma Birthub 360 Full Operation é um SaaS multi-tenant que processa dados sensíveis de oportunidades, empresas e contatos de múltiplos clientes corporativos. A violação do isolamento cross-tenant representa um risco crítico e inaceitável. Confiar apenas na lógica da camada de aplicação (`WHERE tenant_id = ?`) é historicamente suscetível a regressões e falhas de desenvolvimento.

## Decisão

Implementar uma estratégia de isolamento em profundidade (Defense-in-Depth) com modelo **fail-closed**:
1. **Camada de Aplicação:** Hook de autenticação Fastify resolve e injeta `request.tenant` e `request.user`. Qualquer rota privada sem tenant válido é terminada com HTTP 401. Toda busca de recurso valida a pertinência do `tenant_id` e dispara `CrossTenantViolationError` (HTTP 403) em caso de divergência.
2. **Camada de Banco de Dados (PostgreSQL):** Tabelas de dados contêm a coluna obrigatória `tenant_id NOT NULL`. A aplicação runtime roda com a role `birthub_app` (sem `SUPERUSER` e sem `BYPASSRLS`). Habilitação estrita de `ROW LEVEL SECURITY` (`FORCE ROW LEVEL SECURITY`). Políticas RLS utilizam a função `current_tenant_id()`, retornando vazio (`fail-closed`) se o contexto de tenant não estiver explicitamente configurado na sessão.

## Consequências

- **Positivas:** Blindagem contra vazamento acidental cross-tenant mesmo em caso de erro na camada de aplicação; auditoria centralizada.
- **Negativas / Cuidados:** Toda conexão do pool de banco deve configurar o contexto do tenant antes da execução da query, e os testes de integração devem cobrir cenários adversariais deliberados.
