import Fastify from "fastify";
import cors from "@fastify/cors";
import type { ApiHealth } from "@birthub/contracts";

const START_TIME = Date.now();

export function createApp() {
  const app = Fastify({
    logger: true
  });

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

  return app;
}
