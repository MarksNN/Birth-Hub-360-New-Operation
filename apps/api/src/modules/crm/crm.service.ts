import { randomUUID } from "node:crypto";
import type {
  TenantId,
  UserId,
  Company,
  Contact,
  Deal,
  DealStage,
  Task,
  TaskPriority,
  TaskStatus
} from "@birthub/contracts";
import { CrossTenantViolationError } from "../identity/identity.service.js";

export class CrmService {
  private companies = new Map<string, Company>();
  private contacts = new Map<string, Contact>();
  private deals = new Map<string, Deal>();
  private tasks = new Map<string, Task>();

  constructor() {
    this.seedInitialCrmData();
  }

  private seedInitialCrmData() {
    // Seed para o Tenant Alpha
    const tenantId = "tenant-alpha-001";
    const companyId = "comp-logistics-01";
    this.companies.set(companyId, {
      id: companyId,
      tenantId,
      name: "Alpha Logistics Brasil S/A",
      domain: "alphalogistics.com.br",
      industry: "Logística & Transporte",
      employeeCount: 450,
      source: "manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const contactId = "cont-joao-01";
    this.contacts.set(contactId, {
      id: contactId,
      tenantId,
      companyId,
      name: "João Silva",
      email: "joao.silva@alphalogistics.com.br",
      phone: "+55 11 98765-4321",
      title: "Diretor de Operações",
      source: "manual",
      createdAt: new Date().toISOString()
    });

    const dealId = "deal-logistics-annual-01";
    this.deals.set(dealId, {
      id: dealId,
      tenantId,
      companyId,
      contactId,
      ownerId: "user-alpha-sales",
      title: "Contrato Anual Inteligência Operacional",
      value: 120000,
      currency: "BRL",
      stage: "proposal_sent",
      healthScore: 78,
      isStagnant: true,
      lastActivityAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      source: "bitrix24",
      externalId: "bitrix_deal_8921",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // ==========================================
  // Empresas (Companies)
  // ==========================================

  public createCompany(
    tenantId: TenantId,
    data: { name: string; domain?: string; industry?: string; employeeCount?: number; source?: string }
  ): Company {
    const id = `comp_${randomUUID()}`;
    const company: Company = {
      id,
      tenantId,
      name: data.name,
      domain: data.domain,
      industry: data.industry,
      employeeCount: data.employeeCount,
      source: data.source ?? "manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.companies.set(id, company);
    return company;
  }

  public listCompanies(tenantId: TenantId): Company[] {
    return Array.from(this.companies.values()).filter((c) => c.tenantId === tenantId);
  }

  public getCompany(tenantId: TenantId, companyId: string): Company {
    const company = this.companies.get(companyId);
    if (!company) throw new Error("Empresa não encontrada");
    if (company.tenantId !== tenantId) {
      throw new CrossTenantViolationError("Acesso negado: a empresa pertence a outro tenant");
    }
    return company;
  }

  // ==========================================
  // Contatos (Contacts)
  // ==========================================

  public createContact(
    tenantId: TenantId,
    data: { companyId?: string; name: string; email?: string; phone?: string; title?: string; source?: string }
  ): Contact {
    if (data.companyId) {
      // Valida se a empresa pertence ao mesmo tenant
      this.getCompany(tenantId, data.companyId);
    }

    const id = `cont_${randomUUID()}`;
    const contact: Contact = {
      id,
      tenantId,
      companyId: data.companyId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      title: data.title,
      source: data.source ?? "manual",
      createdAt: new Date().toISOString()
    };
    this.contacts.set(id, contact);
    return contact;
  }

  public listContacts(tenantId: TenantId, companyId?: string): Contact[] {
    return Array.from(this.contacts.values()).filter((c) => {
      if (c.tenantId !== tenantId) return false;
      if (companyId && c.companyId !== companyId) return false;
      return true;
    });
  }

  // ==========================================
  // Oportunidades e Funil (Deals)
  // ==========================================

  public createDeal(
    tenantId: TenantId,
    ownerId: UserId,
    data: {
      companyId?: string;
      contactId?: string;
      title: string;
      value: number;
      currency?: string;
      stage?: DealStage;
      source?: string;
    }
  ): Deal {
    if (data.companyId) this.getCompany(tenantId, data.companyId);

    const id = `deal_${randomUUID()}`;
    const deal: Deal = {
      id,
      tenantId,
      companyId: data.companyId,
      contactId: data.contactId,
      ownerId,
      title: data.title,
      value: data.value,
      currency: data.currency ?? "BRL",
      stage: data.stage ?? "lead",
      healthScore: 85,
      isStagnant: false,
      lastActivityAt: new Date().toISOString(),
      source: data.source ?? "manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.deals.set(id, deal);
    return deal;
  }

  public listDeals(tenantId: TenantId, stage?: DealStage): Deal[] {
    return Array.from(this.deals.values()).filter((d) => {
      if (d.tenantId !== tenantId) return false;
      if (stage && d.stage !== stage) return false;
      return true;
    });
  }

  public getDeal(tenantId: TenantId, dealId: string): Deal {
    const deal = this.deals.get(dealId);
    if (!deal) throw new Error("Oportunidade não encontrada");
    if (deal.tenantId !== tenantId) {
      throw new CrossTenantViolationError("Acesso negado: a oportunidade pertence a outro tenant");
    }
    return deal;
  }

  public updateDealStage(tenantId: TenantId, dealId: string, newStage: DealStage): Deal {
    const deal = this.getDeal(tenantId, dealId);
    deal.stage = newStage;
    deal.updatedAt = new Date().toISOString();
    deal.lastActivityAt = new Date().toISOString();
    deal.isStagnant = false;
    this.deals.set(dealId, deal);
    return deal;
  }

  // ==========================================
  // Atividades e Tarefas (Tasks)
  // ==========================================

  public createTask(
    tenantId: TenantId,
    assignedTo: UserId,
    data: {
      dealId?: string;
      title: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: string;
      source?: "manual" | "ai_recommendation" | "sync_bitrix24";
    }
  ): Task {
    if (data.dealId) this.getDeal(tenantId, data.dealId);

    const id = `task_${randomUUID()}`;
    const task: Task = {
      id,
      tenantId,
      dealId: data.dealId,
      assignedTo,
      title: data.title,
      description: data.description,
      priority: data.priority ?? "medium",
      status: "pending",
      dueDate: data.dueDate,
      source: data.source ?? "manual",
      createdAt: new Date().toISOString()
    };
    this.tasks.set(id, task);

    // Atualiza última atividade da oportunidade
    if (data.dealId) {
      const deal = this.deals.get(data.dealId);
      if (deal) {
        deal.lastActivityAt = new Date().toISOString();
        deal.isStagnant = false;
      }
    }

    return task;
  }

  public listTasks(tenantId: TenantId, dealId?: string): Task[] {
    return Array.from(this.tasks.values()).filter((t) => {
      if (t.tenantId !== tenantId) return false;
      if (dealId && t.dealId !== dealId) return false;
      return true;
    });
  }

  public completeTask(tenantId: TenantId, taskId: string): Task {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error("Tarefa não encontrada");
    if (task.tenantId !== tenantId) {
      throw new CrossTenantViolationError("Acesso negado: a tarefa pertence a outro tenant");
    }
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    this.tasks.set(taskId, task);
    return task;
  }

  // ==========================================
  // Agregação de Pipeline (Métricas de Funil)
  // ==========================================

  public getPipelineSummary(tenantId: TenantId) {
    const deals = this.listDeals(tenantId);
    const stages: DealStage[] = [
      "lead",
      "qualification",
      "meeting_scheduled",
      "proposal_sent",
      "negotiation",
      "closed_won",
      "closed_lost"
    ];

    const summary = stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
      return {
        stage,
        count: stageDeals.length,
        totalValue,
        deals: stageDeals
      };
    });

    const activeDeals = deals.filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost");
    const activeValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

    return {
      totalDeals: deals.length,
      activeValue,
      stages: summary
    };
  }
}
