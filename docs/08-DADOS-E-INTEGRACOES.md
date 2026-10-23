# Dados, contratos e integrações

## Entidades do domínio inicialmente necessárias

- `Organization`, `Membership`, `RoleGrant`, `Policy`, `AuditEvent`
- `Account`, `Contact`, `Lead`, `Opportunity`, `Pipeline`, `Stage`, `Activity`, `Note`
- `IntegrationConnection`, `ExternalIdentity`, `SyncCursor`, `SyncRun`, `SyncConflict`
- `Signal`, `ScoreSnapshot`, `Recommendation`, `ForecastSnapshot`
- `AgentDefinition`, `AgentRun`, `ToolExecution`, `ApprovalRequest`, `AICostLedger`
- `ConsentRecord`, `ContactPreference`, `WorkflowRun`, `OutboxEvent`
- `Subscription`, `PlanEntitlement`, `UsageRecord`, `BillingEvent`

**Campos essenciais para entidades tenant-scoped:** id, organizationId, createdAt, updatedAt, version, createdBy quando relevante, origem/proveniência e soft-delete apenas onde realmente necessário.

## Conectores em ondas

1. **Bitrix24:** read-first; webhook, incremental polling, reconciliação, permissões e mapeamento de fases.
2. **Apollo.io / dados comerciais:** enriquecimento com limites e rastreamento de proveniência.
3. **Google Places e CNPJ:** características da empresa e validação com termos de uso, qualidade e LGPD.
4. **Email/calendário/comunicação:** somente quando houver política, consentimento e necessidade validada.
5. **Billing provider:** subscription, webhooks idempotentes e ledger.

## Engenharia de sincronização

- Contrato com `organizationId`, `provider`, `externalId`, timestamps e `syncVersion`.
- Webhook validado por assinatura/segredo, replay e deduplicação.
- Reconciliação por cursor + polling em janela; não confiar exclusivamente em webhook.
- Conflict resolution explícita: `source_of_truth`, ownership de campos, last-write apenas se apropriado.
- DLQ, retry com backoff e token bucket por provedor; ambientes separados.
- Observabilidade de sync (quantidade de registros, lag, campos rejeitados, conflitos, backfills).
- Scoring registra versão, features, confiança, fonte e instante da computação.

## Qualidade de dados

Regras de completude, atualidade, validade, duplicação e consistência, registradas por origem; score sem evidência é `unknown`, não zero. Integração externa não é licença para redistribuir dados protegidos.

## API e esquema

Começar pelo OpenAPI e eventos JSON/Zod versionados. Todos os contratos de escrita devem especificar autorização, limites, idempotência, comportamento de erro e semântica de auditoria.
