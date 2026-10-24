import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("W05: Hub de Integrações, Bitrix24, Outbox, Cursors e Idempotência", async (t) => {
  const app = createApp();
  await app.ready();

  let tokenAlpha: string = "";
  let tokenBeta: string = "";

  await t.test("1. Autenticação e obtenção de tokens para os tenants", async () => {
    const resAlpha = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "sales@alphacorp.com", password: "hash_alpha_secret" },
    });
    assert.equal(resAlpha.statusCode, 200);
    tokenAlpha = resAlpha.json().data.token;
    assert.ok(tokenAlpha);

    const resBeta = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@betasolutions.com", password: "hash_beta_secret" },
    });
    assert.equal(resBeta.statusCode, 200);
    tokenBeta = resBeta.json().data.token;
    assert.ok(tokenBeta);
  });

  await t.test("2. Consultar status da integração Bitrix24 e conectar", async () => {
    const resStatus = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/status",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resStatus.statusCode, 200);
    const body = resStatus.json();
    assert.equal(body.data.bitrix24.status, "active");

    const resConnect = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/bitrix24/connect",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        domain: "alpha-corp.bitrix24.com",
        webhookSecret: "secret_webhook_tok_12345",
      },
    });
    assert.equal(resConnect.statusCode, 201);
    assert.equal(resConnect.json().data.provider, "bitrix24");
  });

  await t.test("3. Webhook com token inválido retorna 401 (Fail-Closed)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/webhooks/bitrix24",
      headers: {
        authorization: `Bearer ${tokenAlpha}`,
        "x-bitrix-token": "token_fraudulento_incorreto",
      },
      payload: {
        event: "ONCRMDEALADD",
        data: { FIELDS: { ID: "9901", TITLE: "Deal Fake", OPPORTUNITY: "1000" } },
      },
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error.code, "INVALID_WEBHOOK_TOKEN");
  });

  let createdDealId: string = "";

  await t.test("4. Ingestão de Webhook válido cria Deal com proveniência e gera Outbox Event", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/webhooks/bitrix24",
      headers: {
        authorization: `Bearer ${tokenAlpha}`,
        "x-bitrix-token": "secret_webhook_tok_12345",
        "x-idempotency-key": "webhook_evt_deal_777",
      },
      payload: {
        event: "ONCRMDEALADD",
        data: {
          FIELDS: {
            ID: "777",
            TITLE: "Projeto Integração Solar Bitrix",
            STAGE_ID: "PREPARATION",
            OPPORTUNITY: "150000",
            CURRENCY_ID: "BRL",
          },
        },
      },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.data.status, "processed");
    assert.ok(body.data.entityId);
    createdDealId = body.data.entityId;

    // Verificar se o Deal foi realmente criado no CRM
    const resDeal = await app.inject({
      method: "GET",
      url: `/api/v1/crm/deals/${createdDealId}`,
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resDeal.statusCode, 200);
    const deal = resDeal.json().data;
    assert.equal(deal.title, "Projeto Integração Solar Bitrix");
    assert.equal(deal.value, 150000);
    assert.equal(deal.source, "bitrix24");
    assert.equal(deal.externalId, "777");

    // Verificar Outbox Event gerado
    const resOutbox = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/outbox",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resOutbox.statusCode, 200);
    const events = resOutbox.json().data;
    assert.ok(events.length > 0);
    assert.ok(events.some((e: any) => e.idempotencyKey === "webhook_evt_deal_777"));
  });

  await t.test("5. GATE OBRIGATÓRIO: Replay do mesmo Webhook não duplica registros nem outbox (Idempotência)", async () => {
    const resReplay = await app.inject({
      method: "POST",
      url: "/api/v1/webhooks/bitrix24",
      headers: {
        authorization: `Bearer ${tokenAlpha}`,
        "x-bitrix-token": "secret_webhook_tok_12345",
        "x-idempotency-key": "webhook_evt_deal_777", // Mesma chave!
      },
      payload: {
        event: "ONCRMDEALADD",
        data: {
          FIELDS: {
            ID: "777",
            TITLE: "Projeto Integração Solar Bitrix",
            STAGE_ID: "PREPARATION",
            OPPORTUNITY: "150000",
            CURRENCY_ID: "BRL",
          },
        },
      },
    });

    assert.equal(resReplay.statusCode, 200);
    const replayBody = resReplay.json();
    assert.equal(replayBody.data.status, "ignored_replay");

    // Verificar que ainda existe apenas 1 Deal com esse ID no CRM
    const resDeals = await app.inject({
      method: "GET",
      url: "/api/v1/crm/deals",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resDeals.statusCode, 200);
    const deals = resDeals.json().data.filter((d: any) => d.externalId === "777");
    assert.equal(deals.length, 1, "GATE DE ACEITE FALHOU: Houve duplicação em replay!");
  });

  await t.test("6. Sincronização Incremental em lote com atualização de cursor", async () => {
    const resSync = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/bitrix24/sync",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        items: [
          {
            ID: "1001",
            TITLE: "Migração Cloud Enterprise",
            STAGE_ID: "NEW",
            OPPORTUNITY: "85000",
            CURRENCY_ID: "BRL",
            ASSIGNED_BY_ID: "1",
            DATE_CREATE: "2026-10-24T10:00:00Z",
            DATE_MODIFY: "2026-10-24T10:00:00Z",
          },
          {
            ID: "1002",
            TITLE: "Consultoria DevSecOps Anual",
            STAGE_ID: "PROPOSAL",
            OPPORTUNITY: "120000",
            CURRENCY_ID: "BRL",
            ASSIGNED_BY_ID: "1",
            DATE_CREATE: "2026-10-24T11:00:00Z",
            DATE_MODIFY: "2026-10-24T11:00:00Z",
          },
        ],
      },
    });

    assert.equal(resSync.statusCode, 200);
    const syncData = resSync.json().data;
    assert.equal(syncData.processed, 2);
    assert.equal(syncData.cursor, "1002");
    assert.equal(syncData.status, "completed");
  });

  await t.test("7. Detecção e Resolução de Conflitos de Concorrência", async () => {
    // Simulamos um webhook que tenta alterar o Deal 777 com valor divergente
    const resConflictWebhook = await app.inject({
      method: "POST",
      url: "/api/v1/webhooks/bitrix24",
      headers: {
        authorization: `Bearer ${tokenAlpha}`,
        "x-bitrix-token": "secret_webhook_tok_12345",
        "x-idempotency-key": "webhook_conflict_check_777_v2",
      },
      payload: {
        event: "ONCRMDEALUPDATE",
        data: {
          FIELDS: {
            ID: "777",
            TITLE: "Projeto Solar - Valor Rebaixado",
            STAGE_ID: "PREPARATION",
            OPPORTUNITY: "90000", // Diverge de 150000
            CURRENCY_ID: "BRL",
          },
        },
      },
    });
    assert.equal(resConflictWebhook.statusCode, 200);

    // Listar conflitos pendentes
    const resConflicts = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/conflicts",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resConflicts.statusCode, 200);
    const conflicts = resConflicts.json().data;
    assert.ok(conflicts.length > 0, "Deveria ter registrado conflito de valor e título");

    const targetConflict = conflicts[0];
    assert.equal(targetConflict.resolution, "pending");

    // Resolver conflito
    const resResolve = await app.inject({
      method: "POST",
      url: `/api/v1/integrations/conflicts/${targetConflict.id}/resolve`,
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: { resolution: "keep_local" },
    });
    assert.equal(resResolve.statusCode, 200);
    const resolved = resResolve.json().data;
    assert.equal(resolved.resolution, "keep_local");
    assert.ok(resolved.resolvedAt);
  });

  await t.test("8. Tentativa Adversarial Cross-Tenant é bloqueada", async () => {
    // Tenant Beta tenta consultar status e outbox do Tenant Alpha
    const resCrossStatus = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/status",
      headers: { authorization: `Bearer ${tokenBeta}` },
    });
    assert.equal(resCrossStatus.statusCode, 200);
    // Para o Tenant Beta, a integração deve estar desconectada!
    assert.equal(resCrossStatus.json().data.bitrix24.status, "disconnected");

    // Tenant Beta tenta resolver conflito do Tenant Alpha
    const resCrossConflict = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/conflicts/conflict_inexistente_beta/resolve",
      headers: { authorization: `Bearer ${tokenBeta}` },
      payload: { resolution: "keep_local" },
    });
    assert.equal(resCrossConflict.statusCode, 404);
  });

  await app.close();
});
