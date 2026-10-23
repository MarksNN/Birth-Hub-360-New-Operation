# Roadmap de execução por ondas

**Regra:** ondas podem ter trabalho paralelo controlado, mas nenhum gate dependente pode ser pulado. Prazo total de referência 6–9 meses e não promessa.

| Onda | Nome | Prioridade | Dependência base | Responsável |
|---|---|---|---|---|
| W00 | Estratégia e discovery | P0 | — | Produto |
| W01 | Fundação de engenharia | P0 | W00 | Plataforma |
| W02 | Identidade e isolamento | P0 | W01 | Segurança e Dados |
| W03 | Design system e workspace | P0 | W02 | Produto/UX |
| W04 | CRM operacional | P0 | W03 | CRM |
| W05 | Integrações e sincronização | P0 | W04 | Integrações |
| W06 | Inteligência comercial | P1 | W05 | Dados e IA |
| W07 | Copiloto e agentes seguros | P1 | W06 | IA e Governança |
| W08 | Automações e engajamento | P1 | W07 | Operações Comerciais |
| W09 | RevOps e monetização | P1 | W08 | RevOps/Financeiro |
| W10 | Segurança e confiabilidade avançadas | P0 | W09 | Segurança/SRE |
| W11 | Pilotos controlados | P0 | W10 | Produto/CS |
| W12 | GA Full Operation | P0 | W11 | Release |
| W13 | Expansão enterprise | P2 | W12 | Produto/Plataforma |

## W00 — Estratégia e discovery

**Objetivo:** Definir ICP, personas, jornadas, JTBD, proposta de valor, riscos e north-star.

**Entregáveis:** Entrevistas e mapa de problemas; jornadas; scorecard de valor; critérios de MVP.

**Gate de aceite:** Problema e ICP validados com clientes; fluxos priorizados; métricas e hipóteses documentadas.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W01 — Fundação de engenharia

**Objetivo:** Monorepo, CI, ADRs, versionamento, ambientes isolados, observabilidade mínima.

**Entregáveis:** Pipelines, templates PR, contratos, comandos padronizados, IaC inicial.

**Gate de aceite:** CI de PR verde no SHA; sem segredo no git; rollback de deploy demonstrado.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W02 — Identidade e isolamento

**Objetivo:** Org/tenant, login, membership, RBAC, RLS, auditoria, consentimento e limites.

**Entregáveis:** Schema seguro, auth, grants, testes negativos cross-tenant, logs imutáveis.

**Gate de aceite:** Testes de isolamento sem bypass; cada endpoint com autorização explícita.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W03 — Design system e workspace

**Objetivo:** Marca neon controlada, tokens, app shell, acessibilidade, onboarding.

**Entregáveis:** Componentes, navegação, telas principais, documentação de design.

**Gate de aceite:** WCAG 2.2 AA em fluxos críticos; teclado/leitor de tela; UX testada.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W04 — CRM operacional

**Objetivo:** Empresas, contatos, leads, oportunidades, pipeline, atividades e histórico.

**Entregáveis:** CRUD, filtros, visões, auditoria, comentários, ownership, importação.

**Gate de aceite:** Fluxo lead → oportunidade → atividade → fechamento funciona E2E.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W05 — Integrações e sincronização

**Objetivo:** Bitrix24 primeiro, conectores, identidade externa, outbox e reconciliação.

**Entregáveis:** Sync incremental, retry/idempotência, dead-letter, webhook, reconciliação.

**Gate de aceite:** Sem duplicação em replay; escopo de tenant; conflitos rastreados e resolvíveis.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W06 — Inteligência comercial

**Objetivo:** ICP Fit, sinais, riscos, priorização, qualidade de dados, previsibilidade.

**Entregáveis:** Pontuações explicáveis, proveniência, radar, métricas operacionais.

**Gate de aceite:** Precisão/recall e cobertura com dataset rotulado; sem promessas infundadas.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W07 — Copiloto e agentes seguros

**Objetivo:** Gateway multi-modelo, tool registry, agentes Radar/Research/Sales/Executor, aprovações.

**Entregáveis:** Orquestrador, execução observável, evals, custos, quotas, auditoria.

**Gate de aceite:** Ações externas só após política/aprovação; testes de injeção e replay.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W08 — Automações e engajamento

**Objetivo:** Cadências, inbox, notificações, geração de propostas, voz em piloto.

**Entregáveis:** Workflow builder controlado, templates, preferências, opt-out.

**Gate de aceite:** Consentimento validado; stop/opt-out; rate limit; trilhas e cancelamento.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W09 — RevOps e monetização

**Objetivo:** Dashboards executivos, forecasting, entitlement, planos, medição de consumo.

**Entregáveis:** Forecast com intervalos, ledger de custos IA, billing e cotas.

**Gate de aceite:** Cálculo reconciliado; faturamento idempotente; dados segregados.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W10 — Segurança e confiabilidade avançadas

**Objetivo:** DR, backups, testes de carga, observabilidade, auditoria de supply chain.

**Entregáveis:** Runbooks, restore drill, threat model, pentest, dependências.

**Gate de aceite:** Restore medido; SLOs validados; zero achados críticos abertos.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W11 — Pilotos controlados

**Objetivo:** Piloto em clientes reais, telemetria, feedback, migração assistida.

**Entregáveis:** Relatórios de adoção, erros, valor gerado, plano de conversão.

**Gate de aceite:** Primeiro valor comprovado; incidentes triados; retenção inicial acompanhada.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W12 — GA Full Operation

**Objetivo:** Habilitação gradual, readiness go/no-go, billing, suporte e operação.

**Entregáveis:** Release checklist, contratos, suporte, runbooks, rollback.

**Gate de aceite:** Todos gates obrigatórios verdes no SHA de release; plano de reversão.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.


## W13 — Expansão enterprise

**Objetivo:** Mobile offline, voice advanced, marketplace, personalização e serviços separados sob demanda.

**Entregáveis:** Roadmap fundamentado em dados e custos reais.

**Gate de aceite:** Só iniciar com evidência de demanda e métricas sustentáveis.

**Saídas exigidas:** issue de escopo, ADR se necessário, PR em branch própria, testes e logs (com SHA), avaliação de segurança/UX pertinente, parecer do Agente 24, plano de rollback e atualização da matriz de rastreabilidade.

## Definição de pronto (DoD) transversal

1. Usuário e caso de negócio claramente identificados.
2. Aceites de UI, API, dados, falhas e observabilidade especificados.
3. Testes automáticos executados no SHA, incluindo negativos de privilégio e tenant quando aplicável.
4. Sem waiver novo silencioso, sem teste removido para simular verde.
5. Parecer independente antes de merge; decisão registrada.
6. Deploy progressivo e reversível com telemetria.

## Regra de autorização de implantação

É proibido unificar `main` sem CI pertinente verde, review e aprovação exigida. Deploy de produção exige go/no-go documentado, responsável pela liberação e confirmação de backup/rollback. Evitar auto-merge que ignore gates de segurança.
