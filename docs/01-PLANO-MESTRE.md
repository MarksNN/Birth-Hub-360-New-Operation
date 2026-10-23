# Plano-mestre — Birthub 360 Full Operation

**Versão:** 1.0 — 23/10/2026  
**Estado:** proposta estruturada e executável, aguardando discovery e validação.  
**Projeto:** novo repositório `MarksNN/Birthub-360-Full-Operation` (nome pretendido; publicação no GitHub é etapa separada).  
**Referência técnica:** `MarksNN/Birthub-360` em leitura, sem sobrescrever histórico, branches ou CI do original.

## 1. Tese de produto

O Birthub 360 Full Operation é uma plataforma multi-tenant B2B de **Revenue Intelligence + Commercial Operations + Governed AI**. Seu diferencial não é o volume de funcionalidades, e sim um ciclo completo: **conectar → entender → priorizar → agir → medir → aprender**.

**Tese de entrada:** conectar e operar CRMs existentes primeiro, mantendo funções nativas para usuários sem CRM. Não exigir migração integral para obter valor.

### 1.1 Cliente ideal inicial (hipótese, validar em W00)

- Empresas B2B com operação de vendas estruturada ou em formação, processos repetitivos e CRM subutilizado.
- Liderança comercial que sofre com dados dispersos, previsões frágeis, perda de follow-up e baixa produtividade.
- Equipe comercial que precisa de próximas ações práticas, não mais um dashboard.

A segmentação inicial, ticket, tamanho de equipe e canal de aquisição dependem de entrevistas e provas de valor; não são assumidos como fatos.

### 1.2 Jobs-to-be-done

1. Entender o que acontece em cada conta e negócio sem coletar dados em cinco aplicativos.
2. Identificar próximos passos com fundamento explícito em sinais e histórico.
3. Diminuir trabalho manual sem perder segurança, qualidade ou controle.
4. Ganhar previsibilidade de receita e visibilidade sobre riscos.
5. Integrar e sincronizar sistemas atuais sem duplicar ou destruir registros.

### 1.3 North-star metric

**Oportunidades com ação útil concluída e resultado observado**, acompanhada de taxa de conversão, uso recorrente, horas economizadas e custo por ação efetiva. Definir regra anti-gaming: ações de baixa qualidade/repetidas não contam.

## 2. Produto completo: 12 capacidades operacionais

| ID | Capacidade | Entrega de negócio | Entra quando |
|---|---|---|---|
| C01 | Organization & Identity | organizações, membros, permissões, auditoria | fundação |
| C02 | CRM 360° | contas, contatos, leads, negócio, funis, atividades | MVP |
| C03 | Prospecting & Enrichment | busca, verificação, scoring e enriquecimento | integração |
| C04 | Integration Hub | Bitrix24, APIs, webhooks, sync bi-direcional controlada | MVP+ |
| C05 | Signals & Revenue Intelligence | alertas, saúde do pipeline, previsão explicável | inteligência |
| C06 | AI Copilot & Agent Platform | agentes especializados e ferramentas governadas | inteligência |
| C07 | Sales Engagement | cadências, playbooks, comunicação consentida, tarefas | expansão |
| C08 | Proposals & Documents | propostas, documentos e fluxo de aprovações | expansão |
| C09 | Command Center & BI | cockpit, funil, receita, metas, qualidade dos dados | MVP/RevOps |
| C10 | Billing & Entitlements | planos, cotas, ledger de consumo e operação SaaS | monetização |
| C11 | Trust, Privacy & Operations | LGPD, controle de dados, incidentes, backups, SLOs | transversal |
| C12 | Voice & Mobile | voz e mobilidade, mediante validação | expansão |

Não implantar todos simultaneamente: um **full operation é um escopo final**, não um requisito de lançamento big-bang.

## 3. Jornada essencial end-to-end

1. Administrador cria organização, convida time, define papéis e configura consentimentos/políticas.
2. Conecta Bitrix24 por credenciais apropriadas, executa sync inicial em leitura, inspeciona diffs e reconciliação.
3. Birthub unifica contas, contatos, negócios, atividades e origem/proveniência dos dados.
4. Radar detecta negócios parados, sinais relevantes, próximos follow-ups e problemas de qualidade.
5. Sales Copilot explica recomendação com evidência e sugestão de ação.
6. Usuário aprova, ou política autoriza uma ação previamente limitada.
7. Executor gera tarefa, atualiza CRM ou conduz comunicação consentida.
8. Resultado é registrado e medido: evento, custo, evidência, mudança de estado, impacto.
9. Command Center expõe execução, risco e resultados financeiros sem métricas inventadas.

