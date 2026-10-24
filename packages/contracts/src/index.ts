/**
 * @birthub/contracts
 * Contratos centrais, tipos compartilhados e definições de domínio do Birthub 360 Full Operation.
 */

// ==========================================
// Identidade, Tenants e Organizações
// ==========================================

export type TenantId = string;
export type UserId = string;

export type UserRole =
  | "owner"
  | "admin"
  | "manager"
  | "sales"
  | "analyst"
  | "integration_service";

export interface Organization {
  id: TenantId;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "enterprise";
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: UserId;
  tenantId: TenantId;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// CRM: Entidades e Oportunidades
// ==========================================

export type DealStage =
  | "lead"
  | "qualification"
  | "meeting_scheduled"
  | "proposal_sent"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export interface Company {
  id: string;
  tenantId: TenantId;
  name: string;
  domain?: string;
  industry?: string;
  employeeCount?: number;
  source: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  tenantId: TenantId;
  companyId?: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  source: string;
  externalId?: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  tenantId: TenantId;
  companyId?: string;
  contactId?: string;
  ownerId: UserId;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  healthScore?: number; // 0 a 100
  isStagnant: boolean;
  lastActivityAt?: string;
  source: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Atividades e Tarefas
// ==========================================

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  tenantId: TenantId;
  dealId?: string;
  assignedTo: UserId;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  source: "manual" | "ai_recommendation" | "sync_bitrix24";
  completedAt?: string;
  createdAt: string;
}

// ==========================================
// Governança de IA e Agentes
// ==========================================

export type AgentType = "radar" | "research" | "sales_copilot" | "executor";

/**
 * Níveis de autonomia de IA conforme Plano-Mestre (docs/06-AGENTES-E-IA.md):
 * A0: Somente recomendar
 * A1: Rascunhar
 * A2: Leitura autorizada
 * A3: Escrita limitada por política (tarefa interna sem disparo externo)
 * A4: Ação sensível: aprovação explícita obrigatória
 */
export type AutonomyLevel = "A0" | "A1" | "A2" | "A3" | "A4";

export interface AgentRun {
  id: string;
  tenantId: TenantId;
  agentType: AgentType;
  autonomyLevel: AutonomyLevel;
  goal: string;
  model: string;
  promptHash: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCostBrl?: number;
  requiresApproval: boolean;
  approvedBy?: UserId;
  approvedAt?: string;
  idempotencyKey: string;
  status: "pending" | "approved" | "rejected" | "executed" | "failed";
  outputSnippet?: string;
  createdAt: string;
}

// ==========================================
// Integrações e Sincronização (W05)
// ==========================================

export type IntegrationProvider = "bitrix24" | "webhook_custom" | "apollo" | "cnpj_places";

export interface ExternalIntegration {
  id: string;
  tenantId: TenantId;
  provider: IntegrationProvider;
  status: "active" | "paused" | "error";
  lastSyncAt?: string;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface ExternalIdentity {
  id: string;
  tenantId: TenantId;
  provider: IntegrationProvider;
  entityType: "company" | "contact" | "deal" | "task";
  localId: string;
  externalId: string;
  syncVersion: number;
  lastSyncedAt: string;
  metadata?: Record<string, unknown>;
}

export type OutboxStatus = "pending" | "processed" | "failed" | "dead_letter";

export interface OutboxEvent {
  id: string;
  tenantId: TenantId;
  eventType: string;
  aggregateType: "company" | "contact" | "deal" | "task" | "integration";
  aggregateId: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  retryCount: number;
  maxRetries: number;
  idempotencyKey: string;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
}

export interface SyncCursor {
  id: string;
  tenantId: TenantId;
  provider: IntegrationProvider;
  entityType: string;
  cursorValue: string;
  updatedAt: string;
}

export type ConflictResolution = "pending" | "keep_local" | "overwrite_with_external" | "manual_merge";

export interface SyncConflict {
  id: string;
  tenantId: TenantId;
  provider: IntegrationProvider;
  entityType: "company" | "contact" | "deal" | "task";
  localId: string;
  externalId: string;
  fieldName: string;
  localValue: unknown;
  externalValue: unknown;
  resolution: ConflictResolution;
  resolvedBy?: UserId;
  resolvedAt?: string;
  createdAt: string;
}

export interface SyncResult {
  syncRunId: string;
  tenantId: TenantId;
  provider: IntegrationProvider;
  processed: number;
  created: number;
  updated: number;
  conflicts: number;
  errors: number;
  status: "completed" | "completed_with_conflicts" | "failed";
  cursor?: string;
}

// ==========================================
// Inteligência Comercial e Radar (W06)
// ==========================================

export type SignalType =
  | "stagnation_risk"
  | "deal_slippage"
  | "engagement_drop"
  | "icp_mismatch"
  | "high_intent";

export type SignalSeverity = "low" | "medium" | "high" | "critical";

export interface Signal {
  id: string;
  tenantId: TenantId;
  entityType: "deal" | "company" | "contact";
  entityId: string;
  signalType: SignalType;
  severity: SignalSeverity;
  title: string;
  explanation: string;
  confidence: number;
  recommendedAction: string;
  provenance: {
    modelVersion: string;
    computedAt: string;
    rulesTriggered: string[];
  };
  isDismissed: boolean;
  dismissedBy?: UserId;
  dismissedAt?: string;
  createdAt: string;
}

export type ScoreType = "icp_fit" | "win_probability" | "data_quality";
export type ScoreGrade = "A" | "B" | "C" | "D" | "unknown";

export interface ScoreFactor {
  feature: string;
  impact: number;
  explanation: string;
  confidence: number;
}

export interface ScoreSnapshot {
  id: string;
  tenantId: TenantId;
  entityType: "company" | "deal";
  entityId: string;
  scoreType: ScoreType;
  scoreValue: number | null;
  grade: ScoreGrade;
  factors: ScoreFactor[];
  modelVersion: string;
  computedAt: string;
}

export interface DataQualityReport {
  tenantId: TenantId;
  overallScore: number;
  completenessRate: number;
  freshnessRate: number;
  issuesFound: number;
  unverifiedSourcesCount: number;
  evaluatedAt: string;
}

export interface RadarSummary {
  tenantId: TenantId;
  monitoredDealsCount: number;
  stagnantDealsCount: number;
  activeSignalsCount: number;
  criticalSignalsCount: number;
  pipelineAtRiskValue: number;
  qualityIndex: number;
  generatedAt: string;
}

// ==========================================
// Automações, Cadências e Consentimento (W08)
// ==========================================

export interface CadenceStep {
  stepNumber: number;
  delayDays: number;
  actionType: "create_task" | "generate_draft" | "notify_rep";
  title: string;
  isAutomated: boolean;
}

export interface CadenceWorkflow {
  id: string;
  tenantId: TenantId;
  name: string;
  triggerType: "deal_stagnant" | "new_lead" | "stage_change";
  steps: CadenceStep[];
  isActive: boolean;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  tenantId: TenantId;
  contactId: string;
  channel: "email" | "phone" | "whatsapp";
  status: "opt_in" | "opt_out";
  source: string;
  recordedAt: string;
}

export interface ProposalDocument {
  id: string;
  tenantId: TenantId;
  dealId: string;
  title: string;
  templateId: string;
  contentMarkdown: string;
  totalValue: number;
  currency: string;
  status: "draft" | "under_review" | "approved" | "sent" | "signed" | "rejected";
  generatedBy: UserId;
  approvedBy?: UserId;
  createdAt: string;
}

export interface WorkflowRun {
  id: string;
  tenantId: TenantId;
  workflowId: string;
  entityId: string;
  currentStep: number;
  status: "running" | "paused" | "completed" | "cancelled_opt_out";
  startedAt: string;
  completedAt?: string;
}

// ==========================================
// RevOps, Forecasting e Monetização (W09)
// ==========================================

export interface RevenueForecastCategory {
  category: "commit" | "best_case" | "pipeline" | "closed_won";
  amountBrl: number;
  dealCount: number;
}

export interface RevenueForecast {
  tenantId: TenantId;
  period: string;
  commitValue: number;
  bestCaseValue: number;
  pipelineTotal: number;
  winProbabilityWeighted: number;
  confidenceInterval: {
    low: number;
    mid: number;
    high: number;
  };
  breakdownByStage: Record<DealStage, number>;
  generatedAt: string;
}

export interface SubscriptionPlan {
  slug: "starter" | "growth" | "enterprise";
  name: string;
  monthlyPriceBrl: number;
  includedAiCreditsBrl: number;
  maxUsers: number;
  features: string[];
}

export interface TenantSubscription {
  tenantId: TenantId;
  planSlug: "starter" | "growth" | "enterprise";
  status: "active" | "past_due" | "cancelled" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  aiCreditsUsedBrl: number;
  aiCreditsLimitBrl: number;
  aiCreditsBalanceBrl: number;
}

export interface BillingInvoiceItem {
  description: string;
  quantity: number;
  unitPriceBrl: number;
  amountBrl: number;
}

export interface BillingInvoice {
  id: string;
  tenantId: TenantId;
  invoiceNumber: string;
  period: string;
  amountBrl: number;
  status: "draft" | "open" | "paid" | "void";
  idempotencyKey: string;
  items: BillingInvoiceItem[];
  issuedAt: string;
  paidAt?: string;
  createdAt: string;
}

export interface RevOpsLedgerEntry {
  id: string;
  tenantId: TenantId;
  category: "ai_inference" | "platform_subscription" | "add_on";
  description: string;
  amountBrl: number;
  referenceId?: string;
  createdAt: string;
}

// ==========================================
// Health & API Standard Responses
// ==========================================

export interface ApiHealth {
  status: "ok";
  service: string;
  version: string;
  uptimeSeconds: number;
  environment: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
