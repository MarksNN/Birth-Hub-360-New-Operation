import type { FastifyPluginAsync } from "fastify";
import type { BillingInvoiceItem } from "@birthub/contracts";
import type { RevOpsService } from "./revops.service.js";

export interface RevOpsRoutesOptions {
  revopsService: RevOpsService;
}

export const revopsRoutes: FastifyPluginAsync<RevOpsRoutesOptions> = async (
  fastify,
  options
) => {
  const { revopsService } = options;

  // Middleware de autenticação padrão é herdado do escopo

  // GET /api/v1/revops/plans - Catálogo de planos
  fastify.get("/plans", async () => {
    const plans = revopsService.getPlans();
    return {
      success: true,
      data: plans,
    };
  });

  // GET /api/v1/revops/subscription - Assinatura e cota de IA
  fastify.get("/subscription", async (request) => {
    const tenantId = request.tenant.id;
    const subscription = revopsService.getSubscription(tenantId);
    return {
      success: true,
      data: subscription,
    };
  });

  // GET /api/v1/revops/forecast - Previsão de receita com intervalos
  fastify.get<{
    Querystring: { period?: string };
  }>("/forecast", async (request) => {
    const tenantId = request.tenant.id;
    const period = request.query.period || "2026-Q4";
    const forecast = revopsService.calculateForecast(tenantId, period);
    return {
      success: true,
      data: forecast,
    };
  });

  // POST /api/v1/revops/invoices/generate - Emissão idempotente de faturas
  fastify.post<{
    Headers: { "idempotency-key"?: string };
    Body: {
      period: string;
      idempotencyKey?: string;
      items?: BillingInvoiceItem[];
    };
  }>("/invoices/generate", async (request, reply) => {
    const tenantId = request.tenant.id;
    const idempotencyKey =
      request.headers["idempotency-key"] || request.body?.idempotencyKey;

    if (!idempotencyKey) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "MISSING_IDEMPOTENCY_KEY",
          message: "Cabeçalho Idempotency-Key ou campo no body é obrigatório.",
        },
      });
    }

    const { period, items } = request.body || { period: "2026-10" };

    try {
      const result = revopsService.generateInvoice(
        tenantId,
        period,
        idempotencyKey,
        items
      );

      const statusCode = result.isDuplicateReplay ? 200 : 201;
      reply.header("X-Idempotent-Replay", result.isDuplicateReplay ? "true" : "false");

      return reply.code(statusCode).send({
        success: true,
        data: result.invoice,
        meta: {
          isDuplicateReplay: result.isDuplicateReplay,
        },
      });
    } catch (err: any) {
      if (err.name === "CrossTenantViolationError") {
        return reply.code(403).send({
          success: false,
          error: {
            code: "CROSS_TENANT_VIOLATION",
            message: err.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: "INVOICE_GENERATION_FAILED",
          message: err.message,
        },
      });
    }
  });

  // GET /api/v1/revops/invoices - Lista faturas do tenant
  fastify.get("/invoices", async (request) => {
    const tenantId = request.tenant.id;
    const invoices = revopsService.listInvoices(tenantId);
    return {
      success: true,
      data: invoices,
    };
  });

  // GET /api/v1/revops/ledger - Extrato financeiro
  fastify.get("/ledger", async (request) => {
    const tenantId = request.tenant.id;
    const ledger = revopsService.getLedger(tenantId);
    return {
      success: true,
      data: ledger,
    };
  });
};
