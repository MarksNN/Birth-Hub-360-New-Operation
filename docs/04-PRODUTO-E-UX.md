# Produto, informação e experiência

## Estratégia UX

Uma única operação comercial inteligível: **Hoje**, **Relacionamentos**, **Negócios**, **Inteligência**, **Automações**. Configurações e administração ficam em navegação secundária.

### Principais superfícies

- **Hoje:** agenda, follow-ups vencidos, riscos, tarefas, sugestões de IA e próximos passos com evidência.
- **Relacionamentos:** empresas/contatos, visão 360°, stakeholders, enriquecimento e histórico.
- **Negócios:** pipelines editáveis, estágios, próximos passos, forecast e propostas.
- **Inteligência:** saúde do pipeline, ICP, sinais, tendências, data quality e radar de oportunidades.
- **Automações:** agentes, workflows, cadências, execuções, custos, permissões e aprovação humana.

### Experiência transversal

Busca global, command palette, breadcrumbs, filtros salvos, listas acessíveis, layouts responsivos, estados de loading/empty/error, mensagens de autorização, notificações, auditoria de alterações e explica-por-quê da IA.

## Design system Birthub

Paleta do projeto: preto, branco, azul neon, rosa neon e dourado. **Neon é acento**, não cor obrigatória para textos, bordas e grandes fundos. Definir tokens semânticos (`background`, `surface`, `text`, `muted`, `primary`, `danger`, `success`, `focus`) e contrastes auditados.

Componentes iniciais: Button, Input, Select, Dialog, Popover, Table/DataGrid, Card, Sidebar, Topbar, Badge, Toast, Status, Timeline, ActivityComposer, ApprovalPanel, AIExplanation, KPI, Charts, AccessibleCommandMenu.

## Acessibilidade

Metas de WCAG 2.2 nível AA para fluxos prioritários; labels e foco visível, teclado, leitores de tela, feedback de erros, contraste, reduced-motion e design responsivo. Testar manualmente além de axe/Playwright.

## Primeiro vertical slice

1. Criar organização e usuário.
2. Conectar Bitrix24 em leitura e importar empresas/negócios.
3. Visualizar pipeline e a próxima ação recomendada.
4. Confirmar manualmente uma ação (criação de tarefa).
5. Registrar o evento, confirmar sincronização e medir o resultado.

Este fluxo deve poder ser demonstrado com conta de teste isolada, inclusive com conexão interrompida e reconciliação.
