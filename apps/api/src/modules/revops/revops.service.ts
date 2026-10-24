import { randomUUID } from "node:crypto";
import type {
  BillingInvoice,
  BillingInvoiceItem,
  Deal,
  DealStage,
  RevenueForecast,
  RevOpsLedgerEntry,
  SubscriptionPlan,
  TenantId,
  TenantSubscription,
  UserId,
} from "@birthub/contracts";
import type { CrmService } from "../crm/crm.service.js";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    slug: "starter",
    name: "Starter Edition",
    monthlyPriceBrl: 490.0,
    includedAiCreditsBrl: 50.0,
    maxUsers: 5,
    features: ["CRM Básico", "Outbox Sync", "Copiloto Básico"],
  },
  growth: {
    slug: "growth",
    name: "Growth Edition",
    monthlyPriceBrl: 1490.0,
    includedAiCreditsBrl: 250.0,
    maxUsers: 20,
    features: [
      "CRM Completo",
      "Bi-directional Sync",
      "Cadências Autônomas",
      "Copiloto Avançado",
      "ICP Fit Scoring",
    ],
  },
  enterprise: {
    slug: "enterprise",
    name: "Enterprise Edition",
    monthlyPriceBrl: 4900.0,
    includedAiCreditsBrl: 1000.0,
    maxUsers: 9999,
    features: [
      "CRM & RevOps Full Operation",
      "Agentes Autônomos A0-A4",
      "Forecast Preditivo",
      "RLS & Auditoria Estrita",
      "Suporte Dedicado 24x7",
    ],
  },
};

const STAGE_WIN_PROBABILITIES: Record<DealStage, number> = {
  lead: 0.05,
  qualification: 0.15,
  meeting_scheduled: 0.35,
  proposal_sent: 0.6,
  negotiation: 0.85,
  closed_won: 1.0,
  closed_lost: 0.0,
};

export class RevOpsService {
  private subscriptions = new Map<TenantId, TenantSubscription>();
  private invoices = new Map<string, BillingInvoice>();
  private invoicesByIdempotency = new Map<string, string>(); // idempotencyKey -> invoiceId
  private ledgerEntries: RevOpsLedgerEntry[] = [];

  constructor(private crmService: CrmService) {
    this.seedDefaultSubscriptions();
  }

  private seedDefaultSubscriptions() {
    this.subscriptions.set("tenant-alpha-001", {
      tenantId: "tenant-alpha-001",
      planSlug: "growth",
      status: "active",
      currentPeriodStart: "2026-10-01T00:00:00.000Z",
      currentPeriodEnd: "2026-10-31T23:59:59.000Z",
      aiCreditsUsedBrl: 12.45,
      aiCreditsLimitBrl: 250.0,
      aiCreditsBalanceBrl: 237.55,
    });

    this.subscriptions.set("tenant-beta-002", {
      tenantId: "tenant-beta-002",
      planSlug: "enterprise",
      status: "active",
      currentPeriodStart: "2026-10-01T00:00:00.000Z",
      currentPeriodEnd: "2026-10-31T23:59:59.000Z",
      aiCreditsUsedBrl: 450.0,
      aiCreditsLimitBrl: 1000.0,
      aiCreditsBalanceBrl: 550.0,
    });
  }

  /**
   * Obtém os planos disponíveis de assinatura.
   */
  public getPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  /**
   * Obtém a assinatura atual de um tenant.
   */
  public getSubscription(tenantId: TenantId): TenantSubscription {
    const sub = this.subscriptions.get(tenantId);
    if (!sub) {
      // Auto-inicializa plano Starter
      const defaultSub: TenantSubscription = {
        tenantId,
        planSlug: "starter",
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        aiCreditsUsedBrl: 0,
        aiCreditsLimitBrl: 50.0,
        aiCreditsBalanceBrl: 50.0,
      };
      this.subscriptions.set(tenantId, defaultSub);
      return defaultSub;
    }
    return sub;
  }

