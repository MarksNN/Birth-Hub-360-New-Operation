import type {
  Company,
  ScoreFactor,
  ScoreGrade,
  ScoreSnapshot,
  TenantId,
} from "@birthub/contracts";
import { randomUUID } from "node:crypto";

export const ICP_MODEL_VERSION = "icp_fit_v1.0.0";

const B2B_PRIORITY_INDUSTRIES = [
  "tecnologia",
  "software",
  "logística",
  "logistica & transporte",
  "manufatura",
  "indústria",
  "saúde",
  "serviços financeiros",
  "telecomunicações",
];

export class IcpFitCalculator {
  /**
   * Calcula o ICP Fit Score de uma empresa com rastreabilidade e explicabilidade.
   * Regra Obrigatória do Plano-Mestre:
   * "Score sem evidência é unknown, não zero."
   */
  public evaluateCompany(tenantId: TenantId, company: Company): ScoreSnapshot {
    const factors: ScoreFactor[] = [];

    // Verificação de ausência total de evidências observáveis
    const hasEvidence =
      Boolean(company.industry) ||
      company.employeeCount !== undefined ||
      Boolean(company.domain);

    if (!hasEvidence) {
      return {
        id: `score_${randomUUID()}`,
        tenantId,
        entityType: "company",
        entityId: company.id,
        scoreType: "icp_fit",
        scoreValue: null,
        grade: "unknown",
        factors: [
          {
            feature: "missing_evidence",
            impact: 0,
            explanation: "Nenhum dado observável de porte, indústria ou domínio disponível para computação.",
            confidence: 0.0,
          },
        ],
        modelVersion: ICP_MODEL_VERSION,
        computedAt: new Date().toISOString(),
      };
    }

    let rawScore = 0;

    // 1. Fator: Setor / Indústria
    if (company.industry) {
      const normalizedIndustry = company.industry.toLowerCase();
      const isPriority = B2B_PRIORITY_INDUSTRIES.some((p) => normalizedIndustry.includes(p));

      if (isPriority) {
        rawScore += 35;
        factors.push({
          feature: "industry_fit",
          impact: 0.35,
          explanation: `Setor '${company.industry}' alinhado com segmento prioritário B2B.`,
          confidence: 0.9,
        });
      } else {
        rawScore += 10;
        factors.push({
          feature: "industry_secondary",
          impact: 0.1,
          explanation: `Setor '${company.industry}' aceitável como mercado secundário.`,
          confidence: 0.7,
        });
      }
    } else {
      factors.push({
        feature: "industry_unknown",
        impact: 0,
        explanation: "Setor não informado; evidência ausente.",
        confidence: 0.2,
      });
    }

    // 2. Fator: Porte por Número de Funcionários
    if (company.employeeCount !== undefined) {
      const count = company.employeeCount;
      if (count >= 50 && count <= 1000) {
        rawScore += 35;
        factors.push({
          feature: "size_sweet_spot",
          impact: 0.35,
          explanation: `Porte ideal (${count} funcionários): operação comercial com volume e maturidade.`,
          confidence: 0.95,
        });
      } else if (count >= 20 && count < 50) {
        rawScore += 20;
        factors.push({
          feature: "size_growing",
          impact: 0.2,
          explanation: `Porte em expansão (${count} funcionários).`,
          confidence: 0.8,
        });
      } else if (count > 1000) {
        rawScore += 25;
        factors.push({
          feature: "size_enterprise",
          impact: 0.25,
          explanation: `Grande porte (${count} funcionários): alto potencial com ciclo de decisão estendido.`,
          confidence: 0.85,
        });
      } else {
        rawScore += 5;
        factors.push({
          feature: "size_micro",
          impact: 0.05,
          explanation: `Microempresa (${count} funcionários): menor propensão a ticket B2B recorrente.`,
          confidence: 0.8,
        });
      }
    } else {
      factors.push({
        feature: "size_unknown",
        impact: 0,
        explanation: "Contagem de funcionários desconhecida.",
        confidence: 0.2,
      });
    }

    // 3. Fator: Domínio Corporativo Próprio
    if (company.domain && !company.domain.includes("gmail") && !company.domain.includes("hotmail")) {
      rawScore += 20;
      factors.push({
        feature: "domain_corporate",
        impact: 0.2,
        explanation: `Presença de domínio corporativo verificado '${company.domain}'.`,
        confidence: 0.95,
      });
    }

    // 4. Fator: Origem da Conexão
    if (company.source === "bitrix24" || company.source === "inbound") {
      rawScore += 10;
      factors.push({
        feature: "source_qualified",
        impact: 0.1,
        explanation: `Conta originada de canal validado (${company.source}).`,
        confidence: 0.9,
      });
    }

    const finalScore = Math.min(100, Math.max(0, rawScore));

    let grade: ScoreGrade = "D";
    if (finalScore >= 85) grade = "A";
    else if (finalScore >= 70) grade = "B";
    else if (finalScore >= 50) grade = "C";

    return {
      id: `score_${randomUUID()}`,
      tenantId,
      entityType: "company",
      entityId: company.id,
      scoreType: "icp_fit",
      scoreValue: finalScore,
      grade,
      factors,
      modelVersion: ICP_MODEL_VERSION,
      computedAt: new Date().toISOString(),
    };
  }
}
