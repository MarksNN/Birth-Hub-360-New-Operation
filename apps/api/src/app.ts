import Fastify from "fastify";
import cors from "@fastify/cors";

export function createApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173"
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "birthub-full-operation"
  }));

  return app;
}