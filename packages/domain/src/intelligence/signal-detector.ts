import type {
  Company,
  Deal,
  ScoreSnapshot,
  Signal,
  Task,
  TenantId,
} from "@birthub/contracts";
import { randomUUID } from "node:crypto";

export const RADAR_DETECTOR_VERSION = "radar_signal_v1.0.0";

export class SignalDetector {
  /**
   * Executa varredura de sinais operacionais de receita sobre oportunidades
   */
  public evaluateDealSignals(params: {
    tenantId: TenantId;
    deal: Deal;
    company?: Company;
    companyScore?: ScoreSnapshot;
    tasks?: Task[];
  }): Signal[] {
    const signals: Signal[] = [];
    const now = Date.now();
    const lastActivityTime = params.deal.lastActivityAt
      ? new Date(params.deal.lastActivityAt).getTime()
      : new Date(params.deal.createdAt).getTime();

    const daysSinceLastActivity = Math.floor((now - lastActivityTime) / (1000 * 60 * 60 * 24));

    // 1. Sinal de Risco de Estagnação (Stagnation Risk)
    const activePipelineStages = ["qualification", "meeting_scheduled", "proposal_sent", "negotiation"];
    if (activePipelineStages.includes(params.deal.stage)) {
      if (params.deal.isStagnant || daysSinceLastActivity >= 14) {
        signals.push({
          id: `sig_${randomUUID()}`,
          tenantId: params.tenantId,
          entityType: "deal",
          entityId: params.deal.id,
          signalType: "stagnation_risk",
          severity: params.deal.value > 50000 ? "critical" : "high",
          title: `Oportunidade estagnada no estágio '${params.deal.stage}'`,
          explanation: `Negócio sem registro de atividades há ${daysSinceLastActivity} dias. Histórico indica perda de tração.`,
          confidence: 0.92,
          recommendedAction: "Agendar follow-up executivo ou reavaliação de prioridade com o tomador de decisão.",
          provenance: {
            modelVersion: RADAR_DETECTOR_VERSION,
            computedAt: new Date().toISOString(),
            rulesTriggered: ["rule_stage_inactive_gt_14d"],
          },
          isDismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 2. Sinal de Deslize de Receita (Deal Slippage) em negócios de alto valor
    if (params.deal.value >= 50000 && (params.deal.stage === "proposal_sent" || params.deal.stage === "negotiation")) {
      const pendingTasks = (params.tasks || []).filter(
        (t) => t.dealId === params.deal.id && (t.status === "pending" || t.status === "in_progress")
      );

      if (pendingTasks.length === 0) {
        signals.push({
          id: `sig_${randomUUID()}`,
          tenantId: params.tenantId,
          entityType: "deal",
          entityId: params.deal.id,
          signalType: "deal_slippage",
          severity: "high",
          title: "Negócio de alto valor sem próxima ação agendada",
          explanation: `Oportunidade de ${params.deal.currency} ${params.deal.value.toLocaleString("pt-BR")} está em negociação mas não possui nenhuma tarefa pendente.`,
          confidence: 0.88,
          recommendedAction: "Criar imediatamente uma tarefa de alinhamento com prazos de fechamento.",
          provenance: {
            modelVersion: RADAR_DETECTOR_VERSION,
            computedAt: new Date().toISOString(),
            rulesTriggered: ["rule_high_value_no_pending_task"],
          },
          isDismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 3. Sinal de Incompatibilidade de ICP (ICP Mismatch)
    if (params.companyScore && (params.companyScore.grade === "D" || params.companyScore.grade === "unknown")) {
      if (params.deal.stage === "negotiation" || params.deal.stage === "proposal_sent") {
        signals.push({
          id: `sig_${randomUUID()}`,
          tenantId: params.tenantId,
          entityType: "deal",
          entityId: params.deal.id,
          signalType: "icp_mismatch",
          severity: "medium",
          title: "Avanço avançado em conta com ICP D/Unknown",
          explanation: `A conta associada possui classificação de ICP '${params.companyScore.grade}'. Risco aumentado de churn prematuro ou ciclo de venda custoso.`,
          confidence: 0.82,
          recommendedAction: "Qualificar orçamento e autoridade do cliente antes de enviar condições especiais de proposta.",
          provenance: {
            modelVersion: RADAR_DETECTOR_VERSION,
            computedAt: new Date().toISOString(),
            rulesTriggered: ["rule_advanced_stage_low_icp"],
          },
          isDismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return signals;
  }
}
