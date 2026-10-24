import { randomUUID } from "node:crypto";
import type {
  ConflictResolution,
  ExternalIdentity,
  ExternalIntegration,
  IntegrationProvider,
  OutboxEvent,
  SyncConflict,
  SyncCursor,
  SyncResult,
  TenantId,
  UserId,
} from "@birthub/contracts";
import {
  ConflictResolutionEngine,
  IdempotencyEngine,
  OutboxProcessor,
  mapBitrixCompany,
  mapBitrixContact,
  mapBitrixDeal,
  type BitrixCompanyRaw,
  type BitrixContactRaw,
  type BitrixDealRaw,
} from "@birthub/integration-kit";
import type { CrmService } from "../crm/crm.service.js";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export interface BitrixWebhookPayload {
  event: string;
  auth?: {
    application_token?: string;
    domain?: string;
  };
  data?: {
    FIELDS?: {
      ID: string;
      [key: string]: unknown;
    };
  };
}

export class IntegrationsService {
  private integrations = new Map<string, ExternalIntegration>();
  private externalIdentities = new Map<string, ExternalIdentity>();
  private cursors = new Map<string, SyncCursor>();
  private idempotencyEngine = new IdempotencyEngine();
  private conflictEngine = new ConflictResolutionEngine();
  private outboxProcessor = new OutboxProcessor();

  constructor(private crmService: CrmService) {
    this.seedDefaultIntegrations();
  }

  private seedDefaultIntegrations() {
    const tenantId = "tenant-alpha-001";
    const integrationId = "integ-bitrix-alpha-01";
    this.integrations.set(integrationId, {
      id: integrationId,
      tenantId,
      provider: "bitrix24",
      status: "active",
      settings: {
        domain: "alpha.bitrix24.com.br",
        webhookSecret: "sec_bitrix_alpha_tok_9988",
      },
      createdAt: new Date().toISOString(),
    });
  }

  public getIntegration(tenantId: TenantId, provider: IntegrationProvider): ExternalIntegration | undefined {
    for (const integ of this.integrations.values()) {
      if (integ.tenantId === tenantId && integ.provider === provider) {
        return integ;
      }
    }
    return undefined;
  }

  public connectBitrix24(params: {
    tenantId: TenantId;
    domain: string;
    webhookSecret: string;
  }): ExternalIntegration {
    const existing = this.getIntegration(params.tenantId, "bitrix24");
    if (existing) {
      existing.settings = { domain: params.domain, webhookSecret: params.webhookSecret };
      existing.status = "active";
      return existing;
    }

    const integration: ExternalIntegration = {
      id: `integ_${randomUUID()}`,
      tenantId: params.tenantId,
      provider: "bitrix24",
      status: "active",
      settings: {
        domain: params.domain,
        webhookSecret: params.webhookSecret,
      },
      createdAt: new Date().toISOString(),
    };
    this.integrations.set(integration.id, integration);
    return integration;
  }

