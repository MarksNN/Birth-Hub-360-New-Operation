import type {
  Company,
  Contact,
  DataQualityReport,
  Deal,
  TenantId,
} from "@birthub/contracts";

export class DataQualityEvaluator {
  public evaluateTenantDataQuality(params: {
    tenantId: TenantId;
    companies: Company[];
    contacts: Contact[];
    deals: Deal[];
  }): DataQualityReport {
    let totalFields = 0;
    let completedFields = 0;
    let issuesFound = 0;
    let unverifiedSources = 0;

    // 1. Avaliação de Empresas
    for (const comp of params.companies) {
      totalFields += 3; // name, domain, industry
      if (comp.name) completedFields++;
      if (comp.domain) completedFields++;
      else issuesFound++;
      if (comp.industry) completedFields++;
      else issuesFound++;

      if (comp.source === "unverified" || comp.source === "scraping_raw") {
        unverifiedSources++;
      }
    }

    // 2. Avaliação de Contatos
    for (const cont of params.contacts) {
      totalFields += 3; // name, email, phone
      if (cont.name) completedFields++;
      if (cont.email) completedFields++;
      else issuesFound++;
      if (cont.phone) completedFields++;
      else issuesFound++;
    }

    const completenessRate = totalFields > 0 ? completedFields / totalFields : 1.0;
    const overallScore = Math.round(completenessRate * 100);

    return {
      tenantId: params.tenantId,
      overallScore,
      completenessRate: Math.round(completenessRate * 100) / 100,
      freshnessRate: 0.94, // Simulação com baseline determinístico
      issuesFound,
      unverifiedSourcesCount: unverifiedSources,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
