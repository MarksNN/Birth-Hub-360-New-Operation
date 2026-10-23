import React from "react";
import { Button } from "./Button.js";
import { Badge } from "./Badge.js";
import { Card } from "./Card.js";

export interface ApprovalPanelProps {
  agentName: string;
  autonomyLevel: "A0" | "A1" | "A2" | "A3" | "A4";
  title: string;
  recommendation: string;
  evidence: string;
  estimatedCostBrl?: number;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  agentName,
  autonomyLevel,
  title,
  recommendation,
  evidence,
  estimatedCostBrl,
  onApprove,
  onReject,
  isProcessing = false
}) => {
  return (
    <Card elevated className="bh-approval-panel" role="region" aria-label="Painel de Aprovação de Ação do Copilot">
      <div className="bh-approval-header">
        <div className="bh-approval-meta">
          <Badge variant="info">{agentName}</Badge>
          <Badge variant="neutral">Nível {autonomyLevel}</Badge>
          {estimatedCostBrl !== undefined && (
            <span className="bh-approval-cost" aria-label="Custo estimado de IA">
              Custo est.: R$ {estimatedCostBrl.toFixed(3)}
            </span>
          )}
        </div>
        <h3 className="bh-approval-title">{title}</h3>
      </div>

      <div className="bh-approval-body">
        <div className="bh-approval-section">
          <span className="bh-approval-label">Recomendação do Copilot:</span>
          <p className="bh-approval-text">{recommendation}</p>
        </div>

        <div className="bh-approval-section bh-approval-evidence">
          <span className="bh-approval-label">Evidência Histórica:</span>
          <p className="bh-approval-subtext">{evidence}</p>
        </div>
      </div>

      <div className="bh-approval-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={onReject}
          disabled={isProcessing}
        >
          Descartar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onApprove}
          isLoading={isProcessing}
        >
          Aprovar Ação (1-Clique)
        </Button>
      </div>
    </Card>
  );
};
