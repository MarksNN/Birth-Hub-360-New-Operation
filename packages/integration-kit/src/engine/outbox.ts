import type {
  OutboxEvent,
  OutboxStatus,
  TenantId,
} from "@birthub/contracts";
import { randomUUID } from "node:crypto";

export interface CreateOutboxEventParams {
  tenantId: TenantId;
  eventType: string;
  aggregateType: "company" | "contact" | "deal" | "task" | "integration";
  aggregateId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  maxRetries?: number;
}

export class OutboxProcessor {
  private events: OutboxEvent[] = [];

  /**
   * Enfileira evento no padrão transacional Outbox
   */
  public enqueue(params: CreateOutboxEventParams): OutboxEvent {
    const event: OutboxEvent = {
      id: `evt_${randomUUID()}`,
      tenantId: params.tenantId,
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      payload: params.payload,
      status: "pending",
      retryCount: 0,
      maxRetries: params.maxRetries ?? 3,
      idempotencyKey: params.idempotencyKey || `idemp_${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };

    this.events.push(event);
    return event;
  }

  /**
   * Processa eventos pendentes com política de retry e Dead-Letter Queue (DLQ)
   */
  public async processPending(
    handler: (event: OutboxEvent) => Promise<boolean>
  ): Promise<{ processed: number; failed: number; sentToDlq: number }> {
    let processed = 0;
    let failed = 0;
    let sentToDlq = 0;

    const pending = this.events.filter((e) => e.status === "pending" || e.status === "failed");

    for (const evt of pending) {
      try {
        const success = await handler(evt);
        if (success) {
          evt.status = "processed";
          evt.processedAt = new Date().toISOString();
          processed++;
        } else {
          throw new Error("Handler reported unsuccessful execution");
        }
      } catch (err: unknown) {
        failed++;
        evt.retryCount++;
        evt.lastError = err instanceof Error ? err.message : String(err);

        if (evt.retryCount >= evt.maxRetries) {
          evt.status = "dead_letter";
          sentToDlq++;
        } else {
          evt.status = "failed";
        }
      }
    }

    return { processed, failed, sentToDlq };
  }

  public getEventsByTenant(tenantId: TenantId): OutboxEvent[] {
    return this.events.filter((e) => e.tenantId === tenantId);
  }

  public getDeadLetters(tenantId: TenantId): OutboxEvent[] {
    return this.events.filter((e) => e.tenantId === tenantId && e.status === "dead_letter");
  }
}
