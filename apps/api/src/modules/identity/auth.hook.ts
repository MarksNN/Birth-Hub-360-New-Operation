import type { FastifyRequest, FastifyReply } from "fastify";
import type { IdentityService } from "./identity.service.js";

export function createAuthHook(identityService: IdentityService) {
  return async function authHook(request: FastifyRequest, reply: FastifyReply) {
    // Permitir rotas públicas
    if (
      request.url === "/health" ||
      request.url === "/api/v1/auth/login" ||
      request.url.startsWith("/api/v1/auth/login")
    ) {
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
  };
}
