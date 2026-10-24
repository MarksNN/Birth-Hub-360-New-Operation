import type { FastifyPluginAsync } from "fastify";
import type { ReliabilityService } from "./reliability.service.js";

export interface ReliabilityRoutesOptions {
  reliabilityService: ReliabilityService;
}

export const reliabilityRoutes: FastifyPluginAsync<ReliabilityRoutesOptions> = async (
  fastify,
  options
) => {
  const { reliabilityService } = options;

  // GET /ready - Deep Readiness Probe
  fastify.get("/ready", async () => {
    return reliabilityService.checkReadiness();
  });

  // GET /slo - Relatório de SLOs e consumo de error budget
  fastify.get("/slo", async () => {
    return {
      success: true,
      data: reliabilityService.getSloReport(),
    };
  });

  // POST /api/v1/system/drills/restore - Executar e aferir Restore Drill (Disaster Recovery)
  fastify.post("/system/drills/restore", async (request, reply) => {
    const userRole = request.user?.role;
    // Somente admin ou owner podem disparar restore drills
    if (userRole && userRole !== "admin" && userRole !== "owner") {
      return reply.code(403).send({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Apenas administradores podem disparar simulações de Disaster Recovery.",
        },
      });
    }

    const result = reliabilityService.executeRestoreDrill();
    return reply.code(201).send({
      success: true,
      data: result,
    });
  });

  // GET /api/v1/system/drills/latest - Obter resultado do último simulado de restore
  fastify.get("/system/drills/latest", async () => {
    const result = reliabilityService.getLatestRestoreDrill();
    return {
      success: true,
      data: result,
    };
  });
};
