# Discovery: Jornadas e Jobs-To-Be-Done (JTBD)

**Onda:** W00 — Estratégia e Discovery  
**Data:** 23/10/2026  
**Status:** Validado para Discovery / Pré-Fundação  

---

## 1. Jobs-To-Be-Done (JTBD) Estratégicos

### JTBD 1: Visão Consolidada sem Dispersão
> **Quando** inicio minha jornada diária de vendas,  
> **Quero** ver o estado atual de todas as contas e negócios prioritários em um só lugar,  
> **Para que** eu não precise garimpar informações em múltiplos aplicativos (CRM, planilhas, e-mails).

### JTBD 2: Próximos Passos Fundamentados
> **Quando** estou analisando uma oportunidade em andamento,  
> **Quero** receber recomendações objetivas de próxima ação com a devida justificativa e evidência histórica,  
> **Para que** eu avance o negócio com agilidade e pertinência, sem cometer erros de abordagem.

### JTBD 3: Produtividade com Governança e Controle
> **Quando** preciso realizar tarefas repetitivas (registro, follow-up, notas de reunião),  
> **Quero** que a IA prepare os rascunhos e ações para minha aprovação com 1 clique,  
> **Para que** eu economize horas de trabalho manual sem perder o controle da qualidade e da relação com o cliente.

### JTBD 4: Previsibilidade de Receita e Mitigação de Riscos
> **Quando** analiso o pipeline mensal da equipe,  
> **Quero** identificar imediatamente quais negócios estagnaram ou têm sinais reais de perda iminente,  
> **Para que** eu intervenha preventivamente antes do encerramento do ciclo de faturamento.

### JTBD 5: Sincronização e Coexistência com Ferramentas Existentes
> **Quando** conecto o Birthub 360 ao meu CRM atual (ex: Bitrix24),  
> **Quero** que a sincronização ocorra sem duplicar contatos, sem corromper dados e mantendo a proveniência exata de cada registro,  
> **Para que** minha equipe continue confiando na integridade da base de dados corporativa.

---

## 2. Jornada Essencial do Usuário no Vertical Slice (MVP)

A jornada é estruturada em 5 etapas estritas, orientadas a valor imediato:

```
[Etapa 1: Ativação] ──> [Etapa 2: Ingestão] ──> [Etapa 3: Radar] ──> [Etapa 4: Decisão] ──> [Etapa 5: Fechamento]
Criação de Org/Auth     Conexão Bitrix24        Detecção de Risco   Aprovação Humana      Sincronização &
e Membros               em Leitura Controlada   & Recomendação      (Copiloto IA)         Auditoria do Desfecho
```

### Etapa 1: Ativação e Configuração de Espaço de Trabalho
- **Ator:** Administrador da Organização.
- **Ação:** Cadastra a organização no Birthub 360, convida membros com papéis definidos (`owner`, `admin`, `sales`).
- **Ponto de Controle:** Isolamento multi-tenant ativado automaticamente com chave de organização e políticas de banco de dados (RLS).
- **Resultado:** Espaço de trabalho seguro pronto para ingestão.

### Etapa 2: Conexão e Ingestão Inicial (Bitrix24)
- **Ator:** Administrador ou Head de Vendas.
- **Ação:** Informa credenciais seguras de integração com o Bitrix24 (webhook seguro ou app token).
- **Ponto de Controle:** Sincronização inicial em modo exclusivamente leitura; nenhuma mutação ou exclusão é disparada contra o Bitrix24.
- **Resultado:** Empresas, contatos e oportunidades são importados com carimbo de proveniência (`source: bitrix24`).

### Etapa 3: Painel "Hoje" e Radar de Oportunidades
- **Ator:** Executivo de Contas / Vendedor.
- **Ação:** Acessa a tela principal "Hoje" e visualiza oportunidades divididas por status e criticidade.
- **Comportamento do Sistema:** O módulo **Radar** detecta um negócio com proposta enviada há mais de 10 dias sem qualquer registro de atividade recente.
- **Resultado:** Alerta destacado: *"Negócio XYZ estagnado há 10 dias após envio de proposta comercial"*.

### Etapa 4: Recomendação do Sales Copilot e Aprovação Humana
- **Ator:** Executivo de Contas / Vendedor.
- **Ação:** Clica na oportunidade e visualiza a recomendação do Sales Copilot.
- **Explicação com Evidências:** *"Recomendo agendar uma tarefa de follow-up com o decisor João Silva abordando a dúvida pendente sobre SLA discutida na reunião do dia 08/10"*.
- **Controle Human-in-the-Loop:** O vendedor pode editar a tarefa, aprovar com 1 clique ou descartar com justificativa.
- **Resultado:** Tarefa aprovada pelo usuário no nível de autonomia A3 (ação interna autorizada).

### Etapa 5: Registro, Sincronização Reconciliada e Auditoria
- **Ator:** Executor (Background Worker).
- **Ação:** Registra a nova tarefa no Birthub 360 e emite evento para sincronizar a tarefa criada no Bitrix24.
- **Ponto de Controle:** Transação protegida por Outbox Pattern com chave de idempotência; registro do log de execução em `agent_run` com custo e modelo associados.
- **Resultado:** Tarefa disponível no CRM externo e no Birthub 360, com métrica de tempo até o follow-up registrada no sistema.
