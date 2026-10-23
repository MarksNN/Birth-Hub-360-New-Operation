import React, { useState } from "react";
import { Button, Badge, Card, ApprovalPanel } from "@birthub/design-system";
import type { DealStage } from "@birthub/contracts";
import BrandMark from "../components/BrandMark";

type SurfaceTab = "today" | "relationships" | "deals" | "intelligence" | "automations";

interface MockDeal {
  id: string;
  title: string;
  companyName: string;
  value: number;
  stage: DealStage;
  healthScore: number;
  isStagnant: boolean;
}

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<SurfaceTab>("today");
  const [taskApproved, setTaskApproved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [deals, setDeals] = useState<MockDeal[]>([
    {
      id: "deal-1",
      title: "Contrato Anual Inteligência Operacional",
      companyName: "Alpha Logistics Brasil S/A",
      value: 120000,
      stage: "proposal_sent",
      healthScore: 78,
      isStagnant: true
    },
    {
      id: "deal-2",
      title: "Migração Cloud & Observabilidade 360",
      companyName: "InovaTech Soluções Cloud",
      value: 85000,
      stage: "qualification",
      healthScore: 92,
      isStagnant: false
    },
    {
      id: "deal-3",
      title: "Expansão Licenciamento RevOps",
      companyName: "Varejo Express Nacional",
      value: 45000,
      stage: "negotiation",
      healthScore: 84,
      isStagnant: false
    }
  ]);

  const handleApprove = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setTaskApproved(true);
    }, 600);
  };

  const handleReject = () => {
    setTaskApproved(false);
  };

  const handleMoveStage = (dealId: string, nextStage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: nextStage, isStagnant: false } : d))
    );
  };

  const pipelineStages: { stage: DealStage; label: string }[] = [
    { stage: "lead", label: "Leads" },
    { stage: "qualification", label: "Qualificação" },
    { stage: "meeting_scheduled", label: "Reunião Agendada" },
    { stage: "proposal_sent", label: "Proposta Enviada" },
    { stage: "negotiation", label: "Negociação" },
    { stage: "closed_won", label: "Ganhos (Won)" }
  ];

  return (
    <div className="bh-workspace-shell">
      {/* Link de Pulo Acessível (WCAG 2.2 AA) */}
      <a href="#main-content" className="bh-skip-link">
        Pular para o conteúdo principal
      </a>

      {/* Topbar Operacional */}
      <header className="bh-topbar" role="banner">
        <div className="bh-topbar-left">
          <BrandMark />
          <div className="bh-topbar-title">
            <span className="bh-topbar-org">Empresa Alpha Corp</span>
            <Badge variant="info" size="sm">Workspace Ativo</Badge>
          </div>
        </div>

        <nav className="bh-topbar-nav" aria-label="Navegação Principal do Workspace">
          <button
            type="button"
            className={`bh-nav-item ${activeTab === "today" ? "is-active" : ""}`}
            onClick={() => setActiveTab("today")}
            aria-current={activeTab === "today" ? "page" : undefined}
          >
            Hoje
          </button>
          <button
            type="button"
            className={`bh-nav-item ${activeTab === "relationships" ? "is-active" : ""}`}
            onClick={() => setActiveTab("relationships")}
            aria-current={activeTab === "relationships" ? "page" : undefined}
          >
            Relacionamentos
          </button>
          <button
            type="button"
            className={`bh-nav-item ${activeTab === "deals" ? "is-active" : ""}`}
            onClick={() => setActiveTab("deals")}
            aria-current={activeTab === "deals" ? "page" : undefined}
          >
            Negócios
          </button>
          <button
            type="button"
            className={`bh-nav-item ${activeTab === "intelligence" ? "is-active" : ""}`}
            onClick={() => setActiveTab("intelligence")}
            aria-current={activeTab === "intelligence" ? "page" : undefined}
          >
            Inteligência
          </button>
          <button
            type="button"
            className={`bh-nav-item ${activeTab === "automations" ? "is-active" : ""}`}
            onClick={() => setActiveTab("automations")}
            aria-current={activeTab === "automations" ? "page" : undefined}
          >
            Automações
          </button>
        </nav>

        <div className="bh-topbar-right">
          <span className="bh-user-badge">Carlos Admin</span>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")}>
            Sair
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main id="main-content" className="bh-main-content" tabIndex={-1}>
        {activeTab === "today" && (
          <div className="bh-surface-grid">
            <div className="bh-surface-column">
              <div className="bh-section-header">
                <h2>Radar de Oportunidades</h2>
                <Badge variant="warning">1 Ação Crítica Requer Atenção</Badge>
              </div>

              {taskApproved ? (
                <Card elevated className="bh-success-card">
                  <Badge variant="success">Ação Aprovada com Sucesso</Badge>
                  <h3>Tarefa Criada no Birthub & Sincronizada no Bitrix24</h3>
                  <p>
                    A tarefa de follow-up com o decisor João Silva foi agendada para amanhã às 10:00.
                    O evento de auditoria foi registrado com hash imutável.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => setTaskApproved(false)}>
                    Restaurar Demonstração
                  </Button>
                </Card>
              ) : (
                <ApprovalPanel
                  agentName="Sales Copilot"
                  autonomyLevel="A1"
                  title="Oportunidade Estagnada: Acordo Anual Alpha Logistics"
                  recommendation="Agendar follow-up direcionado ao decisor João Silva abordando a dúvida sobre SLA discutida na reunião técnica."
                  evidence="Proposta enviada há 11 dias sem interação no Bitrix24; histórico sinaliza probabilidade de perda em 4 dias sem contato."
                  estimatedCostBrl={0.012}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={isProcessing}
                />
              )}
            </div>

            <div className="bh-surface-column">
              <div className="bh-section-header">
                <h2>Resumo Operacional</h2>
                <Badge variant="neutral">Tempo Real</Badge>
              </div>

              <div className="bh-metrics-row">
                <Card className="bh-metric-card">
                  <span className="bh-metric-label">Pipeline Ativo</span>
                  <strong className="bh-metric-value">R$ 250.000</strong>
                  <span className="bh-metric-note">3 oportunidades monitoradas</span>
                </Card>

                <Card className="bh-metric-card">
                  <span className="bh-metric-label">Ações Concluídas Hoje</span>
                  <strong className="bh-metric-value">6 / 8</strong>
                  <span className="bh-metric-note">Taxa de aceitação IA: 85%</span>
                </Card>
              </div>

              <Card className="bh-info-card" style={{ marginTop: "1rem" }}>
                <h3>Conexão CRM: Bitrix24 Ativo</h3>
                <p>Modo Leitura e Reconciliação Habilitado. Última sincronização há 4 minutos.</p>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "deals" && (
          <div className="bh-pipeline-surface">
            <div className="bh-section-header">
              <div>
                <h2>Funil de Vendas e Oportunidades (Pipeline 360°)</h2>
                <p style={{ color: "#B8C1DE", margin: "0.25rem 0 0" }}>
                  Gestão visual de estágios com isolamento multi-tenant fail-closed.
                </p>
              </div>
              <Badge variant="info">3 Oportunidades Ativas</Badge>
            </div>

            <div className="bh-pipeline-board" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
              {pipelineStages.map(({ stage, label }) => {
                const stageDeals = deals.filter((d) => d.stage === stage);
                const total = stageDeals.reduce((sum, d) => sum + d.value, 0);

                return (
                  <div key={stage} style={{ background: "#101423", border: "1px solid #2A3352", borderRadius: "8px", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <strong style={{ fontSize: "0.9rem", color: "#FFF" }}>{label}</strong>
                      <Badge variant="neutral" size="sm">{stageDeals.length}</Badge>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#00E5FF", fontWeight: 600, marginBottom: "1rem" }}>
                      R$ {total.toLocaleString("pt-BR")}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {stageDeals.map((deal) => (
                        <Card key={deal.id} elevated style={{ padding: "0.75rem", borderLeft: deal.isStagnant ? "3px solid #FFB800" : "3px solid #00E5FF" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#FFF", marginBottom: "0.25rem" }}>{deal.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "#B8C1DE", marginBottom: "0.5rem" }}>{deal.companyName}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#00E5FF" }}>R$ {deal.value.toLocaleString("pt-BR")}</span>
                            {deal.stage === "proposal_sent" && (
                              <Button variant="primary" size="sm" onClick={() => handleMoveStage(deal.id, "closed_won")}>
                                Fechar Ganho
                              </Button>
                            )}
                            {deal.stage === "qualification" && (
                              <Button variant="secondary" size="sm" onClick={() => handleMoveStage(deal.id, "proposal_sent")}>
                                Enviar Proposta
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "relationships" && (
          <div className="bh-relationships-surface">
            <div className="bh-section-header">
              <h2>Empresas e Contatos 360°</h2>
              <Badge variant="info">Módulo CRM</Badge>
            </div>
            <Card style={{ marginTop: "1rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", color: "#F2F5FF" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2A3352", color: "#B8C1DE", fontSize: "0.85rem" }}>
                    <th style={{ padding: "0.75rem" }}>Empresa</th>
                    <th style={{ padding: "0.75rem" }}>Contato Principal</th>
                    <th style={{ padding: "0.75rem" }}>Setor</th>
                    <th style={{ padding: "0.75rem" }}>Origem</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #1C2339" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>Alpha Logistics Brasil S/A</td>
                    <td style={{ padding: "0.75rem" }}>João Silva (Diretor Operações)</td>
                    <td style={{ padding: "0.75rem" }}>Logística</td>
                    <td style={{ padding: "0.75rem" }}><Badge variant="neutral" size="sm">Bitrix24</Badge></td>
                    <td style={{ padding: "0.75rem" }}><Badge variant="warning" size="sm">Estagnado</Badge></td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #1C2339" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>InovaTech Soluções Cloud</td>
                    <td style={{ padding: "0.75rem" }}>Mariana Alencar (Head Infra)</td>
                    <td style={{ padding: "0.75rem" }}>Tecnologia</td>
                    <td style={{ padding: "0.75rem" }}><Badge variant="neutral" size="sm">Manual</Badge></td>
                    <td style={{ padding: "0.75rem" }}><Badge variant="success" size="sm">Ativo</Badge></td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === "intelligence" && (
          <Card className="bh-empty-surface">
            <h2>Superfície: INTELIGÊNCIA COMERCIAL</h2>
            <p>Módulo reservado para a Onda W06 (ICP Fit, Sinais de Risco e Previsibilidade).</p>
          </Card>
        )}

        {activeTab === "automations" && (
          <Card className="bh-empty-surface">
            <h2>Superfície: AUTOMAÇÕES E AGENTES</h2>
            <p>Módulo reservado para as Ondas W07 e W08 (Copiloto, Agentes e Cadências).</p>
          </Card>
        )}
      </main>
    </div>
  );
}
