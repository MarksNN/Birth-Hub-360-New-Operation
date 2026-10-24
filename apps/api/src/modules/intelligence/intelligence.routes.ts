import type { FastifyPluginAsync } from "fastify";
import type { SignalSeverity, SignalType } from "@birthub/contracts";
import type { IntelligenceService } from "./intelligence.service.js";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export const intelligenceRoutes: FastifyPluginAsync<{
  intelligenceService: IntelligenceService;
}> = async (fastify, options) => {
  const { intelligenceService } = options;

  /**
   * Resumo Executivo do Radar
   */
  fastify.get("/intelligence/radar", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const summary = intelligenceService.getRadarSummary(request.tenant.id);
    return { success: true, data: summary };
  });

  /**
   * Listar Sinais de Risco / Alertas
   */
  fastify.get<{
    Querystring: {
      type?: SignalType;
      severity?: SignalSeverity;
    };
  }>("/intelligence/signals", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const signals = intelligenceService.listSignals(request.tenant.id, {
      type: request.query.type,
      severity: request.query.severity,
    });
    return { success: true, data: signals };
  });

  /**
   * Dispensar Sinal com Auditoria
   */
  fastify.post<{
    Params: { id: string };
  }>("/intelligence/signals/:id/dismiss", async (request, reply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();

    try {
      const dismissed = intelligenceService.dismissSignal(
        request.tenant.id,
        request.params.id,
        request.user.id
      );
      return { success: true, data: dismissed };
    } catch (err) {
      if (err instanceof CrossTenantViolationError) {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: err.message } });
      }
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: (err as Error).message } });
    }
  });

  /**
   * Pontuação Explicável de ICP Fit de uma Empresa
   */
  fastify.get<{
    Params: { id: string };
  }>("/intelligence/scores/company/:id", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();

    try {
      const score = intelligenceService.getCompanyScore(request.tenant.id, request.params.id);
      return { success: true, data: score };
    } catch (err) {
      if (err instanceof CrossTenantViolationError) {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: err.message } });
      }
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: (err as Error).message } });
    }
  });

  /**
   * Relatório de Qualidade de Dados
   */
  fastify.get("/intelligence/data-quality", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const quality = intelligenceService.getDataQualityReport(request.tenant.id);
    return { success: true, data: quality };
  });
};
