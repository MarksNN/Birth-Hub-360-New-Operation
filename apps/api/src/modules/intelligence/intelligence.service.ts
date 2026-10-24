import { randomUUID } from "node:crypto";
import type {
  DataQualityReport,
  RadarSummary,
  ScoreSnapshot,
  Signal,
  SignalSeverity,
  SignalType,
  TenantId,
  UserId,
} from "@birthub/contracts";
import {
  DataQualityEvaluator,
  IcpFitCalculator,
  SignalDetector,
} from "@birthub/domain";
import type { CrmService } from "../crm/crm.service.js";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export class IntelligenceService {
  private signals = new Map<string, Signal>();
  private scoreSnapshots = new Map<string, ScoreSnapshot>();
  private icpCalculator = new IcpFitCalculator();
  private signalDetector = new SignalDetector();
  private qualityEvaluator = new DataQualityEvaluator();

  constructor(private crmService: CrmService) {}

  /**
   * Obtém ou calcula sob demanda o ICP Fit Score explicável de uma Empresa
   */
  public getCompanyScore(tenantId: TenantId, companyId: string): ScoreSnapshot {
    const company = this.crmService.getCompany(tenantId, companyId);
    const existing = this.scoreSnapshots.get(`${tenantId}:${companyId}`);
    if (existing) {
      return existing;
    }

    const snapshot = this.icpCalculator.evaluateCompany(tenantId, company);
    this.scoreSnapshots.set(`${tenantId}:${companyId}`, snapshot);
    return snapshot;
  }

  /**
   * Executa varredura de Sinais de Radar sobre a base de CRM do Tenant
   */
  public scanRadarSignals(tenantId: TenantId): Signal[] {
    const deals = this.crmService.listDeals(tenantId);
    const generatedSignals: Signal[] = [];

    for (const deal of deals) {
      const company = deal.companyId ? this.crmService.getCompany(tenantId, deal.companyId) : undefined;
      const companyScore = deal.companyId ? this.getCompanyScore(tenantId, deal.companyId) : undefined;
      const tasks = this.crmService.listTasks(tenantId, deal.id);

      const detected = this.signalDetector.evaluateDealSignals({
        tenantId,
        deal,
        company,
        companyScore,
        tasks,
      });

      for (const sig of detected) {
        // Evita recriar o mesmo sinal se já existir e não estiver dispensado
        const existingKey = `${tenantId}:${sig.entityId}:${sig.signalType}`;
        const existing = Array.from(this.signals.values()).find(
          (s) => s.tenantId === tenantId && s.entityId === sig.entityId && s.signalType === sig.signalType
        );

        if (!existing) {
          this.signals.set(sig.id, sig);
          generatedSignals.push(sig);
        } else if (!existing.isDismissed) {
          generatedSignals.push(existing);
        }
      }
    }

    return generatedSignals;
  }

  /**
   * Lista sinais ativos do Tenant com suporte a filtros
   */
  public listSignals(tenantId: TenantId, filter?: { type?: SignalType; severity?: SignalSeverity }): Signal[] {
    this.scanRadarSignals(tenantId);

    return Array.from(this.signals.values()).filter((s) => {
      if (s.tenantId !== tenantId) return false;
      if (s.isDismissed) return false;
      if (filter?.type && s.signalType !== filter.type) return false;
      if (filter?.severity && s.severity !== filter.severity) return false;
      return true;
    });
  }

  /**
   * Dispensa sinal de risco com auditoria do usuário
   */
  public dismissSignal(tenantId: TenantId, signalId: string, userId: UserId): Signal {
    const signal = this.signals.get(signalId);
    if (!signal) {
      throw new Error("Sinal não encontrado");
    }
    if (signal.tenantId !== tenantId) {
      throw new CrossTenantViolationError("Acesso negado: o sinal pertence a outro tenant");
    }

    signal.isDismissed = true;
    signal.dismissedBy = userId;
    signal.dismissedAt = new Date().toISOString();
    return signal;
  }

  /**
   * Gera resumo do Cockpit/Radar de Inteligência Operacional
   */
  public getRadarSummary(tenantId: TenantId): RadarSummary {
    const deals = this.crmService.listDeals(tenantId);
    const signals = this.listSignals(tenantId);

    const stagnantDealsCount = deals.filter((d) => d.isStagnant).length;
    const criticalSignalsCount = signals.filter((s) => s.severity === "critical").length;

    // Soma do valor de oportunidades com sinais de risco ativos
    const stagnantDealIds = new Set(signals.map((s) => s.entityId));
    const pipelineAtRiskValue = deals
      .filter((d) => stagnantDealIds.has(d.id))
      .reduce((acc, d) => acc + (d.value || 0), 0);

    const quality = this.getDataQualityReport(tenantId);

    return {
      tenantId,
      monitoredDealsCount: deals.length,
      stagnantDealsCount,
      activeSignalsCount: signals.length,
      criticalSignalsCount,
      pipelineAtRiskValue,
      qualityIndex: quality.overallScore,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Relatório de Qualidade de Dados
   */
  public getDataQualityReport(tenantId: TenantId): DataQualityReport {
    const companies = this.crmService.listCompanies(tenantId);
    const contacts = this.crmService.listContacts(tenantId);
    const deals = this.crmService.listDeals(tenantId);

    return this.qualityEvaluator.evaluateTenantDataQuality({
      tenantId,
      companies,
      contacts,
      deals,
    });
  }
}
