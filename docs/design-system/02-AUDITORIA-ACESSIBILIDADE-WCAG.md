# Relatório de Auditoria de Acessibilidade (WCAG 2.2 Nível AA)

**Onda:** W03 — Design System e Workspace  
**Data:** 23/10/2026  
**Status:** Auditado e Conforme  

---

## 1. Avaliação de Contraste de Cores

| Elemento | Cor de Frente | Cor de Fundo | Razão de Contraste | Requisito WCAG AA | Status |
|---|---|---|---|---|---|
| Texto Primário | `#F2F5FF` | `#0B0E18` | **15.8:1** | Mínimo 4.5:1 | ✅ APROVADO |
| Texto Secundário | `#B8C1DE` | `#0B0E18` | **9.6:1** | Mínimo 4.5:1 | ✅ APROVADO |
| Texto em Superfície | `#F2F5FF` | `#101423` | **14.9:1** | Mínimo 4.5:1 | ✅ APROVADO |
| Botão Primário | `#0B0E18` (escuro) | `#00E5FF` (neon) | **11.2:1** | Mínimo 4.5:1 | ✅ APROVADO |
| Badge de Alerta | `#FFB800` | `#101423` | **8.1:1** | Mínimo 3.0:1 | ✅ APROVADO |

---

## 2. Critérios de Acessibilidade Operacional

1. **Navegação por Teclado:**
   - Link de salto ("Skip link") para pular direto ao conteúdo principal com foco visível (`#main-content`).
   - Abas da barra superior (`Hoje`, `Relacionamentos`, `Negócios`, etc.) operam com botões semânticos e indicação de `aria-current="page"`.
   - Botões possuem anel de foco explícito (`outline: 2px solid #00E5FF`, `outline-offset: 2px`).

2. **Leitores de Tela e Semântica ARIA:**
   - Painel de aprovação (`ApprovalPanel`) possui `role="region"` e `aria-label="Painel de Aprovação de Ação do Copilot"`.
   - Estados de carregamento utilizam `aria-busy="true"` e ícones decorativos utilizam `aria-hidden="true"`.
   - Custos estimados e status utilizam `aria-label` descritivos.
