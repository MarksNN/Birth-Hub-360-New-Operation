import type { FastifyPluginAsync } from "fastify";
import type {
  ConflictResolution,
  IntegrationProvider,
  TenantId,
  UserId,
} from "@birthub/contracts";
import type { BitrixWebhookPayload, IntegrationsService } from "./integrations.service.js";

export const integrationsRoutes: FastifyPluginAsync<{
  integrationsService: IntegrationsService;
}> = async (fastify, options) => {
  const { integrationsService } = options;

  /**
   * Status das Integrações do Tenant
   */
  fastify.get("/integrations/status", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const tenantId = request.tenant.id;
    const bitrix = integrationsService.getIntegration(tenantId, "bitrix24");

    return reply.status(200).send({
      success: true,
      data: {
        bitrix24: bitrix
          ? {
              status: bitrix.status,
              domain: (bitrix.settings.domain as string) || null,
              lastSyncAt: bitrix.lastSyncAt || null,
            }
          : { status: "disconnected" },
      },
    });
  });

  /**
   * Conectar ou Atualizar Integração Bitrix24
   */
  fastify.post<{
    Body: {
      domain: string;
      webhookSecret: string;
    };
  }>("/integrations/bitrix24/connect", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const tenantId = request.tenant.id;
    const { domain, webhookSecret } = request.body;

    if (!domain || !webhookSecret) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "domain e webhookSecret são obrigatórios" },
      });
    }

    const integration = integrationsService.connectBitrix24({
      tenantId,
      domain,
      webhookSecret,
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: integration.id,
        provider: integration.provider,
        status: integration.status,
      },
    });
  });

  /**
   * Webhook do Bitrix24 com validação de token e prevenção de replay
   */
  fastify.post<{
    Body: BitrixWebhookPayload;
    Headers: {
      "x-bitrix-token"?: string;
      "x-idempotency-key"?: string;
    };
  }>("/webhooks/bitrix24", async (request, reply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();
    const tenantId = request.tenant.id;
    const actorId = request.user.id;
    const receivedToken = request.headers["x-bitrix-token"];
    const idempotencyKey = request.headers["x-idempotency-key"];

    const result = await integrationsService.handleBitrixWebhook({
      tenantId,
      actorId,
      payload: request.body,
      receivedToken,
      idempotencyKey,
    });

    if (result.status === "unauthorized") {
      return reply.status(401).send({
        success: false,
        error: { code: "INVALID_WEBHOOK_TOKEN", message: "Token de webhook do Bitrix24 inválido ou não autorizado" },
      });
    }

    if (result.status === "ignored_replay") {
      return reply.status(200).send({
        success: true,
        data: { status: "ignored_replay", message: "Payload duplicado já processado com idempotência" },
      });
    }

    if (result.status === "invalid_payload") {
      return reply.status(400).send({
        success: false,
        error: { code: "INVALID_PAYLOAD", message: "Dados do webhook não possuem os campos mínimos necessários" },
      });
    }

    return reply.status(200).send({
      success: true,
      data: { status: "processed", entityId: result.entityId },
    });
  });

  /**
   * Disparo de sincronização incremental
   */
  fastify.post<{
    Body: {
      items: Array<{
        ID: string;
        TITLE: string;
        STAGE_ID: string;
        OPPORTUNITY: string;
        CURRENCY_ID: string;
        ASSIGNED_BY_ID: string;
        DATE_CREATE: string;
        DATE_MODIFY: string;
      }>;
    };
  }>("/integrations/bitrix24/sync", async (request, reply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();
    const tenantId = request.tenant.id;
    const actorId = request.user.id;

    const items = request.body.items || [];
    const result = await integrationsService.syncBitrixIncremental({
      tenantId,
      actorId,
      batchItems: items,
    });

    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  /**
   * Conflitos de Sincronização
   */
  fastify.get("/integrations/conflicts", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const tenantId = request.tenant.id;
    const conflicts = integrationsService.getConflicts(tenantId);

    return reply.status(200).send({
      success: true,
      data: conflicts,
    });
  });

  /**
   * Resolver Conflito de Sincronização
   */
  fastify.post<{
    Params: { id: string };
    Body: { resolution: ConflictResolution };
  }>("/integrations/conflicts/:id/resolve", async (request, reply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();
    const tenantId = request.tenant.id;
    const userId = request.user.id;
    const conflictId = request.params.id;
    const { resolution } = request.body;

    if (!resolution) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "resolution é obrigatório" },
      });
    }

    const resolved = integrationsService.resolveConflict({
      conflictId,
      tenantId,
      resolution,
      userId,
    });

    if (!resolved) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Conflito não encontrado no tenant" },
      });
    }

    return reply.status(200).send({
      success: true,
      data: resolved,
    });
  });

  /**
   * Outbox Events do Tenant
   */
  fastify.get("/integrations/outbox", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const tenantId = request.tenant.id;
    const events = integrationsService.getOutboxEvents(tenantId);

    return reply.status(200).send({
      success: true,
      data: events,
    });
  });

  /**
   * Dead-Letter Queue (DLQ)
   */
  fastify.get("/integrations/dead-letters", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const tenantId = request.tenant.id;
    const deadLetters = integrationsService.getDeadLetters(tenantId);

    return reply.status(200).send({
      success: true,
      data: deadLetters,
    });
  });
};
