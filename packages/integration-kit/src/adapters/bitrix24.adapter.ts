import type {
  Company,
  Contact,
  Deal,
  DealStage,
  TenantId,
  UserId,
} from "@birthub/contracts";

export interface BitrixDealRaw {
  ID: string;
  TITLE: string;
  STAGE_ID: string;
  OPPORTUNITY: string;
  CURRENCY_ID: string;
  COMPANY_ID?: string;
  CONTACT_ID?: string;
  ASSIGNED_BY_ID: string;
  DATE_CREATE: string;
  DATE_MODIFY: string;
}

export interface BitrixCompanyRaw {
  ID: string;
  TITLE: string;
  COMPANY_TYPE?: string;
  INDUSTRY?: string;
  EMPLOYEES?: string;
  DATE_CREATE: string;
}

export interface BitrixContactRaw {
  ID: string;
  NAME: string;
  LAST_NAME?: string;
  EMAIL?: Array<{ VALUE: string }>;
  PHONE?: Array<{ VALUE: string }>;
  POST?: string;
  COMPANY_ID?: string;
  DATE_CREATE: string;
}

/**
 * Mapeamento de estágios do Bitrix24 para o funil canônico do Birthub 360
 */
export function mapBitrixStageToDealStage(stageId: string): DealStage {
  const normalized = stageId.toUpperCase();
  if (normalized.includes("WON") || normalized === "WON") return "closed_won";
  if (normalized.includes("LOSE") || normalized.includes("LOST") || normalized === "LOSE") return "closed_lost";
  if (normalized.includes("FINAL") || normalized.includes("NEGOTIATION")) return "negotiation";
  if (normalized.includes("PROPOSAL") || normalized.includes("OFFER")) return "proposal_sent";
  if (normalized.includes("MEETING") || normalized.includes("CALL")) return "meeting_scheduled";
  if (normalized.includes("QUALIF") || normalized.includes("PREPARATION")) return "qualification";
  return "lead";
}

/**
 * Converte Empresa do Bitrix24 para o padrão canônico do Birthub com proveniência
 */
export function mapBitrixCompany(
  raw: BitrixCompanyRaw,
  tenantId: TenantId
): Omit<Company, "id" | "createdAt" | "updatedAt"> & { externalId: string } {
  return {
    tenantId,
    name: raw.TITLE?.trim() || `Empresa Bitrix #${raw.ID}`,
    industry: raw.INDUSTRY,
    employeeCount: raw.EMPLOYEES ? parseInt(raw.EMPLOYEES, 10) : undefined,
    source: "bitrix24",
    externalId: String(raw.ID),
  };
}

/**
 * Converte Contato do Bitrix24 para o padrão canônico do Birthub
 */
export function mapBitrixContact(
  raw: BitrixContactRaw,
  tenantId: TenantId,
  mappedCompanyId?: string
): Omit<Contact, "id" | "createdAt"> & { externalId: string } {
  const fullName = [raw.NAME, raw.LAST_NAME].filter(Boolean).join(" ").trim() || `Contato Bitrix #${raw.ID}`;
  const email = raw.EMAIL?.[0]?.VALUE;
  const phone = raw.PHONE?.[0]?.VALUE;

  return {
    tenantId,
    name: fullName,
    email,
    phone,
    title: raw.POST,
    companyId: mappedCompanyId,
    source: "bitrix24",
    externalId: String(raw.ID),
  };
}

/**
 * Converte Oportunidade/Deal do Bitrix24 para o padrão canônico do Birthub
 */
export function mapBitrixDeal(
  raw: BitrixDealRaw,
  tenantId: TenantId,
  ownerId: UserId,
  mappedCompanyId?: string,
  mappedContactId?: string
): Omit<Deal, "id" | "createdAt" | "updatedAt"> & { externalId: string } {
  const value = parseFloat(raw.OPPORTUNITY) || 0;
  return {
    tenantId,
    ownerId,
    companyId: mappedCompanyId,
    contactId: mappedContactId,
    title: raw.TITLE?.trim() || `Oportunidade Bitrix #${raw.ID}`,
    value,
    currency: raw.CURRENCY_ID || "BRL",
    stage: mapBitrixStageToDealStage(raw.STAGE_ID),
    isStagnant: false,
    source: "bitrix24",
    externalId: String(raw.ID),
  };
}
