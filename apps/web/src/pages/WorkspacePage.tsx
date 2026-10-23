import React, { useState } from "react";
import { Button, Badge, Card, ApprovalPanel } from "@birthub/design-system";
import BrandMark from "../components/BrandMark";

type SurfaceTab = "today" | "relationships" | "deals" | "intelligence" | "automations";

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<SurfaceTab>("today");
  const [taskApproved, setTaskApproved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
                  <strong className="bh-metric-value">R$ 480.000</strong>
                  <span className="bh-metric-note">18 oportunidades em aberto</span>
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

        {activeTab !== "today" && (
          <Card className="bh-empty-surface">
            <h2>Superfície: {activeTab.toUpperCase()}</h2>
            <p>Módulo reservado para as ondas subseqüentes (W04 CRM, W06 Inteligência e W08 Automações).</p>
          </Card>
        )}
      </main>
    </div>
  );
}
