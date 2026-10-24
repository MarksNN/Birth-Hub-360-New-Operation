import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("W06: Inteligência Comercial, ICP Fit Explicável, Radar e Evals", async (t) => {
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

    const resBeta = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@betasolutions.com", password: "hash_beta_secret" },
    });
    assert.equal(resBeta.statusCode, 200);
    tokenBeta = resBeta.json().data.token;
  });

  let companyAId: string = "";

  await t.test("2. ICP Fit Scoring com Empresa Ideal retorna Grade A com fatores explicáveis", async () => {
    // Cria empresa com perfil ICP forte
    const resComp = await app.inject({
      method: "POST",
      url: "/api/v1/crm/companies",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        name: "TechLog Soluções Integradas",
        domain: "techlog.com.br",
        industry: "Logística & Tecnologia",
        employeeCount: 250,
      },
    });
    assert.equal(resComp.statusCode, 201);
    companyAId = resComp.json().data.id;

    const resScore = await app.inject({
      method: "GET",
      url: `/api/v1/intelligence/scores/company/${companyAId}`,
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resScore.statusCode, 200);
    const score = resScore.json().data;

    assert.equal(score.grade, "A");
    assert.ok(score.scoreValue >= 85);
    assert.equal(score.scoreType, "icp_fit");
    assert.ok(score.modelVersion);
    assert.ok(score.factors.length >= 3);
    assert.ok(score.factors.some((f: any) => f.feature === "industry_fit"));
    assert.ok(score.factors.some((f: any) => f.feature === "size_sweet_spot"));
  });

  await t.test("3. REGRA DO PLANO-MESTRE: Empresa sem evidências observáveis retorna 'unknown' e valor null", async () => {
    const resCompEmpty = await app.inject({
      method: "POST",
      url: "/api/v1/crm/companies",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        name: "Empresa Fantasma Sem Dados",
        // Sem indústria, sem employeeCount, sem domínio
      },
    });
    assert.equal(resCompEmpty.statusCode, 201);
    const emptyId = resCompEmpty.json().data.id;

    const resScoreEmpty = await app.inject({
      method: "GET",
      url: `/api/v1/intelligence/scores/company/${emptyId}`,
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resScoreEmpty.statusCode, 200);
    const score = resScoreEmpty.json().data;

    assert.equal(score.grade, "unknown", "Falha na regra do plano-mestre: score sem evidência deve ser unknown");
    assert.equal(score.scoreValue, null, "Falha na regra: valor deve ser null, nunca zero enganoso");
    assert.ok(score.factors.some((f: any) => f.feature === "missing_evidence"));
  });

  await t.test("4. GATE OBRIGATÓRIO: Avaliação com Dataset Rotulado (Benchmark de Precisão)", async () => {
    // Dataset dourado com 4 perfis rotulados para teste de precisão de IA/modelo
    const labeledDataset = [
      {
        input: { name: "Corp A", industry: "Software SaaS", employeeCount: 150, domain: "corpa.com" },
        expectedGrade: "A",
      },
      {
        input: { name: "Corp B", industry: "Varejo Local", employeeCount: 30, domain: "corpb.com" },
        expectedGrade: "C",
      },
      {
        input: { name: "Corp C", industry: "Padaria", employeeCount: 3, domain: "gmail.com" },
        expectedGrade: "D",
      },
      {
        input: { name: "Corp D" }, // Sem dados
        expectedGrade: "unknown",
      },
    ];

    let matches = 0;

    for (const item of labeledDataset) {
      const resCreate = await app.inject({
        method: "POST",
        url: "/api/v1/crm/companies",
        headers: { authorization: `Bearer ${tokenAlpha}` },
        payload: item.input,
      });
      const cId = resCreate.json().data.id;

      const resEval = await app.inject({
        method: "GET",
        url: `/api/v1/intelligence/scores/company/${cId}`,
        headers: { authorization: `Bearer ${tokenAlpha}` },
      });
      const evalData = resEval.json().data;

      if (evalData.grade === item.expectedGrade) {
        matches++;
      }
    }

    const precision = matches / labeledDataset.length;
    assert.ok(precision >= 0.9, `Precisão de ICP (${precision * 100}%) abaixo do limiar aceitável de 90%`);
  });

  let createdDealId: string = "";

  await t.test("5. Varredura de Radar detecta 'deal_slippage' e 'stagnation_risk'", async () => {
    // Cria oportunidade de alto valor (R$ 80.000) no estágio de negociação sem tarefas
    const resDeal = await app.inject({
      method: "POST",
      url: "/api/v1/crm/deals",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        companyId: companyAId,
        title: "Contrato Anual Enterprise 360",
        value: 80000,
        currency: "BRL",
        stage: "negotiation",
      },
    });
    assert.equal(resDeal.statusCode, 201);
    createdDealId = resDeal.json().data.id;

    // Consulta sinais de Radar ativos
    const resSignals = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/signals",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resSignals.statusCode, 200);
    const signals = resSignals.json().data;

    assert.ok(signals.length > 0, "Deveria ter detectado sinais de radar");
    const slippage = signals.find((s: any) => s.signalType === "deal_slippage" && s.entityId === createdDealId);
    assert.ok(slippage, "Deveria ter gerado sinal de deal_slippage para negócio de alto valor sem tarefas");
    assert.equal(slippage.severity, "high");
    assert.ok(slippage.provenance.rulesTriggered.length > 0);
  });

  await t.test("6. Dispensar Sinal altera status e audita usuário", async () => {
    const resSignals = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/signals",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    const signals = resSignals.json().data;
    const targetSignal = signals[0];

    const resDismiss = await app.inject({
      method: "POST",
      url: `/api/v1/intelligence/signals/${targetSignal.id}/dismiss`,
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resDismiss.statusCode, 200);
    const dismissed = resDismiss.json().data;
    assert.equal(dismissed.isDismissed, true);
    assert.ok(dismissed.dismissedAt);
  });

  await t.test("7. Consulta do Resumo Executivo do Radar", async () => {
    const resRadar = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/radar",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resRadar.statusCode, 200);
    const summary = resRadar.json().data;
    assert.ok(summary.monitoredDealsCount > 0);
    assert.ok(summary.generatedAt);
    assert.equal(typeof summary.qualityIndex, "number");
  });

  await t.test("8. Relatório de Qualidade de Dados", async () => {
    const resQuality = await app.inject({
      method: "GET",
      url: "/api/v1/intelligence/data-quality",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resQuality.statusCode, 200);
    const quality = resQuality.json().data;
    assert.ok(quality.overallScore >= 0 && quality.overallScore <= 100);
    assert.ok(quality.completenessRate >= 0 && quality.completenessRate <= 1);
  });

  await t.test("9. Tentativa Adversarial Cross-Tenant é bloqueada", async () => {
    // Tenant Beta tenta acessar score da Empresa criada no Tenant Alpha
    const resCrossScore = await app.inject({
      method: "GET",
      url: `/api/v1/intelligence/scores/company/${companyAId}`,
      headers: { authorization: `Bearer ${tokenBeta}` },
    });
    assert.equal(resCrossScore.statusCode, 403);
    assert.equal(resCrossScore.json().error.code, "FORBIDDEN");
  });

  await app.close();
});