  /**
   * Consome créditos de IA e registra no Ledger financeiro com checagem de cota.
   */
  public recordAiUsage(
    tenantId: TenantId,
    costBrl: number,
    referenceId: string,
    modelName: string
  ): { allowed: boolean; remainingBalanceBrl: number } {
    const sub = this.getSubscription(tenantId);

    if (sub.aiCreditsUsedBrl + costBrl > sub.aiCreditsLimitBrl) {
      return { allowed: false, remainingBalanceBrl: sub.aiCreditsBalanceBrl };
    }

    sub.aiCreditsUsedBrl = Number((sub.aiCreditsUsedBrl + costBrl).toFixed(4));
    sub.aiCreditsBalanceBrl = Number((sub.aiCreditsLimitBrl - sub.aiCreditsUsedBrl).toFixed(4));

    const ledgerEntry: RevOpsLedgerEntry = {
      id: `led_${randomUUID()}`,
      tenantId,
      category: "ai_inference",
      description: `Invocação LLM (${modelName})`,
      amountBrl: costBrl,
      referenceId,
      createdAt: new Date().toISOString(),
    };
    this.ledgerEntries.push(ledgerEntry);

    return { allowed: true, remainingBalanceBrl: sub.aiCreditsBalanceBrl };
  }

  /**
   * Calcula previsão de receita (forecasting) com reconciliação matemática estrita
   * e intervalos de confiança baseados em estágios do pipeline.
   */
  public calculateForecast(tenantId: TenantId, period = "2026-Q4"): RevenueForecast {
    const deals = this.crmService.listDeals(tenantId);

    const breakdownByStage: Record<DealStage, number> = {
      lead: 0,
      qualification: 0,
      meeting_scheduled: 0,
      proposal_sent: 0,
      negotiation: 0,
      closed_won: 0,
      closed_lost: 0,
    };

    let pipelineTotal = 0;
    let winProbabilityWeighted = 0;
    let commitValue = 0;
    let bestCaseValue = 0;

    for (const deal of deals) {
      const stage = deal.stage;
      const val = deal.value || 0;
      breakdownByStage[stage] = (breakdownByStage[stage] || 0) + val;

      if (stage !== "closed_lost") {
        pipelineTotal += val;
        const prob = STAGE_WIN_PROBABILITIES[stage] || 0;
        winProbabilityWeighted += val * prob;

        // Categorias de previsão:
        // Commit: fechados (closed_won) + negociação avançada (85%+)
        if (stage === "closed_won" || stage === "negotiation") {
          commitValue += val * (stage === "closed_won" ? 1.0 : 0.85);
        }

        // Best Case: fechados + negociação + propostas enviadas
        if (stage === "closed_won" || stage === "negotiation" || stage === "proposal_sent") {
          bestCaseValue += val;
        }
      }
    }

    // Arredondamentos e reconciliação de intervalos
    commitValue = Math.round(commitValue * 100) / 100;
    bestCaseValue = Math.max(commitValue, Math.round(bestCaseValue * 100) / 100);
    winProbabilityWeighted = Math.round(winProbabilityWeighted * 100) / 100;
    pipelineTotal = Math.round(pipelineTotal * 100) / 100;

    // Intervalos de confiança (Low, Mid, High)
    const confidenceInterval = {
      low: commitValue,
      mid: winProbabilityWeighted,
      high: bestCaseValue,
    };

    return {
      tenantId,
      period,
      commitValue,
      bestCaseValue,
      pipelineTotal,
      winProbabilityWeighted,
      confidenceInterval,
      breakdownByStage,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Geração de fatura com idempotência estrita (Mandatory Gate da Onda W09).
   * Se chamado com a mesma idempotencyKey, retorna a fatura previamente criada
   * sem duplicar registros ou cobrança.
   */
  public generateInvoice(
    tenantId: TenantId,
    period: string,
    idempotencyKey: string,
    items?: BillingInvoiceItem[]
  ): { invoice: BillingInvoice; isDuplicateReplay: boolean } {
    if (!idempotencyKey) {
      throw new Error("Idempotency key é obrigatória para emissão de faturas.");
    }

    // 1. Verificação de idempotência por chave
    const existingId = this.invoicesByIdempotency.get(idempotencyKey);
    if (existingId) {
      const existing = this.invoices.get(existingId);
      if (existing) {
        if (existing.tenantId !== tenantId) {
          throw new CrossTenantViolationError(
            `Violação multi-tenant ao tentar reusar chave de idempotência de outro tenant.`
          );
        }
        return { invoice: existing, isDuplicateReplay: true };
      }
    }

    // 2. Verificação se já existe fatura para o período deste tenant
    for (const inv of this.invoices.values()) {
      if (inv.tenantId === tenantId && inv.period === period) {
        return { invoice: inv, isDuplicateReplay: true };
      }
    }

    // 3. Montagem dos itens de fatura padrão baseados no plano e uso
    const sub = this.getSubscription(tenantId);
    const plan = SUBSCRIPTION_PLANS[sub.planSlug] || SUBSCRIPTION_PLANS.starter;

    const invoiceItems: BillingInvoiceItem[] = items && items.length > 0
      ? items
      : [
          {
            description: `Plano ${plan.name} (${period})`,
            quantity: 1,
            unitPriceBrl: plan.monthlyPriceBrl,
            amountBrl: plan.monthlyPriceBrl,
          },
          ...(sub.aiCreditsUsedBrl > plan.includedAiCreditsBrl
            ? [
                {
                  description: `Consumo excedente de IA (${period})`,
                  quantity: 1,
                  unitPriceBrl: Number((sub.aiCreditsUsedBrl - plan.includedAiCreditsBrl).toFixed(2)),
                  amountBrl: Number((sub.aiCreditsUsedBrl - plan.includedAiCreditsBrl).toFixed(2)),
                },
              ]
            : []),
        ];

    const totalAmount = invoiceItems.reduce((acc, it) => acc + it.amountBrl, 0);
    const invoiceId = `inv_${randomUUID()}`;
    const invoiceNumber = `INV-${period.replace("-", "")}-${invoiceId.slice(-6).toUpperCase()}`;

    const newInvoice: BillingInvoice = {
      id: invoiceId,
      tenantId,
      invoiceNumber,
      period,
      amountBrl: Number(totalAmount.toFixed(2)),
      status: "open",
      idempotencyKey,
      items: invoiceItems,
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.invoices.set(invoiceId, newInvoice);
    this.invoicesByIdempotency.set(idempotencyKey, invoiceId);

    // Registra no ledger
    this.ledgerEntries.push({
      id: `led_${randomUUID()}`,
      tenantId,
      category: "platform_subscription",
      description: `Fatura emitida ${invoiceNumber}`,
      amountBrl: newInvoice.amountBrl,
      referenceId: invoiceId,
      createdAt: new Date().toISOString(),
    });

    return { invoice: newInvoice, isDuplicateReplay: false };
  }

  /**
   * Lista faturas do tenant com isolamento rigoroso.
   */
  public listInvoices(tenantId: TenantId): BillingInvoice[] {
    const result: BillingInvoice[] = [];
    for (const inv of this.invoices.values()) {
      if (inv.tenantId === tenantId) {
        result.push(inv);
      }
    }
    return result;
  }

  /**
   * Obtém fatura por ID com verificação de isolamento de tenant.
   */
  public getInvoiceById(tenantId: TenantId, invoiceId: string): BillingInvoice | null {
    const inv = this.invoices.get(invoiceId);
    if (!inv) return null;
    if (inv.tenantId !== tenantId) {
      throw new CrossTenantViolationError(
        `Acesso não autorizado: Fatura ${invoiceId} pertence a outro tenant.`
      );
    }
    return inv;
  }

  /**
   * Obtém extrato do ledger financeiro do tenant.
   */
  public getLedger(tenantId: TenantId): RevOpsLedgerEntry[] {
    return this.ledgerEntries.filter((e) => e.tenantId === tenantId);
  }
}
