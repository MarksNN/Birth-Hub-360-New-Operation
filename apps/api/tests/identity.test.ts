import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("W02: Autenticação, Isolamento Multi-Tenant e RBAC", async (t) => {
  const app = createApp();

  await t.test("1. Autenticação bem-sucedida gera token e sessão com tenant", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "admin@alphacorp.com",
        password: "hash_alpha_secret"
      }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.success, true);
    assert.ok(body.data.token);
    assert.equal(body.data.tenant.id, "tenant-alpha-001");
    assert.equal(body.data.user.role, "admin");
  });

  await t.test("2. Tentativa de login com credenciais inválidas retorna 401", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "admin@alphacorp.com",
        password: "wrong_password"
      }
    });

    assert.equal(response.statusCode, 401);
    const body = response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "UNAUTHORIZED");
  });

  await t.test("3. Acesso a rota protegida sem token retorna 401 Fail-Closed", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/organizations/me"
    });

    assert.equal(response.statusCode, 401);
    const body = response.json();
    assert.equal(body.error.code, "AUTH_REQUIRED");
  });

  await t.test("4. Acesso cross-tenant adversarial é bloqueado com 403", async () => {
    // Login como usuário do Tenant Alpha
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "admin@alphacorp.com",
        password: "hash_alpha_secret"
      }
    });
    const token = loginRes.json().data.token;

    // Tentativa deliberada de consultar dados do Tenant Beta
    const attackRes = await app.inject({
      method: "GET",
      url: "/api/v1/tenants/tenant-beta-002/data",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(attackRes.statusCode, 403);
    const body = attackRes.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "CROSS_TENANT_VIOLATION");
  });

  await t.test("5. Usuário 'sales' sem privilégio é barrado ao convidar membro (RBAC)", async () => {
    // Login como vendedor
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "sales@alphacorp.com",
        password: "hash_alpha_secret"
      }
    });
    const token = loginRes.json().data.token;

    // Vendedor tenta criar usuário administrativo
    const forbiddenRes = await app.inject({
      method: "POST",
      url: "/api/v1/organizations/members",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(forbiddenRes.statusCode, 403);
    const body = forbiddenRes.json();
    assert.equal(body.error.code, "FORBIDDEN");
  });

  await t.test("6. Usuário 'admin' adiciona membro e ação é auditada", async () => {
    // Login como admin
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "admin@alphacorp.com",
        password: "hash_alpha_secret"
      }
    });
    const token = loginRes.json().data.token;

    // Admin adiciona novo membro
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/organizations/members",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        name: "Fernanda Analista",
        email: "fernanda@alphacorp.com",
        role: "analyst"
      }
    });

    assert.equal(createRes.statusCode, 201);
    const member = createRes.json().data;
    assert.equal(member.name, "Fernanda Analista");
    assert.equal(member.role, "analyst");

    // Verificar trilha de auditoria
    const auditRes = await app.inject({
      method: "GET",
      url: "/api/v1/audit/logs",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(auditRes.statusCode, 200);
    const logs = auditRes.json().data;
    assert.ok(logs.some((l: any) => l.action === "USER_MEMBER_CREATED" && l.resourceId === member.id));
  });

  await app.close();
});
