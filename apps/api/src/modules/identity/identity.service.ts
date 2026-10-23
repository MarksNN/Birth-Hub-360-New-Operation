import { randomUUID } from "node:crypto";
import type { TenantId, UserId, UserRole, Organization, User } from "@birthub/contracts";
import type { TenantContext, UserContext, AuthSession, AuditLogEntry } from "./types.js";

export class CrossTenantViolationError extends Error {
  constructor(message = "Cross-tenant access violation: resource belongs to a different organization") {
    super(message);
    this.name = "CrossTenantViolationError";
  }
}

export class IdentityService {
  private organizations = new Map<TenantId, Organization>();
  private users = new Map<UserId, User & { passwordHash: string }>();
  private auditLogs: AuditLogEntry[] = [];
  private sessions = new Map<string, { tenantId: TenantId; userId: UserId; expiresAt: Date }>();

  constructor() {
    this.seedDefaultTenants();
  }

  private seedDefaultTenants() {
    // Organização Alpha
    const orgAlphaId = "tenant-alpha-001";
    this.organizations.set(orgAlphaId, {
      id: orgAlphaId,
      name: "Empresa Alpha Corp",
      slug: "alpha-corp",
      plan: "growth",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const userAlphaAdminId = "user-alpha-admin";
    this.users.set(userAlphaAdminId, {
      id: userAlphaAdminId,
      tenantId: orgAlphaId,
      name: "Carlos Admin Alpha",
      email: "admin@alphacorp.com",
      role: "admin",
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: "hash_alpha_secret"
    });

    const userAlphaSalesId = "user-alpha-sales";
    this.users.set(userAlphaSalesId, {
      id: userAlphaSalesId,
      tenantId: orgAlphaId,
      name: "Beatriz Sales Alpha",
      email: "sales@alphacorp.com",
      role: "sales",
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: "hash_alpha_secret"
    });

    // Organização Beta (para testes adversariais cross-tenant)
    const orgBetaId = "tenant-beta-002";
    this.organizations.set(orgBetaId, {
      id: orgBetaId,
      name: "Beta Solutions Ltd",
      slug: "beta-solutions",
      plan: "starter",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const userBetaAdminId = "user-beta-admin";
    this.users.set(userBetaAdminId, {
      id: userBetaAdminId,
      tenantId: orgBetaId,
      name: "Roberto Admin Beta",
      email: "admin@betasolutions.com",
      role: "admin",
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: "hash_beta_secret"
    });
  }

  public authenticate(email: string, passwordPlain: string): AuthSession | null {
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.isActive
    );

    if (!user) return null;

    // Validação de senha: deve coincidir com passwordHash ou senhas dev conhecidas
    const isPasswordValid =
      passwordPlain === user.passwordHash ||
      (passwordPlain === "secret123") ||
      (passwordPlain === "admin123" && user.role === "admin");

    if (!isPasswordValid) return null;

    const org = this.organizations.get(user.tenantId);
    if (!org) return null;

    const token = `token_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    this.sessions.set(token, {
      tenantId: user.tenantId,
      userId: user.id,
      expiresAt
    });

    this.logAudit({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "USER_LOGIN_SUCCESS",
      resource: "auth_session",
      metadata: { email: user.email }
    });

    return {
      token,
      tenant: { id: org.id, name: org.name, slug: org.slug },
      user: { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role },
      expiresAt: expiresAt.toISOString()
    };
  }

  public getSession(token: string): { tenant: TenantContext; user: UserContext } | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    const org = this.organizations.get(session.tenantId);
    const user = this.users.get(session.userId);
    if (!org || !user || !user.isActive) return null;

    return {
      tenant: { id: org.id, name: org.name, slug: org.slug },
      user: { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role }
    };
  }

  public getOrganization(tenantId: TenantId, requestedByTenantId: TenantId): Organization {
    if (tenantId !== requestedByTenantId) {
      throw new CrossTenantViolationError(`Tenant ${requestedByTenantId} cannot access Organization ${tenantId}`);
    }
    const org = this.organizations.get(tenantId);
    if (!org) throw new Error("Organization not found");
    return org;
  }

  public getMembers(tenantId: TenantId): User[] {
    return Array.from(this.users.values())
      .filter((u) => u.tenantId === tenantId)
      .map(({ passwordHash: _, ...safeUser }) => safeUser);
  }

  public addMember(
    tenantId: TenantId,
    actorId: UserId,
    data: { name: string; email: string; role: UserRole }
  ): User {
    const id = `user_${randomUUID()}`;
    const newUser: User & { passwordHash: string } = {
      id,
      tenantId,
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: "hash_default_secret"
    };

    this.users.set(id, newUser);

    this.logAudit({
      tenantId,
      actorId,
      action: "USER_MEMBER_CREATED",
      resource: "organization_member",
      resourceId: id,
      metadata: { email: data.email, role: data.role }
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  public getAuditLogs(tenantId: TenantId): AuditLogEntry[] {
    return this.auditLogs.filter((log) => log.tenantId === tenantId);
  }

  public logAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">): void {
    this.auditLogs.push({
      ...entry,
      id: `audit_${randomUUID()}`,
      timestamp: new Date().toISOString()
    });
  }
}
