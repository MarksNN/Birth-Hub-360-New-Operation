import { createHash, randomUUID } from "node:crypto";
import type {
  AgentRun,
  AgentType,
  AutonomyLevel,
  TenantId,
  UserId,
} from "@birthub/contracts";
import {
  ModelGateway,
  PolicyEngine,
  ToolRegistry,
} from "@birthub/ai-runtime";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export interface ApprovalRequest {
  id: string;
  tenantId: TenantId;
  runId: string;
  toolName: string;
  toolParams: Record<string, unknown>;
  justification: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: UserId;
  resolvedBy?: UserId;
  resolvedAt?: string;
  createdAt: string;
}

export interface CostLedgerEntry {
  id: string;
  tenantId: TenantId;
  runId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalCostBrl: number;
  createdAt: string;
}

export class CopilotService {
  private runs = new Map<string, AgentRun>();
  private approvals = new Map<string, ApprovalRequest>();
  private costLedger: CostLedgerEntry[] = [];

  private toolRegistry = new ToolRegistry();
  private policyEngine = new PolicyEngine();
  private modelGateway = new ModelGateway();

  /**
   * Executa um Agente com controle estrito de autonomia e governança
   */
  public async runAgent(params: {
    tenantId: TenantId;
    userId: UserId;
    agentType: AgentType;
    autonomyLevel: AutonomyLevel;
    goal: string;
    model?: string;
    targetTool?: string;
    toolParams?: Record<string, unknown>;
    idempotencyKey?: string;
  }): Promise<{ run: AgentRun; executionResult?: unknown; message: string }> {
    const runId = `run_${randomUUID()}`;
    const idempKey = params.idempotencyKey || `idemp_${randomUUID()}`;
    const promptHash = createHash("sha256").update(params.goal).digest("hex");

    // 1. Verificação de Ataque Adversarial / Prompt Injection
    const injectionCheck = this.policyEngine.inspectPromptInjection(params.goal);
    if (injectionCheck.isAdversarial) {
      const failedRun: AgentRun = {
        id: runId,
        tenantId: params.tenantId,
        agentType: params.agentType,
        autonomyLevel: params.autonomyLevel,
        goal: params.goal,
        model: params.model || "claude-3-5-sonnet",
        promptHash,
        requiresApproval: false,
        idempotencyKey: idempKey,
        status: "failed",
        outputSnippet: `Bloqueado por política de segurança: injeção de prompt detectada (${injectionCheck.matchedPattern}).`,
        createdAt: new Date().toISOString(),
      };
      this.runs.set(runId, failedRun);
      return { run: failedRun, message: failedRun.outputSnippet! };
    }

    // 2. Avaliação de Ferramenta & Autonomia
    let executionResult: unknown;
    let requiresApproval = false;
    let runStatus: AgentRun["status"] = "executed";

    if (params.targetTool) {
      const tool = this.toolRegistry.getTool(params.targetTool);
      if (!tool) {
        throw new Error(`Ferramenta '${params.targetTool}' não encontrada no ToolRegistry.`);
      }

      const policyDecision = this.policyEngine.evaluateToolExecution(params.autonomyLevel, tool);

      if (policyDecision.requiresApproval) {
        requiresApproval = true;
        runStatus = "pending";

        // Cria registro de aprovação humana necessária
        const approvalId = `appr_${randomUUID()}`;
        const approval: ApprovalRequest = {
          id: approvalId,
          tenantId: params.tenantId,
          runId,
          toolName: tool.name,
          toolParams: params.toolParams || {},
          justification: `Ação externa sensível '${tool.name}' requer autorização de nível A4.`,
          status: "pending",
          requestedBy: params.userId,
          createdAt: new Date().toISOString(),
        };
        this.approvals.set(approvalId, approval);
      } else if (!policyDecision.allowed) {
        const rejectedRun: AgentRun = {
          id: runId,
          tenantId: params.tenantId,
          agentType: params.agentType,
          autonomyLevel: params.autonomyLevel,
          goal: params.goal,
          model: params.model || "claude-3-5-sonnet",
          promptHash,
          requiresApproval: false,
          idempotencyKey: idempKey,
          status: "failed",
          outputSnippet: policyDecision.reason,
          createdAt: new Date().toISOString(),
        };
        this.runs.set(runId, rejectedRun);
        return { run: rejectedRun, message: policyDecision.reason };
      } else {
        // Executa ferramenta autorizada
        executionResult = await tool.execute(params.toolParams || {}, {
          tenantId: params.tenantId,
          userId: params.userId,
        });
      }
    }

    // 3. Execução do Gateway e FinOps de Tokens/Custo
    const completion = await this.modelGateway.complete({
      model: params.model,
      systemPrompt: `Agent: ${params.agentType}, Autonomy: ${params.autonomyLevel}`,
      userPrompt: params.goal,
      goal: params.goal,
    });

    const agentRun: AgentRun = {
      id: runId,
      tenantId: params.tenantId,
      agentType: params.agentType,
      autonomyLevel: params.autonomyLevel,
      goal: params.goal,
      model: completion.model,
      promptHash,
      tokensUsed: completion.tokensUsed,
      estimatedCostBrl: completion.estimatedCostBrl,
      requiresApproval,
      idempotencyKey: idempKey,
      status: runStatus,
      outputSnippet: requiresApproval
        ? "Execução pausada: ação sensível aguardando aprovação humana."
        : completion.content,
      createdAt: new Date().toISOString(),
    };

    this.runs.set(runId, agentRun);

    // Registra consumo no Ledger
    this.costLedger.push({
      id: `cost_${randomUUID()}`,
      tenantId: params.tenantId,
      runId,
      model: completion.model,
      promptTokens: completion.tokensUsed.prompt,
      completionTokens: completion.tokensUsed.completion,
      totalCostBrl: completion.estimatedCostBrl,
      createdAt: new Date().toISOString(),
    });

    return {
      run: agentRun,
      executionResult,
      message: agentRun.outputSnippet || "Agente executado com sucesso.",
    };
  }