  /**
   * Processamento de Webhook Bitrix24 com garantia de Idempotência e Prevenção de Replay
   */
  public async handleBitrixWebhook(params: {
    tenantId: TenantId;
    payload: BitrixWebhookPayload;
    receivedToken?: string;
    idempotencyKey?: string;
    actorId: UserId;
  }): Promise<{ status: "processed" | "ignored_replay" | "unauthorized" | "invalid_payload"; entityId?: string }> {
    const integration = this.getIntegration(params.tenantId, "bitrix24");
    if (!integration || integration.status !== "active") {
      return { status: "unauthorized" };
    }

    const expectedToken = (integration.settings.webhookSecret as string) || "";
    const received = params.receivedToken || params.payload.auth?.application_token;

    if (!this.idempotencyEngine.validateWebhookToken(expectedToken, received)) {
      return { status: "unauthorized" };
    }

    const idempKey = params.idempotencyKey || `${params.payload.event}:${params.payload.data?.FIELDS?.ID}`;

    // Teste de Replay
    if (this.idempotencyEngine.isReplay(params.tenantId, idempKey, params.payload)) {
      return { status: "ignored_replay" };
    }

    const rawId = params.payload.data?.FIELDS?.ID;
    if (!rawId) {
      return { status: "invalid_payload" };
    }

    // Processa de acordo com o evento
    let entityId: string | undefined;

    if (params.payload.event.includes("DEAL") || params.payload.event === "ONCRMDEALADD" || params.payload.event === "ONCRMDEALUPDATE") {
      const rawDeal: BitrixDealRaw = {
        ID: String(rawId),
        TITLE: String(params.payload.data?.FIELDS?.TITLE || `Oportunidade Bitrix #${rawId}`),
        STAGE_ID: String(params.payload.data?.FIELDS?.STAGE_ID || "NEW"),
        OPPORTUNITY: String(params.payload.data?.FIELDS?.OPPORTUNITY || "0"),
        CURRENCY_ID: String(params.payload.data?.FIELDS?.CURRENCY_ID || "BRL"),
        ASSIGNED_BY_ID: String(params.payload.data?.FIELDS?.ASSIGNED_BY_ID || params.actorId),
        DATE_CREATE: new Date().toISOString(),
        DATE_MODIFY: new Date().toISOString(),
      };

      const mapped = mapBitrixDeal(rawDeal, params.tenantId, params.actorId);

      // Checa se já existe mapeamento de identidade externa
      const identityKey = `${params.tenantId}:bitrix24:deal:${rawId}`;
      const existingIdentity = this.externalIdentities.get(identityKey);

      if (existingIdentity) {
        // Entidade já existe: verifica concorrência / conflitos
        const localDeal = this.crmService.getDeal(params.tenantId, existingIdentity.localId);
        if (localDeal) {
          const conflicts = this.conflictEngine.evaluateConflict({
            tenantId: params.tenantId,
            provider: "bitrix24",
            entityType: "deal",
            localId: localDeal.id,
            externalId: String(rawId),
            comparisons: [
              { fieldName: "title", localValue: localDeal.title, externalValue: mapped.title },
              { fieldName: "value", localValue: localDeal.value, externalValue: mapped.value },
            ],
          });

          if (conflicts.length > 0) {
            // Conflito detectado: enfileira evento no outbox para reconciliação assistida
            this.outboxProcessor.enqueue({
              tenantId: params.tenantId,
              eventType: "integration.sync.conflict_detected",
              aggregateType: "deal",
              aggregateId: localDeal.id,
              payload: { conflicts, rawPayload: params.payload },
              idempotencyKey: idempKey,
            });
            this.idempotencyEngine.markProcessed(params.tenantId, idempKey, params.payload, "conflict_detected");
            return { status: "processed", entityId: localDeal.id };
          }
        }
        entityId = existingIdentity.localId;
      } else {
        // Nova oportunidade criada a partir do Bitrix24
        const createdDeal = this.crmService.createDeal(
          params.tenantId,
          params.actorId,
          {
            title: mapped.title,
            value: mapped.value,
            currency: mapped.currency,
            stage: mapped.stage,
            source: mapped.source,
            externalId: mapped.externalId,
          }
        );

        entityId = createdDeal.id;

        const extIdentity: ExternalIdentity = {
          id: `ext_${randomUUID()}`,
          tenantId: params.tenantId,
          provider: "bitrix24",
          entityType: "deal",
          localId: createdDeal.id,
          externalId: String(rawId),
          syncVersion: 1,
          lastSyncedAt: new Date().toISOString(),
        };
        this.externalIdentities.set(identityKey, extIdentity);
      }
    }

    // Marca como processada
    this.idempotencyEngine.markProcessed(params.tenantId, idempKey, params.payload, "success");

    // Enfileira evento de sucesso no Outbox
    if (entityId) {
      this.outboxProcessor.enqueue({
        tenantId: params.tenantId,
        eventType: "integration.bitrix24.synced",
        aggregateType: "deal",
        aggregateId: entityId,
        payload: { externalId: rawId, event: params.payload.event },
        idempotencyKey: idempKey,
      });
    }

    return { status: "processed", entityId };
  }

