# Especificação de Tokens e Componentes do Design System

**Onda:** W03 — Design System e Workspace  
**Data:** 23/10/2026  
**Status:** Implementado  

---

## 1. Pacote Central `@birthub/design-system`

O pacote desacoplado `@birthub/design-system` provê a biblioteca de componentes visuais do ecossistema Birthub 360:

- **`Button`:** Variantes `primary` (neon blue com hover brilhante), `secondary` (superfície elevada com borda), `danger` e `ghost`. Estados de carregamento com `aria-busy` e spinner acessível.
- **`Badge`:** Indicadores de estado (`info`, `success`, `warning`, `danger`, `neutral`) com contraste auditado.
- **`Card`:** Superfície de agrupamento com borda sutil e elevação com sombra suave.
- **`ApprovalPanel`:** Componente human-in-the-loop para avaliação de sugestões de IA, exibindo agente autor, nível de autonomia (A0–A4), evidência histórica e custo estimado em Reais (BRL).

---

## 2. Workspace Shell (`WorkspacePage`)

O shell da aplicação web implementa as 5 superfícies operacionais definidas na estratégia de UX:

1. **Hoje:** Radar de oportunidades estagnadas, sugestões com aprovação rápida e métricas operacionais do dia.
2. **Relacionamentos:** Empresas, contatos e stakeholders (base para W04).
3. **Negócios:** Pipelines com múltiplos estágios e valores (base para W04).
4. **Inteligência:** Radar de riscos, ICP Fit e previsibilidade (base para W06).
5. **Automações:** Agentes especializados, cadências e fluxos com aprovação (base para W07/W08).
