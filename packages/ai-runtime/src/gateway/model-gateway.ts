export interface ModelResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCostBrl: number;
  model: string;
}

export class ModelGateway {
  // Preço de referência por 1k tokens: R$ 0,015 prompt / R$ 0,045 completion
  private pricePer1kPrompt = 0.015;
  private pricePer1kCompletion = 0.045;

  public async complete(params: {
    model?: string;
    systemPrompt: string;
    userPrompt: string;
    goal: string;
  }): Promise<ModelResponse> {
    const model = params.model || "claude-3-5-sonnet";

    const promptTokens = Math.max(50, Math.ceil((params.systemPrompt.length + params.userPrompt.length) / 4));
    const completionTokens = Math.max(40, Math.ceil(params.goal.length / 3));
    const totalTokens = promptTokens + completionTokens;

    const costBrl = (promptTokens / 1000) * this.pricePer1kPrompt + (completionTokens / 1000) * this.pricePer1kCompletion;

    return {
      content: `[Copilot Analysis] Recomendação executiva gerada para o objetivo: ${params.goal}. Contexto validado com segurança.`,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens,
      },
      estimatedCostBrl: Math.round(costBrl * 10000) / 10000,
      model,
    };
  }
}
