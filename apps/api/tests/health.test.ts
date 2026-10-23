import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("GET /health responde com contrato ApiHealth completo", async () => {
  const app = createApp();
  try {
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.status, "ok");
    assert.equal(body.service, "birthub-full-operation-api");
    assert.equal(body.version, "0.1.0");
    assert.equal(typeof body.uptimeSeconds, "number");
    assert.ok(body.timestamp);
  } finally {
    await app.close();
  }
});