  public getPendingApprovals(tenantId: TenantId): ApprovalRequest[] {
    return Array.from(this.approvals.values()).filter(
      (a) => a.tenantId === tenantId && a.status === "pending"
    );
  }

  public async resolveApproval(params: {
    approvalId: string;
    tenantId: TenantId;
    action: "approve" | "reject";
    userId: UserId;
  }): Promise<{ approval: ApprovalRequest; executionResult?: unknown }> {
    const approval = this.approvals.get(params.approvalId);
    if (!approval) throw new Error("Requisição de aprovação não encontrada");

    if (approval.tenantId !== params.tenantId) {
      throw new CrossTenantViolationError("Acesso negado: a aprovação pertence a outro tenant");
    }

    approval.status = params.action === "approve" ? "approved" : "rejected";
    approval.resolvedBy = params.userId;
    approval.resolvedAt = new Date().toISOString();

    const run = this.runs.get(approval.runId);
    let executionResult: unknown;

    if (run) {
      if (params.action === "approve") {
        run.status = "executed";
        run.approvedBy = params.userId;
        run.approvedAt = new Date().toISOString();

        // Agora executa a ferramenta com a aprovação humana concedida
        const tool = this.toolRegistry.getTool(approval.toolName);
        if (tool) {
          executionResult = await tool.execute(approval.toolParams, {
            tenantId: params.tenantId,
            userId: params.userId,
          });
          run.outputSnippet = `Ação aprovada e executada com sucesso: ${JSON.stringify(executionResult)}`;
        }
      } else {
        run.status = "rejected";
        run.outputSnippet = "Ação rejeitada pelo operador humano.";
      }
    }

    return { approval, executionResult };
  }

  public getCostLedger(tenantId: TenantId): CostLedgerEntry[] {
    return this.costLedger.filter((c) => c.tenantId === tenantId);
  }
}
