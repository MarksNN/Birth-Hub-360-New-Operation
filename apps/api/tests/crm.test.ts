import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("W04: CRM Operacional — Ciclo Completo E2E e Isolamento", async (t) => {
  const app = createApp();

  try {
    // Obter token válido para o Tenant Alpha
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "sales@alphacorp.com",
        password: "hash_alpha_secret"
      }
    });
    const token = loginRes.json().data.token;
    const authHeaders = { authorization: `Bearer ${token}` };

    let createdCompanyId: string = "";
    let createdContactId: string = "";
    let createdDealId: string = "";
    let createdTaskId: string = "";

    await t.test("1. Criar Empresa (Company)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/crm/companies",
        headers: authHeaders,
        payload: {
          name: "InovaTech Soluções Cloud",
          domain: "inovatech.io",
          industry: "Tecnologia",
          employeeCount: 120
        }
      });

      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.id);
      assert.equal(body.data.name, "InovaTech Soluções Cloud");
      createdCompanyId = body.data.id;
    });

    await t.test("2. Criar Contato (Contact) associado à Empresa", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/crm/contacts",
        headers: authHeaders,
        payload: {
          companyId: createdCompanyId,
          name: "Mariana Alencar",
          email: "mariana@inovatech.io",
          phone: "+55 11 99999-8888",
          title: "Head de Infraestrutura"
        }
      });

      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.name, "Mariana Alencar");
      assert.equal(body.data.companyId, createdCompanyId);
      createdContactId = body.data.id;
    });

    await t.test("3. Criar Oportunidade (Deal) em estágio inicial", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/crm/deals",
        headers: authHeaders,
        payload: {
          companyId: createdCompanyId,
          contactId: createdContactId,
          title: "Migração Cloud & Observabilidade 360",
          value: 85000,
          stage: "lead"
        }
      });

      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.stage, "lead");
      assert.equal(body.data.value, 85000);
      createdDealId = body.data.id;
    });

    await t.test("4. Agendar Atividade/Tarefa (Task) na Oportunidade", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/crm/tasks",
        headers: authHeaders,
        payload: {
          dealId: createdDealId,
          title: "Reunião de Diagnóstico de Arquitetura",
          priority: "high",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, "pending");
      createdTaskId = body.data.id;
    });

    await t.test("5. Concluir Tarefa e avançar Oportunidade até Fechamento Ganho (Closed Won)", async () => {
      // 5.1 Concluir tarefa
      const taskRes = await app.inject({
        method: "PATCH",
        url: `/api/v1/crm/tasks/${createdTaskId}/complete`,
        headers: authHeaders
      });
      assert.equal(taskRes.statusCode, 200);
      assert.equal(taskRes.json().data.status, "completed");

      // 5.2 Avançar para proposal_sent
      const stageRes1 = await app.inject({
        method: "PATCH",
        url: `/api/v1/crm/deals/${createdDealId}/stage`,
        headers: authHeaders,
        payload: { stage: "proposal_sent" }
      });
      assert.equal(stageRes1.statusCode, 200);
      assert.equal(stageRes1.json().data.stage, "proposal_sent");

      // 5.3 Fechar como ganho (closed_won)
      const stageRes2 = await app.inject({
        method: "PATCH",
        url: `/api/v1/crm/deals/${createdDealId}/stage`,
        headers: authHeaders,
        payload: { stage: "closed_won" }
      });
      assert.equal(stageRes2.statusCode, 200);
      assert.equal(stageRes2.json().data.stage, "closed_won");
    });

    await t.test("6. Consulta do Funil de Vendas (Pipeline Summary)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/crm/pipeline",
        headers: authHeaders
      });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.stages.length >= 7);
      const closedWonStage = body.data.stages.find((s: any) => s.stage === "closed_won");
      assert.ok(closedWonStage);
      assert.ok(closedWonStage.count >= 1);
      assert.ok(closedWonStage.totalValue >= 85000);
    });

    await t.test("7. Tentativa Adversarial Cross-Tenant contra Oportunidade é bloqueada com 403", async () => {
      // Login como usuário do Tenant Beta
      const betaLoginRes = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "admin@betasolutions.com",
          password: "hash_beta_secret"
        }
      });
      const betaToken = betaLoginRes.json().data.token;

      // Usuário do Tenant Beta tenta acessar oportunidade do Tenant Alpha
      const attackRes = await app.inject({
        method: "GET",
        url: `/api/v1/crm/deals/${createdDealId}`,
        headers: {
          authorization: `Bearer ${betaToken}`
        }
      });

      assert.equal(attackRes.statusCode, 403);
      assert.equal(attackRes.json().error.code, "CROSS_TENANT_VIOLATION");
    });
  } finally {
    await app.close();
  }
});
