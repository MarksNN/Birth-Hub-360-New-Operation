import Fastify from "fastify";
import cors from "@fastify/cors";
import type { ApiHealth } from "@birthub/contracts";
import { IdentityService } from "./modules/identity/identity.service.js";
import { identityRoutes } from "./modules/identity/identity.routes.js";
import { createAuthHook } from "./modules/identity/auth.hook.js";
import { CrmService } from "./modules/crm/crm.service.js";
import { crmRoutes } from "./modules/crm/crm.routes.js";

const START_TIME = Date.now();

export function createApp() {
  const app = Fastify({
    logger: true
  });

  const identityService = new IdentityService();
  const crmService = new CrmService();

  app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true
  });

  app.get("/health", async (): Promise<ApiHealth> => {
    return {
      status: "ok",
      service: "birthub-full-operation-api",
      version: "0.1.0",
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      environment: process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString()
    };
  });

  // Todas as rotas de API v1 compartilham o hook de autenticação fail-closed
  app.register(
    async (api) => {
      api.addHook("preHandler", createAuthHook(identityService));
      api.register(identityRoutes, { identityService });
      api.register(crmRoutes, { crmService });
    },
    { prefix: "/api/v1" }
  );

  return app;
}
