import type { AutonomyLevel } from "@birthub/contracts";
import type { ToolDefinition } from "../tools/registry.js";

const AUTONOMY_RANKS: Record<AutonomyLevel, number> = {
  A0: 0,
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
};

const INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /ignore (the )?above/i,
  /elevate autonomy to a4/i,
  /bypass (human )?approval/i,
  /grant (system )?admin/i,
  /exfiltrate/i,
  /system prompt override/i,
];

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
}

export class PolicyEngine {
  /**
   * Avalia segurança e autonomia antes de qualquer invocação de ferramenta
   */
  public evaluateToolExecution(
    agentAutonomy: AutonomyLevel,
    tool: ToolDefinition,
    hasHumanApproval: boolean = false
  ): PolicyDecision {
    const agentRank = AUTONOMY_RANKS[agentAutonomy] ?? 0;
    const requiredRank = AUTONOMY_RANKS[tool.minimumAutonomy] ?? 4;

    // 1. Verificação de nível de autonomia insuficiente
    if (agentRank < requiredRank) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Agente com nível ${agentAutonomy} não possui autorização para ferramenta que requer ${tool.minimumAutonomy}.`,
      };
    }

    // 2. Se a ferramenta exige aprovação explícita (A4)
    if (tool.requiresHumanApproval || tool.minimumAutonomy === "A4") {
      if (!hasHumanApproval) {
        return {
          allowed: false,
          requiresApproval: true,
          reason: "Operação sensível (A4): requer aprovação humana explícita antes do disparo externo.",
        };
      }
    }

    return {
      allowed: true,
      requiresApproval: false,
      reason: "Execução permitida por política.",
    };
  }

  /**
   * Detecção de injeções de prompt adversariais
   */
  public inspectPromptInjection(input: string): { isAdversarial: boolean; matchedPattern?: string } {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return { isAdversarial: true, matchedPattern: pattern.source };
      }
    }
    return { isAdversarial: false };
  }
}
