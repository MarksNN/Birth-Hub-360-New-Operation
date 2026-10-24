import type { AutonomyLevel } from "@birthub/contracts";

export type ToolCategory = "read_only" | "draft" | "internal_write" | "sensitive_external_write";

export interface ToolDefinition<TParams = Record<string, unknown>, TResult = unknown> {
  name: string;
  description: string;
  category: ToolCategory;
  minimumAutonomy: AutonomyLevel;
  requiresHumanApproval: boolean;
  execute: (params: TParams, context: { tenantId: string; userId: string }) => Promise<TResult>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition<any, any>>();

  constructor() {
    this.registerDefaultTools();
  }

  public registerTool<P, R>(tool: ToolDefinition<P, R>): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  private registerDefaultTools() {
    // 1. Ferramenta de Leitura de Contexto (A2)
    this.registerTool({
      name: "search_crm_context",
      description: "Pesquisa contas, contatos e histórico de oportunidades no CRM",
      category: "read_only",
      minimumAutonomy: "A2",
      requiresHumanApproval: false,
      execute: async (params: { query: string }) => {
        return { matchesFound: 2, summary: `Resultados CRM para '${params.query}' encontrados com sucesso.` };
      },
    });

    // 2. Ferramenta de Rascunho de E-mail de Follow-up (A1)
    this.registerTool({
      name: "draft_followup_email",
      description: "Gera rascunho de mensagem comercial baseada nos sinais do negócio sem enviar",
      category: "draft",
      minimumAutonomy: "A1",
      requiresHumanApproval: false,
      execute: async (params: { dealTitle: string; value: number }) => {
        return {
          draftSubject: `Alinhamento de Próximos Passos — ${params.dealTitle}`,
          draftBody: `Olá, identificamos que a oportunidade ${params.dealTitle} está pronta para avanço.`,
        };
      },
    });

    // 3. Ferramenta de Escrita Interna de Tarefa (A3)
    this.registerTool({
      name: "create_internal_task",
      description: "Cria tarefa interna no CRM sem disparar comunicações externas",
      category: "internal_write",
      minimumAutonomy: "A3",
      requiresHumanApproval: false,
      execute: async (params: { title: string; dealId?: string }) => {
        return { taskId: "task_generated_internal", status: "created", title: params.title };
      },
    });

    // 4. Ferramenta Sensível Externa: Envio de Proposta / Comunicação Externa (A4 - Aprovação Obrigatória)
    this.registerTool({
      name: "send_external_outreach",
      description: "Dispara e-mail ou notificação externa real para o tomador de decisão",
      category: "sensitive_external_write",
      minimumAutonomy: "A4",
      requiresHumanApproval: true,
      execute: async (params: { recipientEmail: string; message: string }) => {
        return { messageId: "msg_sent_external_001", recipient: params.recipientEmail, sent: true };
      },
    });
  }
}
