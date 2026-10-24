import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("W10: Confiabilidade Avançada, Disaster Recovery, SLOs e Testes de Carga", async (t) => {
  const app = createApp();
  await app.ready();

  let tokenAdminBeta: string = "";
  let tokenSalesAlpha: string = "";

  await t.test("1. Autenticação para testes de resiliência e RBAC", async () => {
    const resBeta = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@betasolutions.com", password: "hash_beta_secret" },
    });
    assert.equal(resBeta.statusCode, 200);
    tokenAdminBeta = resBeta.json().data.token;

    const resAlpha = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "sales@alphacorp.com", password: "hash_alpha_secret" },
    });
    assert.equal(resAlpha.statusCode, 200);
    tokenSalesAlpha = resAlpha.json().data.token;
  });

  await t.test("2. Deep Readiness Probe (/health/ready)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health/ready",
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.status, "ready");
    assert.equal(body.checks.database, true);
    assert.equal(body.checks.rlsEnforcement, true);
    assert.equal(body.checks.memoryHealthy, true);
  });

  await t.test("3. Monitoramento de SLOs e Error Budget (/health/slo)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health/slo",
    });
    assert.equal(res.statusCode, 200);
    const report = res.json().data;
    assert.ok(report.uptimePercent >= 99.9);
    assert.ok(report.latencyP95Ms < 150);
    assert.equal(report.slos.length, 3);
    assert.ok(report.slos.every((slo: any) => slo.status === "healthy"));
  });

  await t.test("4. GATE OBRIGATÓRIO: Simulado de Restore Drill (Disaster Recovery)", async () => {
    // 4.1 Usuário não-admin (sales) tenta disparar restore drill e é bloqueado (403)
    const resForbidden = await app.inject({
      method: "POST",
      url: "/api/v1/system/drills/restore",
      headers: { authorization: `Bearer ${tokenSalesAlpha}` },
    });
    assert.equal(resForbidden.statusCode, 403);
    assert.equal(resForbidden.json().error.code, "FORBIDDEN");

    // 4.2 Usuário admin dispara Restore Drill verificado
    const resDrill = await app.inject({
      method: "POST",
      url: "/api/v1/system/drills/restore",
      headers: { authorization: `Bearer ${tokenAdminBeta}` },
    });
    assert.equal(resDrill.statusCode, 201);
    const drill = resDrill.json().data;

    // Verificação estrita dos critérios de aceite
    assert.equal(drill.status, "verified_success");
    assert.ok(drill.backupSnapshotSha256.length === 64, "Checksum SHA256 válido do snapshot");
    assert.ok(drill.measuredRtoSeconds < 900, "RTO medido deve ser inferior a 15 minutos (900s)");
    assert.ok(drill.measuredRpoMinutes < 5, "RPO medido deve ser inferior a 5 minutos");
    assert.ok(drill.recordsVerified.tenants > 0);
    assert.ok(drill.recordsVerified.deals > 0);

    // 4.3 Consulta do último simulado
    const resLatest = await app.inject({
      method: "GET",
      url: "/api/v1/system/drills/latest",
      headers: { authorization: `Bearer ${tokenAdminBeta}` },
    });
    assert.equal(resLatest.statusCode, 200);
    assert.equal(resLatest.json().data.drillId, drill.drillId);
  });

  await t.test("5. Teste de Carga e Concorrência Multi-tenant sem Vazamentos", async () => {
    // Dispara 50 requisições concorrentes alternando entre tenants
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const isAlpha = i % 2 === 0;
      const token = isAlpha ? tokenSalesAlpha : tokenAdminBeta;
      const expectedTenant = isAlpha ? "tenant-alpha-001" : "tenant-beta-002";

      promises.push(
        app.inject({
          method: "GET",
          url: "/api/v1/crm/deals",
          headers: { authorization: `Bearer ${token}` },
        }).then((res) => {
          assert.equal(res.statusCode, 200);
          const deals = res.json().data;
          // Assegura que nenhum deal do outro tenant vazou na listagem sob concorrência
          assert.ok(
            deals.every((d: any) => d.tenantId === expectedTenant),
            `Vazamento detectado sob concorrência na iteração ${i}`
          );
        })
      );
    }

    await Promise.all(promises);
  });
});
