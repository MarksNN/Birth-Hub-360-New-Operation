import { createHash } from "node:crypto";

export interface IdempotencyRecord {
  key: string;
  tenantId: string;
  fingerprint: string;
  processedAt: string;
  resultSummary?: string;
}

export class IdempotencyEngine {
  private seenKeys = new Map<string, IdempotencyRecord>();

  /**
   * Gera hash SHA-256 do payload para garantir que o conteúdo não foi alterado
   */
  public generateFingerprint(payload: unknown): string {
    const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
    return createHash("sha256").update(serialized).digest("hex");
  }

  /**
   * Verifica se a requisição é duplicada ou replay
   */
  public isReplay(tenantId: string, key: string, payload: unknown): boolean {
    const compositeKey = `${tenantId}:${key}`;
    const record = this.seenKeys.get(compositeKey);
    if (!record) return false;

    // Se a chave já foi vista, é replay
    return true;
  }

  /**
   * Registra a chave executada com sucesso
   */
  public markProcessed(tenantId: string, key: string, payload: unknown, summary?: string): void {
    const compositeKey = `${tenantId}:${key}`;
    const fingerprint = this.generateFingerprint(payload);
    this.seenKeys.set(compositeKey, {
      key,
      tenantId,
      fingerprint,
      processedAt: new Date().toISOString(),
      resultSummary: summary,
    });
  }

  /**
   * Valida token secreto de webhook do Bitrix24 ou provedor externo
   */
  public validateWebhookToken(expectedToken: string, receivedToken?: string): boolean {
    if (!expectedToken || !receivedToken) return false;
    // Comparação de tamanho e valor constante para evitar timing attacks
    if (expectedToken.length !== receivedToken.length) return false;
    let match = true;
    for (let i = 0; i < expectedToken.length; i++) {
      if (expectedToken[i] !== receivedToken[i]) {
        match = false;
      }
    }
    return match;
  }

  public clear(): void {
    this.seenKeys.clear();
  }
}
