import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import type { UserRole } from "@birthub/contracts";
import { IdentityService, CrossTenantViolationError } from "./identity.service.js";
import type { TenantContext, UserContext } from "./types.js";

declare module "fastify" {
  interface FastifyRequest {
    tenant?: TenantContext;
    user?: UserContext;
  }
}

export const identityRoutes: FastifyPluginAsync<{ identityService: IdentityService }> = async (
  fastify,
  opts
) => {
  const { identityService } = opts;

  // 1. Rota Pública de Autenticação (Login)
  fastify.post("/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email?: string; password?: string };

    if (!body?.email || !body?.password) {
      return reply.status(400).send({
        success: false,
        error: { code: "INVALID_CREDENTIALS_PAYLOAD", message: "E-mail e senha são obrigatórios" }
      });
    }

    const session = identityService.authenticate(body.email, body.password);
    if (!session) {
      return reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Credenciais inválidas ou usuário inativo" }
      });
    }

    return reply.status(200).send({
      success: true,
      data: session
    });
  });

  // Função utilitária de autorização RBAC
  function checkRole(request: FastifyRequest, reply: FastifyReply, allowedRoles: UserRole[]) {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      reply.status(403).send({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Permissão insuficiente. Papel '${request.user?.role}' não autorizado para esta operação.`
        }
      });
      return false;
    }
    return true;
  }

  // 2. Obter dados da organização atual
  fastify.get("/organizations/me", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const org = identityService.getOrganization(request.tenant.id, request.tenant.id);
    return { success: true, data: org };
  });

  // 3. Listar membros da organização
  fastify.get("/organizations/members", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const members = identityService.getMembers(request.tenant.id);
    return { success: true, data: members };
  });

  // 4. Adicionar membro (Exige papel owner ou admin)
  fastify.post("/organizations/members", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!checkRole(request, reply, ["owner", "admin"])) return;
    if (!request.tenant || !request.user) return;

    const body = request.body as { name?: string; email?: string; role?: UserRole };
    if (!body?.name || !body?.email || !body?.role) {
      return reply.status(400).send({
        success: false,
        error: { code: "INVALID_MEMBER_DATA", message: "Nome, e-mail e papel são obrigatórios." }
      });
    }

    const newMember = identityService.addMember(request.tenant.id, request.user.id, {
      name: body.name,
      email: body.email,
      role: body.role
    });

    return reply.status(201).send({ success: true, data: newMember });
  });

  // 5. Consultar logs de auditoria (Exige papel owner ou admin)
  fastify.get("/audit/logs", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!checkRole(request, reply, ["owner", "admin"])) return;
    if (!request.tenant) return;

    const logs = identityService.getAuditLogs(request.tenant.id);
    return { success: true, data: logs };
  });

  // 6. Rota de teste contra vazamento cross-tenant
  fastify.get<{ Params: { targetTenantId: string } }>(
    "/tenants/:targetTenantId/data",
    async (request, reply) => {
      const { targetTenantId } = request.params;
      if (!request.tenant) return reply.status(401).send();

      try {
        const org = identityService.getOrganization(targetTenantId, request.tenant.id);
        return { success: true, data: org };
      } catch (err) {
        if (err instanceof CrossTenantViolationError) {
          return reply.status(403).send({
            success: false,
            error: { code: "CROSS_TENANT_VIOLATION", message: err.message }
          });
        }
        return reply.status(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Recurso não encontrado" }
        });
      }
    }
  );
};
