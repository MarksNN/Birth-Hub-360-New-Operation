# ADR 0009: Integrações Externas, Outbox Pattern e Reconciliação com Bitrix24

- **Status:** Aceito
- **Data:** 2026-10-24
- **Decisores:** Agente 00 (Coordenação Técnica e Integração), Agente 24 (Auditoria Independente)
- **Contexto:** Onda W05 — Integrações e sincronização

---

## 1. Contexto e Problema

O Birthub 360 Full Operation adota a premissa de **conectar e operar CRMs existentes primeiro** (a começar pelo Bitrix24), sem exigir migração total e sem corromper dados existentes.
Os maiores riscos técnicos em integrações bi-direcionais são:
1. **Replay e duplicação de dados:** webhooks repetidos ou reprocessamento de mensagens gerando oportunidades ou tarefas duplicadas no CRM.
2. **Concorrência e sobrescrita silenciosa:** perda de dados modificados localmente quando o CRM externo envia um dado defasado.
3. **Vazamento cross-tenant:** dados de uma organização sendo gravados ou expostos para outra em integrações compartilhadas.
4. **Instabilidade e perda de eventos externos:** indisponibilidade temporária de rede ou do backend resultando em perda de sync.

---

## 2. Decisão Arquitetural

1. **Pacote Isolado `@birthub/integration-kit`:**
   - Contém adaptadores canônicos (`Bitrix24Adapter`), desacoplando o payload bruto do Bitrix24 das entidades do domínio do Birthub.
   - Todo dado importado recebe proveniência explícita (`source: "bitrix24"`, `externalId: "<id>"`).

2. **Garantia de Idempotência e Prevenção de Replay:**
   - Validação em tempo constante do token de segurança do webhook.
   - Motor de idempotência (`IdempotencyEngine`) baseado em hash SHA-256 do payload e chave composta `tenantId:key`.
   - Webhooks ou mensagens duplicadas retornam status `ignored_replay` sem duplicar nenhuma entidade nem emitir eventos duplicados.

3. **Padrão Transacional Outbox e Dead-Letter Queue (DLQ):**
   - Criação da tabela `outbox_events` isolada por RLS (`FORCE ROW LEVEL SECURITY`).
   - Política de retentativas com backoff exponencial e limite máximo de tentativas (`maxRetries = 3`).
   - Eventos que excedem o limite são encaminhados automaticamente para a Dead-Letter Queue (`dead_letter`) com auditoria do erro.

4. **Sincronização Incremental com Cursors:**
   - Utilização de `sync_cursors` por tenant, provedor e tipo de entidade para evitar re-leitura completa de bases volumosas.

5. **Detecção e Resolução Explícita de Conflitos:**
   - Tabela `sync_conflicts` rastreia divergências entre valores locais e externos.
   - Em vez de adotar Last-Write-Wins cego, registra-se conflito com status `pending` e permite-se resolução auditada (`keep_local`, `overwrite_with_external`, `manual_merge`).

---

## 3. Consequências e Mitigações

- **Positivas:**
  - Zero duplicação garantida por contrato e testes automatizados.
  - Fail-closed: webhooks sem token válido ou com token incorreto são rejeitados com 401.
  - Rastreabilidade ponta a ponta de todas as sincronizações.
- **Mitigações:**
  - O banco de dados Postgres aplica `FORCE ROW LEVEL SECURITY` e `uq_tenant_provider_external` para garantir que o isolamento ocorra a nível de banco e não apenas na camada de aplicação.
