import { randomUUID } from "node:crypto";
import type {
  CadenceStep,
  CadenceWorkflow,
  ConsentRecord,
  ProposalDocument,
  TenantId,
  UserId,
  WorkflowRun,
} from "@birthub/contracts";
import type { CrmService } from "../crm/crm.service.js";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export class AutomationsService {
  private workflows = new Map<string, CadenceWorkflow>();
  private consentRecords = new Map<string, ConsentRecord>();
  private proposals = new Map<string, ProposalDocument>();
  private workflowRuns = new Map<string, WorkflowRun>();

  constructor(private crmService: CrmService) {
    this.seedDefaultWorkflows();
  }

  private seedDefaultWorkflows() {
    const tenantId = "tenant-alpha-001";
    const wfId = "wf-cadence-inbound-01";
    this.workflows.set(wfId, {
      id: wfId,
      tenantId,
      name: "Cadência Reativa Inbound B2B",
      triggerType: "new_lead",
      steps: [
        {
          stepNumber: 1,
          delayDays: 0,
          actionType: "create_task",
          title: "Realizar primeiro contato de qualificação",
          isAutomated: false,
        },
        {
          stepNumber: 2,
          delayDays: 2,
          actionType: "generate_draft",
          title: "Rascunhar e-mail de cases de sucesso",
          isAutomated: true,
        },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  public createWorkflow(
    tenantId: TenantId,
    data: {
      name: string;
      triggerType: CadenceWorkflow["triggerType"];
      steps: CadenceStep[];
    }
  ): CadenceWorkflow {
    const id = `wf_${randomUUID()}`;
    const workflow: CadenceWorkflow = {
      id,
      tenantId,
      name: data.name,
      triggerType: data.triggerType,
      steps: data.steps,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  public listWorkflows(tenantId: TenantId): CadenceWorkflow[] {
    return Array.from(this.workflows.values()).filter((w) => w.tenantId === tenantId);
  }

  public recordConsent(
    tenantId: TenantId,
    data: {
      contactId: string;
      channel: "email" | "phone" | "whatsapp";
      status: "opt_in" | "opt_out";
      source: string;
    }
  ): ConsentRecord {
    const key = `${tenantId}:${data.contactId}:${data.channel}`;
    const record: ConsentRecord = {
      id: `cons_${randomUUID()}`,
      tenantId,
      contactId: data.contactId,
      channel: data.channel,
      status: data.status,
      source: data.source,
      recordedAt: new Date().toISOString(),
    };
    this.consentRecords.set(key, record);
    return record;
  }

  public getConsent(
    tenantId: TenantId,
    contactId: string,
    channel: "email" | "phone" | "whatsapp"
  ): ConsentRecord | undefined {
    const key = `${tenantId}:${contactId}:${channel}`;
    return this.consentRecords.get(key);
  }

  /**
   * Dispara um Workflow com validação estrita de consentimento e opt-out
   */
  public triggerWorkflow(params: {
    workflowId: string;
    tenantId: TenantId;
    entityId: string;
    contactId?: string;
    userId: UserId;
  }): WorkflowRun {
    const workflow = this.workflows.get(params.workflowId);
    if (!workflow) throw new Error("Workflow não encontrado");

    if (workflow.tenantId !== params.tenantId) {
      throw new CrossTenantViolationError("Acesso negado: o workflow pertence a outro tenant");
    }

    const runId = `wfrun_${randomUUID()}`;

    // GATE OBRIGATÓRIO: Verificação de Consentimento / Opt-out
    if (params.contactId) {
      const emailConsent = this.getConsent(params.tenantId, params.contactId, "email");
      if (emailConsent && emailConsent.status === "opt_out") {
        const cancelledRun: WorkflowRun = {
          id: runId,
          tenantId: params.tenantId,
          workflowId: params.workflowId,
          entityId: params.entityId,
          currentStep: 0,
          status: "cancelled_opt_out",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        this.workflowRuns.set(runId, cancelledRun);
        return cancelledRun;
      }
    }

    // Executa primeiro passo da cadência (ex.: agendar tarefa no CRM)
    if (workflow.steps.length > 0) {
      const firstStep = workflow.steps[0];
      if (firstStep.actionType === "create_task") {
        this.crmService.createTask(params.tenantId, params.userId, {
          dealId: params.entityId,
          title: firstStep.title,
          priority: "high",
          source: "manual",
        });
      }
    }

    const activeRun: WorkflowRun = {
      id: runId,
      tenantId: params.tenantId,
      workflowId: params.workflowId,
      entityId: params.entityId,
      currentStep: 1,
      status: "running",
      startedAt: new Date().toISOString(),
    };
    this.workflowRuns.set(runId, activeRun);
    return activeRun;
  }

  /**
   * Gera proposta comercial a partir dos dados do Deal
   */
  public generateProposal(params: {
    tenantId: TenantId;
    userId: UserId;
    dealId: string;
    title: string;
    templateId: string;
  }): ProposalDocument {
    const deal = this.crmService.getDeal(params.tenantId, params.dealId);

    const proposalId = `prop_${randomUUID()}`;
    const proposal: ProposalDocument = {
      id: proposalId,
      tenantId: params.tenantId,
      dealId: params.dealId,
      title: params.title,
      templateId: params.templateId,
      contentMarkdown: `# Proposta Comercial: ${params.title}\n\n**Valor Total:** ${deal.currency} ${deal.value.toLocaleString("pt-BR")}\n\nTermos contratuais vinculados à oportunidade #${deal.id}.`,
      totalValue: deal.value,
      currency: deal.currency,
      status: "draft",
      generatedBy: params.userId,
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(proposalId, proposal);
    return proposal;
  }

  public getProposal(tenantId: TenantId, proposalId: string): ProposalDocument {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error("Proposta não encontrada");
    if (proposal.tenantId !== tenantId) {
      throw new CrossTenantViolationError("Acesso negado: a proposta pertence a outro tenant");
    }
    return proposal;
  }
}
