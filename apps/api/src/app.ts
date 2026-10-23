import Fastify from "fastify";
import cors from "@fastify/cors";
import type { ApiHealth } from "@birthub/contracts";
import { IdentityService } from "./modules/identity/identity.service.js";
import { identityRoutes } from "./modules/identity/identity.routes.js";

const START_TIME = Date.now();

export function createApp() {
  const app = Fastify({
    logger: true
  });

  const identityService = new IdentityService();

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

  // Rotas de API v1
  app.register(identityRoutes, { prefix: "/api/v1", identityService });

  return app;
}
