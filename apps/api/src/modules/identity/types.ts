import type { TenantId, UserId, UserRole, Organization, User } from "@birthub/contracts";

export interface TenantContext {
  id: TenantId;
  name: string;
  slug: string;
}

export interface UserContext {
  id: UserId;
  tenantId: TenantId;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  tenant: TenantContext;
  user: UserContext;
  expiresAt: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: TenantId;
  actorId: UserId;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