**Definition of Done do primeiro vertical slice:** executar passos 1–9 com uma organização de teste e um cliente piloto, incluindo falhas e rollback.

## 4. Modelo de distribuição

- SaaS multi-tenant com workspace por organização.
- Roles: `owner`, `admin`, `manager`, `sales`, `analyst`, `integration_service` e permissões por capacidade e recurso; papéis são ponto de partida, não autorização suficiente.
- Feature flags e planos de assinatura por tenant.
- Isolamento entre tenants no banco, jobs, cache, logs, vetor e integrações.
- Modalidades de IA configuradas por política: recomendar, rascunhar, executar ação permitida e exigir aprovação.

## 5. Arquitetura de alto nível

`React Web + Design System → API modular Fastify → Domínio + PostgreSQL/RLS → Outbox/Workers (BullMQ/Redis) → Adaptadores Bitrix/Apollo/Places → Gateway IA e telemetria`.

Separar domínio, aplicação, infraestrutura e apresentação; projetos compartilhados apenas para contratos, design system, IA e conectores. Evitar cruzamento circular entre módulos. Mais detalhes em `02-ARQUITETURA.md`.

## 6. Modelo de entrega

- **Fase A (dias 1–30, estimativa):** discovery, design inicial, CI, fundamentos de segurança.
- **Fase B (dias 31–90):** CRM, primeiro conector, fluxo comercial real, piloto de UI.
- **Fase C (dias 91–150):** sinais, score, copiloto e agentes com aprovação.
- **Fase D (dias 151–210):** cadências, propostas, RevOps, billing e observabilidade avançada.
- **Fase E (dias 211–270):** pilotos ampliados, hardening, readiness e lançamento progressivo.

Prazos são cenários preliminares, dependentes de capacidade de engenharia e validação real. A versão MVP pode aparecer antes do Full Operation. Mobile/voz avançada/marketplace só depois de gatilhos de demanda.

## 7. Gates de aceitação de produto e engenharia

- Evidência de problema real e validação de UX, sem inventar adoção.
- Testes de integração/E2E, isolamento cross-tenant, acesso por papel e consentimento.
- Avaliação de IA com dataset versionado, métricas de erro, custo e hallucination rate.
- Rollback de deploy e restore de backup demonstrados.
- Traces completos de ações e agentes, sem vazamento de PII em logs.
- Cumprimento de gates aplicáveis à `main`, nunca apenas `skipped` ou waiver sem fundamento.
- Gate de segurança bloqueante para vulnerabilidades críticas, secrets e abuso de privilégios.
- SLO e orçamento de erro declarados e monitorados antes de GA.

## 8. Critérios de sucesso do negócio

Métrica norte: ações úteis com resultado rastreado. Guardrails: retenção, qualidade de dados, satisfação, conversão por etapa, tempo até primeiro valor, custo por usuário/ação, churn, incidentes de privacidade, taxa de aprovação de sugestões de IA. Metas numéricas exigem baseline real antes de compromissos.

## 9. Decisões irreversíveis a evitar

- Não transformar todos os módulos originais em requisitos do dia 1.
- Não copiar estrutura de 52 módulos e 20 workflows sem revisão.
- Não centralizar regras de acesso apenas na interface.
- Não misturar eventos, DTOs de API e entidades de banco em um contrato único.
- Não permitir que agentes alterem dados externos sem políticas, aprovação e idempotência.
- Não vincular lançamento a Kubernetes, app nativo ou múltiplas bases de dados por padrão.

## 10. Riscos estratégicos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Scope creep | atraso e instabilidade | vertical slice; backlog por valor |
| Dados ruins do CRM | IA pouco confiável | proveniência, reconciliação, observabilidade |
| Vazamento cross-tenant | crítico | RLS fail-closed, testes adversariais, least privilege |
| Agentes custosos ou imprecisos | custo/perda de confiança | evals, orçamento, human-in-the-loop |
| Conectores frágeis | retrabalho e dados duplicados | contratos, outbox, replay/idempotência |
| Reescrita destrutiva | perda de valor do legado | strangler, importação selecionada, coexistência |
| Dependência de fornecedor IA | custo e lock-in | gateway, interfaces e fallback validado |

## 11. Primeiras decisões de execução

1. Rodar W00 e produzir mapa de clientes/problemas/escopo.
2. Validar stack e design system na W01–W03.
3. Entregar um único fluxo ponta a ponta; só então aprofundar inteligência.
4. Gerenciar cada onda por issue, PR, revisão independente, teste, medição e documentação.
5. Só começar migração após inventário por módulo e plano de rollback.
