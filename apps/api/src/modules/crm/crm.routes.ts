import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import type { DealStage, TaskPriority } from "@birthub/contracts";
import { CrmService } from "./crm.service.js";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export const crmRoutes: FastifyPluginAsync<{ crmService: CrmService }> = async (
  fastify,
  opts
) => {
  const { crmService } = opts;

  // Interceptador de erro cross-tenant
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof CrossTenantViolationError) {
      return reply.status(403).send({
        success: false,
        error: { code: "CROSS_TENANT_VIOLATION", message: error.message }
      });
    }
    const err = error as Error;
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message }
    });
  });

  // ==========================================
  // Empresas (Companies)
  // ==========================================

  fastify.get("/crm/companies", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const companies = crmService.listCompanies(request.tenant.id);
    return { success: true, data: companies };
  });

  fastify.post("/crm/companies", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const body = request.body as { name?: string; domain?: string; industry?: string; employeeCount?: number };

    if (!body?.name) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Nome da empresa é obrigatório" }
      });
    }

    const company = crmService.createCompany(request.tenant.id, {
      name: body.name,
      domain: body.domain,
      industry: body.industry,
      employeeCount: body.employeeCount
    });
    return reply.status(201).send({ success: true, data: company });
  });

  // ==========================================
  // Contatos (Contacts)
  // ==========================================

  fastify.get("/crm/contacts", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const query = request.query as { companyId?: string };
    const contacts = crmService.listContacts(request.tenant.id, query.companyId);
    return { success: true, data: contacts };
  });

  fastify.post("/crm/contacts", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const body = request.body as { companyId?: string; name?: string; email?: string; phone?: string; title?: string };

    if (!body?.name) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Nome do contato é obrigatório" }
      });
    }

    try {
      const contact = crmService.createContact(request.tenant.id, {
        name: body.name,
        companyId: body.companyId,
        email: body.email,
        phone: body.phone,
        title: body.title
      });
      return reply.status(201).send({ success: true, data: contact });
    } catch (err) {
      if (err instanceof CrossTenantViolationError) throw err;
      return reply.status(400).send({ success: false, error: { code: "BAD_REQUEST", message: (err as Error).message } });
    }
  });

  // ==========================================
  // Oportunidades (Deals)
  // ==========================================

  fastify.get("/crm/deals", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const query = request.query as { stage?: DealStage };
    const deals = crmService.listDeals(request.tenant.id, query.stage);
    return { success: true, data: deals };
  });

  fastify.post("/crm/deals", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();
    const body = request.body as {
      title?: string;
      value?: number;
      companyId?: string;
      contactId?: string;
      stage?: DealStage;
      currency?: string;
    };

    if (!body?.title || body.value === undefined) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Título e valor da oportunidade são obrigatórios" }
      });
    }

    try {
      const deal = crmService.createDeal(request.tenant.id, request.user.id, {
        title: body.title,
        value: body.value,
        companyId: body.companyId,
        contactId: body.contactId,
        stage: body.stage,
        currency: body.currency
      });
      return reply.status(201).send({ success: true, data: deal });
    } catch (err) {
      if (err instanceof CrossTenantViolationError) throw err;
      return reply.status(400).send({ success: false, error: { code: "BAD_REQUEST", message: (err as Error).message } });
    }
  });

  fastify.get<{ Params: { id: string } }>("/crm/deals/:id", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    try {
      const deal = crmService.getDeal(request.tenant.id, request.params.id);
      return { success: true, data: deal };
    } catch (err) {
      if (err instanceof CrossTenantViolationError) throw err;
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Oportunidade não encontrada" } });
    }
  });

  fastify.patch<{ Params: { id: string } }>("/crm/deals/:id/stage", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    const body = request.body as { stage?: DealStage };

    if (!body?.stage) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Novo estágio é obrigatório" }
      });
    }

    try {
      const updatedDeal = crmService.updateDealStage(request.tenant.id, request.params.id, body.stage);
      return { success: true, data: updatedDeal };
    } catch (err) {
      if (err instanceof CrossTenantViolationError) throw err;
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Oportunidade não encontrada" } });
    }
  });

  // ==========================================
  // Atividades & Tarefas (Tasks)
  // ==========================================

  fastify.get("/crm/tasks", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const query = request.query as { dealId?: string };
    const tasks = crmService.listTasks(request.tenant.id, query.dealId);
    return { success: true, data: tasks };
  });

  fastify.post("/crm/tasks", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant || !request.user) return reply.status(401).send();
    const body = request.body as {
      dealId?: string;
      title?: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: string;
      source?: "manual" | "ai_recommendation" | "sync_bitrix24";
    };

    if (!body?.title) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Título da tarefa é obrigatório" }
      });
    }

    try {
      const task = crmService.createTask(request.tenant.id, request.user.id, {
        title: body.title,
        dealId: body.dealId,
        description: body.description,
        priority: body.priority,
        dueDate: body.dueDate,
        source: body.source
      });
      return reply.status(201).send({ success: true, data: task });
    } catch (err) {
      if (err instanceof CrossTenantViolationError) throw err;
      return reply.status(400).send({ success: false, error: { code: "BAD_REQUEST", message: (err as Error).message } });
    }
  });

  fastify.patch<{ Params: { id: string } }>("/crm/tasks/:id/complete", async (request, reply) => {
    if (!request.tenant) return reply.status(401).send();
    try {
      const completedTask = crmService.completeTask(request.tenant.id, request.params.id);
      return { success: true, data: completedTask };
    } catch (err) {
      if (err instanceof CrossTenantViolationError) throw err;
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Tarefa não encontrada" } });
    }
  });

  // ==========================================
  // Funil e Resumo de Pipeline
  // ==========================================

  fastify.get("/crm/pipeline", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const pipeline = crmService.getPipelineSummary(request.tenant.id);
    return { success: true, data: pipeline };
  });
};
