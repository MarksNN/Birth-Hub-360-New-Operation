import type { FastifyPluginAsync } from "fastify";
import type { CadenceStep, CadenceWorkflow } from "@birthub/contracts";
import type { AutomationsService } from "./automations.service.js";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export const automationsRoutes: FastifyPluginAsync<{
  automationsService: AutomationsService;
}> = async (fastify, options) => {
  const { automationsService } = options;

  /**
   * Listar Cadências e Workflows
   */
  fastify.get("/automations/workflows", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const list = automationsService.listWorkflows(request.tenant.id);
    return { success: true, data: list };
  });

  /**
   * Criar Cadência / Playbook
   */
  fastify.post<{
    Body: {
      name: string;
      triggerType: CadenceWorkflow["triggerType"];
      steps: CadenceStep[];
    };
  }>("/automations/workflows", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const { name, triggerType, steps } = request.body;

    if (!name || !triggerType || !steps) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "name, triggerType e steps são obrigatórios" },
      });
    }

    const workflow = automationsService.createWorkflow(request.tenant.id, {
      name,
      triggerType,
      steps,
    });
    return reply.status(201).send({ success: true, data: workflow });
  });

  /**
   * Disparar Workflow para uma Entidade (com verificação de Opt-out)
   */
  fastify.post<{
    Params: { id: string };
    Body: {
      entityId: string;
      contactId?: string;
    };
  }>("/automations/workflows/:id/trigger", async (request, reply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();

    try {
      const run = automationsService.triggerWorkflow({
        workflowId: request.params.id,
        tenantId: request.tenant.id,
        entityId: request.body.entityId,
        contactId: request.body.contactId,
        userId: request.user.id,
      });

      return reply.status(200).send({ success: true, data: run });
    } catch (err) {
      if (err instanceof CrossTenantViolationError) {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: err.message } });
      }
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: (err as Error).message } });
    }
  });

  /**
   * Registrar Consentimento / Opt-Out (LGPD)
   */
  fastify.post<{
    Body: {
      contactId: string;
      channel: "email" | "phone" | "whatsapp";
      status: "opt_in" | "opt_out";
      source: string;
    };
  }>("/automations/consent", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const { contactId, channel, status, source } = request.body;

    if (!contactId || !channel || !status) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "contactId, channel e status são obrigatórios" },
      });
    }

    const consent = automationsService.recordConsent(request.tenant.id, {
      contactId,
      channel,
      status,
      source: source || "direct_request",
    });

    return reply.status(200).send({ success: true, data: consent });
  });

  /**
   * Gerar Proposta Comercial Vinculada ao Deal
   */
  fastify.post<{
    Body: {
      dealId: string;
      title: string;
      templateId: string;
    };
  }>("/automations/proposals", async (request, reply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();
    const { dealId, title, templateId } = request.body;

    if (!dealId || !title || !templateId) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "dealId, title e templateId são obrigatórios" },
      });
    }

    try {
      const proposal = automationsService.generateProposal({
        tenantId: request.tenant.id,
        userId: request.user.id,
        dealId,
        title,
        templateId,
      });

      return reply.status(201).send({ success: true, data: proposal });
    } catch (err) {
      if (err instanceof CrossTenantViolationError) {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: err.message } });
      }
      return reply.status(400).send({ success: false, error: { code: "BAD_REQUEST", message: (err as Error).message } });
    }
  });

  /**
   * Consultar Proposta Comercial
   */
  fastify.get<{
    Params: { id: string };
  }>("/automations/proposals/:id", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();

    try {
      const proposal = automationsService.getProposal(request.tenant.id, request.params.id);
      return { success: true, data: proposal };
    } catch (err) {
      if (err instanceof CrossTenantViolationError) {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: err.message } });
      }
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: (err as Error).message } });
    }
  });
};
