import type { FastifyPluginAsync } from "fastify";
import type { AgentType, AutonomyLevel } from "@birthub/contracts";
import type { CopilotService } from "./copilot.service.js";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export const copilotRoutes: FastifyPluginAsync<{
  copilotService: CopilotService;
}> = async (fastify, options) => {
  const { copilotService } = options;

  /**
   * Execução de Agente com Governança
   */
  fastify.post<{
    Body: {
      agentType: AgentType;
      autonomyLevel: AutonomyLevel;
      goal: string;
      model?: string;
      targetTool?: string;
      toolParams?: Record<string, unknown>;
      idempotencyKey?: string;
    };
  }>("/copilot/run", async (request, reply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();

    const { agentType, autonomyLevel, goal, model, targetTool, toolParams, idempotencyKey } = request.body;

    if (!agentType || !autonomyLevel || !goal) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "agentType, autonomyLevel e goal são obrigatórios" },
      });
    }

    try {
      const result = await copilotService.runAgent({
        tenantId: request.tenant.id,
        userId: request.user.id,
        agentType,
        autonomyLevel,
        goal,
        model,
        targetTool,
        toolParams,
        idempotencyKey,
      });

      return reply.status(200).send({ success: true, data: result });
    } catch (err) {
      return reply.status(400).send({
        success: false,
        error: { code: "EXECUTION_ERROR", message: (err as Error).message },
      });
    }
  });

  /**
   * Lista de Requisições de Aprovação Pendentes (A4)
   */
  fastify.get("/copilot/approvals", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const pending = copilotService.getPendingApprovals(request.tenant.id);
    return { success: true, data: pending };
  });

  /**
   * Resolver Requisição de Aprovação (Aprovar / Rejeitar)
   */
  fastify.post<{
    Params: { id: string };
    Body: { action: "approve" | "reject" };
  }>("/copilot/approvals/:id/resolve", async (request, reply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();

    const { action } = request.body;
    if (action !== "approve" && action !== "reject") {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "action deve ser 'approve' ou 'reject'" },
      });
    }

    try {
      const result = await copilotService.resolveApproval({
        approvalId: request.params.id,
        tenantId: request.tenant.id,
        action,
        userId: request.user.id,
      });

      return reply.status(200).send({ success: true, data: result });
    } catch (err) {
      if (err instanceof CrossTenantViolationError) {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: err.message } });
      }
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: (err as Error).message } });
    }
  });

  /**
   * FinOps / Ledger de Custos de IA do Tenant
   */
  fastify.get("/copilot/cost-ledger", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const ledger = copilotService.getCostLedger(request.tenant.id);
    return { success: true, data: ledger };
  });
};
