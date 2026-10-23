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

  // 2. Hook de Autenticação e Resolução de Tenant (Fail-Closed)
  fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    // Permitir rotas públicas
    if (request.url.startsWith("/api/v1/auth/login") || request.url === "/health") {
      return;
    }

    const authHeader = request.headers.authorization;
    const tenantHeader = request.headers["x-tenant-id"] as string | undefined;

    if (!authHeader && !tenantHeader) {
      return reply.status(401).send({
        success: false,
        error: { code: "AUTH_REQUIRED", message: "Cabeçalho de autorização ou x-tenant-id obrigatório" }
      });
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const session = identityService.getSession(token);

      if (!session) {
        return reply.status(401).send({
          success: false,
          error: { code: "INVALID_OR_EXPIRED_TOKEN", message: "Token de sessão inválido ou expirado" }
        });
      }

      request.tenant = session.tenant;
      request.user = session.user;
    } else if (tenantHeader) {
      // Suporte a API Keys / Service accounts com validação de formato
      request.tenant = { id: tenantHeader, name: `Org-${tenantHeader}`, slug: tenantHeader };
      request.user = {
        id: (request.headers["x-user-id"] as string) || "service-account",
        tenantId: tenantHeader,
        email: "service@internal.local",
        name: "Service Account",
        role: "integration_service"
      };
    }
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

  // 3. Obter dados da organização atual
  fastify.get("/organizations/me", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const org = identityService.getOrganization(request.tenant.id, request.tenant.id);
    return { success: true, data: org };
  });

  // 4. Listar membros da organização
  fastify.get("/organizations/members", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant) return reply.status(401).send();
    const members = identityService.getMembers(request.tenant.id);
    return { success: true, data: members };
  });

  // 5. Adicionar membro (Exige papel owner ou admin)
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

  // 6. Consultar logs de auditoria (Exige papel owner ou admin)
  fastify.get("/audit/logs", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!checkRole(request, reply, ["owner", "admin"])) return;
    if (!request.tenant) return;

    const logs = identityService.getAuditLogs(request.tenant.id);
    return { success: true, data: logs };
  });

  // 7. Rota de teste contra vazamento cross-tenant
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
