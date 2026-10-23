import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("GET /health responde com sucesso", async () => {
  const app = createApp();
  try {
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().status, "ok");
  } finally {
    await app.close();
  }
});