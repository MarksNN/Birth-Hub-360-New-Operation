import type {
  ConflictResolution,
  IntegrationProvider,
  SyncConflict,
  TenantId,
  UserId,
} from "@birthub/contracts";
import { randomUUID } from "node:crypto";

export interface FieldComparison {
  fieldName: string;
  localValue: unknown;
  externalValue: unknown;
}

export class ConflictResolutionEngine {
  private conflicts: SyncConflict[] = [];

  /**
   * Avalia divergência entre entidade local e externa.
   * Se os valores de campos críticos diferem e a entidade local foi modificada mais recentemente,
   * registra um conflito explícito em vez de sobrescrever silenciosamente.
   */
  public evaluateConflict(params: {
    tenantId: TenantId;
    provider: IntegrationProvider;
    entityType: "company" | "contact" | "deal" | "task";
    localId: string;
    externalId: string;
    comparisons: FieldComparison[];
  }): SyncConflict[] {
    const detected: SyncConflict[] = [];

    for (const comp of params.comparisons) {
      if (
        comp.localValue !== undefined &&
        comp.externalValue !== undefined &&
        String(comp.localValue).trim() !== String(comp.externalValue).trim()
      ) {
        const conflict: SyncConflict = {
          id: `conflict_${randomUUID()}`,
          tenantId: params.tenantId,
          provider: params.provider,
          entityType: params.entityType,
          localId: params.localId,
          externalId: params.externalId,
          fieldName: comp.fieldName,
          localValue: comp.localValue,
          externalValue: comp.externalValue,
          resolution: "pending",
          createdAt: new Date().toISOString(),
        };
        detected.push(conflict);
        this.conflicts.push(conflict);
      }
    }

    return detected;
  }

  public getPendingConflicts(tenantId: TenantId): SyncConflict[] {
    return this.conflicts.filter((c) => c.tenantId === tenantId && c.resolution === "pending");
  }

  public resolveConflict(
    conflictId: string,
    tenantId: TenantId,
    resolution: ConflictResolution,
    userId: UserId
  ): SyncConflict | null {
    const conflict = this.conflicts.find((c) => c.id === conflictId && c.tenantId === tenantId);
    if (!conflict) return null;

    conflict.resolution = resolution;
    conflict.resolvedBy = userId;
    conflict.resolvedAt = new Date().toISOString();
    return conflict;
  }
}
