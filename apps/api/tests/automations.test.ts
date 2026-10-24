import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("W08: Automações, Cadências, Validação de Consentimento/Opt-Out e Propostas", async (t) => {
  const app = createApp();
  await app.ready();

  let tokenAlpha: string = "";
  let tokenBeta: string = "";

  await t.test("1. Autenticação e tokens", async () => {
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

  let workflowId: string = "";

  await t.test("2. Listar e criar workflow de cadência comercial", async () => {
    const resList = await app.inject({
      method: "GET",
      url: "/api/v1/automations/workflows",
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resList.statusCode, 200);
    assert.ok(resList.json().data.length > 0);

    const resCreate = await app.inject({
      method: "POST",
      url: "/api/v1/automations/workflows",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        name: "Cadência Follow-up Negócios Parados",
        triggerType: "deal_stagnant",
        steps: [
          {
            stepNumber: 1,
            delayDays: 0,
            actionType: "create_task",
            title: "Verificar motivo de congelamento com decisor",
            isAutomated: false,
          },
          {
            stepNumber: 2,
            delayDays: 3,
            actionType: "generate_draft",
            title: "Rascunhar nova condição comercial",
            isAutomated: true,
          },
        ],
      },
    });
    assert.equal(resCreate.statusCode, 201);
    workflowId = resCreate.json().data.id;
    assert.ok(workflowId);
  });

  let createdDealId: string = "";
  let contactWithOptOutId: string = "";

  await t.test("3. Disparo de workflow para oportunidade normal executa com status 'running'", async () => {
    // Cria oportunidade para o teste
    const resDeal = await app.inject({
      method: "POST",
      url: "/api/v1/crm/deals",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        title: "Oportunidade Cadência Alpha",
        value: 65000,
        currency: "BRL",
        stage: "qualification",
      },
    });
    assert.equal(resDeal.statusCode, 201);
    createdDealId = resDeal.json().data.id;

    const resTrigger = await app.inject({
      method: "POST",
      url: `/api/v1/automations/workflows/${workflowId}/trigger`,
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: { entityId: createdDealId },
    });
    assert.equal(resTrigger.statusCode, 200);
    const run = resTrigger.json().data;
    assert.equal(run.status, "running");
    assert.equal(run.currentStep, 1);
  });

  await t.test("4. GATE OBRIGATÓRIO (LGPD / Opt-Out Stop): Contato com opt-out cancela execução de automação", async () => {
    // Cria contato que posteriormente solicita opt-out
    const resContact = await app.inject({
      method: "POST",
      url: "/api/v1/crm/contacts",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        name: "Renato OptOut",
        email: "renato.optout@empresa.com",
      },
    });
    assert.equal(resContact.statusCode, 201);
    contactWithOptOutId = resContact.json().data.id;

    // Registra opt-out formal
    const resOptOut = await app.inject({
      method: "POST",
      url: "/api/v1/automations/consent",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        contactId: contactWithOptOutId,
        channel: "email",
        status: "opt_out",
        source: "unsubscribe_link",
      },
    });
    assert.equal(resOptOut.statusCode, 200);
    assert.equal(resOptOut.json().data.status, "opt_out");

    // Tentativa de disparar cadência para esse contato
    const resTriggerOptOut = await app.inject({
      method: "POST",
      url: `/api/v1/automations/workflows/${workflowId}/trigger`,
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        entityId: createdDealId,
        contactId: contactWithOptOutId,
      },
    });

    assert.equal(resTriggerOptOut.statusCode, 200);
    const runOptOut = resTriggerOptOut.json().data;

    // GATE DE ACEITE VERIFICADO: Automação foi interrompida imediatamente!
    assert.equal(runOptOut.status, "cancelled_opt_out", "Falha no Gate de Aceite: Opt-out não cancelou automação!");
    assert.equal(runOptOut.currentStep, 0);
  });

  let proposalId: string = "";

  await t.test("5. Geração de Proposta Comercial reconciliada com dados do Deal", async () => {
    const resProposal = await app.inject({
      method: "POST",
      url: "/api/v1/automations/proposals",
      headers: { authorization: `Bearer ${tokenAlpha}` },
      payload: {
        dealId: createdDealId,
        title: "Proposta de Solução Cloud e Segurança",
        templateId: "tpl_standard_v1",
      },
    });
    assert.equal(resProposal.statusCode, 201);
    const proposal = resProposal.json().data;

    assert.equal(proposal.totalValue, 65000);
    assert.equal(proposal.currency, "BRL");
    assert.equal(proposal.status, "draft");
    assert.ok(proposal.contentMarkdown.includes("65.000"));
    proposalId = proposal.id;
  });

  await t.test("6. Consulta de Proposta Comercial", async () => {
    const resGet = await app.inject({
      method: "GET",
      url: `/api/v1/automations/proposals/${proposalId}`,
      headers: { authorization: `Bearer ${tokenAlpha}` },
    });
    assert.equal(resGet.statusCode, 200);
    assert.equal(resGet.json().data.id, proposalId);
  });

  await t.test("7. Tentativa Adversarial Cross-Tenant é bloqueada", async () => {
    // Tenant Beta tenta disparar workflow do Tenant Alpha
    const resCrossWf = await app.inject({
      method: "POST",
      url: `/api/v1/automations/workflows/${workflowId}/trigger`,
      headers: { authorization: `Bearer ${tokenBeta}` },
      payload: { entityId: createdDealId },
    });
    assert.equal(resCrossWf.statusCode, 403);
    assert.equal(resCrossWf.json().error.code, "FORBIDDEN");

    // Tenant Beta tenta consultar proposta do Tenant Alpha
    const resCrossProp = await app.inject({
      method: "GET",
      url: `/api/v1/automations/proposals/${proposalId}`,
      headers: { authorization: `Bearer ${tokenBeta}` },
    });
    assert.equal(resCrossProp.statusCode, 403);
  });

  await app.close();
});