  /**
   * Sincronização Incremental em Batch com Gerenciamento de Cursor
   */
  public async syncBitrixIncremental(params: {
    tenantId: TenantId;
    actorId: UserId;
    batchItems: BitrixDealRaw[];
  }): Promise<SyncResult> {
    const integration = this.getIntegration(params.tenantId, "bitrix24");
    if (!integration) {
      throw new CrossTenantViolationError("Integração Bitrix24 não encontrada ou não autorizada para o tenant");
    }

    const cursorKey = `${params.tenantId}:bitrix24:deal`;
    const cursor = this.cursors.get(cursorKey) || {
      id: `cur_${randomUUID()}`,
      tenantId: params.tenantId,
      provider: "bitrix24",
      entityType: "deal",
      cursorValue: "0",
      updatedAt: new Date().toISOString(),
    };

    let created = 0;
    let updated = 0;
    let conflicts = 0;
    let maxId = parseInt(cursor.cursorValue, 10) || 0;

    for (const item of params.batchItems) {
      const itemId = parseInt(item.ID, 10);
      if (itemId > maxId) {
        maxId = itemId;
      }

      const idempKey = `sync_deal_${item.ID}_${item.DATE_MODIFY || ""}`;
      const res = await this.handleBitrixWebhook({
        tenantId: params.tenantId,
        actorId: params.actorId,
        idempotencyKey: idempKey,
        receivedToken: integration.settings.webhookSecret as string,
        payload: {
          event: "ONCRMDEALUPDATE",
          auth: { application_token: integration.settings.webhookSecret as string },
          data: {
            FIELDS: {
              ID: item.ID,
              TITLE: item.TITLE,
              STAGE_ID: item.STAGE_ID,
              OPPORTUNITY: item.OPPORTUNITY,
              CURRENCY_ID: item.CURRENCY_ID,
            },
          },
        },
      });

      if (res.status === "processed") {
        created++;
      }
    }

    // Atualiza cursor
    cursor.cursorValue = String(maxId);
    cursor.updatedAt = new Date().toISOString();
    this.cursors.set(cursorKey, cursor);

    integration.lastSyncAt = new Date().toISOString();

    const pendingConflicts = this.conflictEngine.getPendingConflicts(params.tenantId);

    return {
      syncRunId: `sync_${randomUUID()}`,
      tenantId: params.tenantId,
      provider: "bitrix24",
      processed: params.batchItems.length,
      created,
      updated,
      conflicts: pendingConflicts.length,
      errors: 0,
      status: pendingConflicts.length > 0 ? "completed_with_conflicts" : "completed",
      cursor: cursor.cursorValue,
    };
  }

  public getConflicts(tenantId: TenantId): SyncConflict[] {
    return this.conflictEngine.getPendingConflicts(tenantId);
  }

  public resolveConflict(params: {
    conflictId: string;
    tenantId: TenantId;
    resolution: ConflictResolution;
    userId: UserId;
  }): SyncConflict | null {
    return this.conflictEngine.resolveConflict(
      params.conflictId,
      params.tenantId,
      params.resolution,
      params.userId
    );
  }

  public getOutboxEvents(tenantId: TenantId): OutboxEvent[] {
    return this.outboxProcessor.getEventsByTenant(tenantId);
  }

  public getDeadLetters(tenantId: TenantId): OutboxEvent[] {
    return this.outboxProcessor.getDeadLetters(tenantId);
  }

  public async processOutboxQueue(): Promise<{ processed: number; failed: number; sentToDlq: number }> {
    return this.outboxProcessor.processPending(async (event) => {
      // Simula transmissão resiliente do evento para o broker ou webhook
      if (event.payload && (event.payload as { shouldFail?: boolean }).shouldFail) {
        return false;
      }
      return true;
    });
  }
}
