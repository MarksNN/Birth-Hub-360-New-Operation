import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("W09: RevOps, Previsão de Receita, Cotas de IA e Faturamento Idempotente", async (t) => {
  const app = createApp();
  await app.ready();

  let tokenAlpha: string = "";
  let tokenBeta: string = "";

  await t.test("1. Autenticação e tokens multi-tenant", async () => {
    const resAlpha = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "sales@alphacorp.com", password: "hash_alpha_secret" },
    });
    assert.equal(resAlpha.statusCode, 200);
    tokenAlpha = resAlpha.json().data.token;

    const resBeta = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@betasolutions.com", password: "hash_beta_secret" },
    });
    assert.equal(resBeta.statusCode, 200);
    tokenBeta = resBeta.json().data.token;
  });

  await t.test("2. Catálogo de planos de assinatura e consulta de cota", async () => {
    const resPlans = await app.inject({
      method: "GET",
      url: "/api/v1/revops/plans",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resPlans.statusCode, 200);
    const plans = resPlans.json().data;
    assert.equal(plans.length, 3);
    assert.ok(plans.some((p: any) => p.slug === "growth"));

    const resSub = await app.inject({
      method: "GET",
      url: "/api/v1/revops/subscription",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resSub.statusCode, 200);
    const sub = resSub.json().data;
    assert.equal(sub.planSlug, "growth");
    assert.equal(sub.aiCreditsLimitBrl, 250.0);
    assert.ok(sub.aiCreditsBalanceBrl > 0);
  });

  await t.test("3. Previsão de receita (Forecasting) com cálculo reconciliado", async () => {
    // 3.1 Cria negócios em estágios variados no CRM para Alpha
    await app.inject({
      method: "POST",
      url: "/api/v1/crm/deals",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        title: "Deal Negociação Alpha R$ 100k",
        stage: "negotiation",
        value: 100000,
        currency: "BRL",
      },
    });

    await app.inject({
      method: "POST",
      url: "/api/v1/crm/deals",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        title: "Deal Proposta Alpha R$ 50k",
        stage: "proposal_sent",
        value: 50000,
        currency: "BRL",
      },
    });

    const resForecast = await app.inject({
      method: "GET",
      url: "/api/v1/revops/forecast?period=2026-Q4",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resForecast.statusCode, 200);
    const forecast = resForecast.json().data;

    assert.ok(forecast.pipelineTotal >= 150000);
    assert.ok(forecast.commitValue > 0);
    assert.ok(forecast.bestCaseValue >= forecast.commitValue);
    assert.ok(forecast.confidenceInterval.low <= forecast.confidenceInterval.mid);
    assert.ok(forecast.confidenceInterval.mid <= forecast.confidenceInterval.high);
    assert.equal(typeof forecast.breakdownByStage.negotiation, "number");
  });

  let generatedInvoiceId: string = "";

  await t.test("4. GATE OBRIGATÓRIO: Faturamento Idempotente (Replay Seguro)", async () => {
    const idempotencyKey = "key-idem-alpha-202610-001";

    // 4.1 Primeira emissão da fatura (deve criar - 201 Created)
    const resCreate = await app.inject({
      method: "POST",
      url: "/api/v1/revops/invoices/generate",
      headers: {
        authorization: `Bearer ${tokenAlpha}`,
        "idempotency-key": idempotencyKey,
      },
      payload: {
        period: "2026-10",
      },
    });

    assert.equal(resCreate.statusCode, 201);
    const invoice1 = resCreate.json().data;
    assert.ok(invoice1.id);
    assert.equal(invoice1.period, "2026-10");
    assert.equal(invoice1.status, "open");
    assert.equal(resCreate.headers["x-idempotent-replay"], "false");
    generatedInvoiceId = invoice1.id;

    // 4.2 Replay da emissão com a MESMA chave de idempotência (deve retornar 200 OK sem duplicar)
    const resReplay = await app.inject({
      method: "POST",
      url: "/api/v1/revops/invoices/generate",
      headers: {
        authorization: `Bearer ${tokenAlpha}`,
        "idempotency-key": idempotencyKey,
      },
      payload: {
        period: "2026-10",
      },
    });

    assert.equal(resReplay.statusCode, 200);
    const invoice2 = resReplay.json().data;
    assert.equal(invoice2.id, generatedInvoiceId);
    assert.equal(resReplay.headers["x-idempotent-replay"], "true");
    assert.equal(resReplay.json().meta.isDuplicateReplay, true);

    // 4.3 Listagem de faturas confirma exatamente 1 fatura
    const resList = await app.inject({
      method: "GET",
      url: "/api/v1/revops/invoices",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resList.statusCode, 200);
    const list = resList.json().data;
    const matchingInvoices = list.filter((i: any) => i.period === "2026-10");
    assert.equal(matchingInvoices.length, 1);
  });

  await t.test("5. Isolamento Multi-tenant rigoroso em Faturas e Ledger", async () => {
    // 5.1 Beta não enxerga faturas da Alpha
    const resBetaInvoices = await app.inject({
      method: "GET",
      url: "/api/v1/revops/invoices",
      headers: { authorization: `Bearer ${tokenBeta}` },
    });
    assert.equal(resBetaInvoices.statusCode, 200);
    const betaInvoices = resBetaInvoices.json().data;
    assert.ok(!betaInvoices.some((i: any) => i.id === generatedInvoiceId));

    // 5.2 Tentativa de usar a mesma chave de idempotência de outro tenant é bloqueada
    const resForbiddenReplay = await app.inject({
      method: "POST",
      url: "/api/v1/revops/invoices/generate",
      headers: {
        authorization: `Bearer ${tokenBeta}`,
        "idempotency-key": "key-idem-alpha-202610-001",
      },
      payload: {
        period: "2026-10",
      },
    });
    assert.equal(resForbiddenReplay.statusCode, 403);
    assert.equal(resForbiddenReplay.json().error.code, "CROSS_TENANT_VIOLATION");
  });

  await t.test("6. Extrato financeiro (Ledger)", async () => {
    const resLedger = await app.inject({
      method: "GET",
      url: "/api/v1/revops/ledger",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resLedger.statusCode, 200);
    const ledger = resLedger.json().data;
    assert.ok(ledger.length > 0);
    assert.ok(ledger.some((entry: any) => entry.category === "platform_subscription"));
  });
});
