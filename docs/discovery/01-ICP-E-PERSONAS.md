# Discovery: Perfil de Cliente Ideal (ICP) e Personas

**Onda:** W00 — Estratégia e Discovery  
**Data:** 23/10/2026  
**Status:** Validado para Discovery / Pré-Fundação  

---

## 1. Tese do ICP (Ideal Customer Profile)

O Birthub 360 Full Operation **não** busca substituir CRMs legados consolidados no primeiro dia, nem atender todo tipo de empresa. Seu foco cirúrgico de entrada é em empresas B2B que já possuem volume de negócios mas sofrem com ineficiência operacional e falta de inteligência prática.

### 1.1 Critérios Firmográficos e Operacionais

| Critério | Faixa Alvo Inicial | Não Atendido no MVP |
|---|---|---|
| **Modelo de Negócio** | B2B (Serviços corporativos, SaaS, Consultorias, Indústrias B2B) | B2C, Varejo físico, E-commerce transacional direto |
| **Tamanho da Equipe Comercial** | 3 a 50 pessoas (SDRs, Executivos de Contas, Liderança) | Equipes unifuncionais isoladas sem processo comercial |
| **Ticket Médio (ACV / Mensal)** | R$ 3.000 a R$ 50.000 / mês (ou vendas de R$ 30k a R$ 500k) | Micro-tickets (< R$ 500) com alta rotatividade impulsiva |
| **Ciclo Médio de Vendas** | 15 a 90 dias (vendas complexas, múltiplos decisores) | Ciclo instantâneo de compra por impulso |
| **Maturidade Tecnológica** | Usuários de Bitrix24 ou CRM equivalente com histórico | Sem CRM e sem intenção de estruturar processos |
| **Volume de Oportunidades** | 50 a 1.000 oportunidades ativas por mês | Menos de 10 negócios ativos por trimestre |

---

## 2. Dores Críticas Validadas no Discovery

1. **"Cemitério de Negócios" no CRM:** Leads e oportunidades entram no Bitrix24 e ficam parados após a segunda tentativa de contato sem que a liderança perceba a tempo de recuperá-los.
2. **Dispersão Cognitiva do Vendedor:** O vendedor gasta 60% do seu dia abrindo e-mails, WhatsApp, Bitrix e planilhas para descobrir *qual* próximo cliente deve contatar e *qual* contexto da última conversa.
3. **Fadiga de Dashboards Passivos:** A liderança tem gráficos coloridos, mas nenhum sistema diz objetivamente: *"O negócio da Empresa X está em risco de perda porque não há contato com o decisor há 12 dias; recomendo esta ação com base na proposta enviada"*.
4. **Medo de IA Descontrolada:** Gestores têm receio de ferramentas de IA que enviam mensagens automáticas frias, geram alucinações comerciais ou vazam dados sensíveis de clientes.

---

## 3. Personas Centrais

### Persona 1: Carlos Mendonça — Diretor Comercial / Head de RevOps
- **Idade:** 42 anos
- **Objetivo Principal:** Aumentar a taxa de conversão do pipeline e a previsibilidade de receita sem ter que contratar mais vendedores no curto prazo.
- **Dores:**
  - Forecast sempre impreciso no final do mês.
  - Vendedores esquecem de registrar dados no CRM.
  - Falta de visibilidade de quais negócios realmente têm chance de fechamento.
- **O que espera do Birthub 360:**
  - Radar automático que sinalize negócios prioritários e esquecidos.
  - Recomendações explicáveis, com base em fatos do histórico e não palpites.
  - Métricas de produtividade real (ações úteis com desfecho registrado).

### Persona 2: Beatriz Ramos — Executiva de Contas (Closer / AE)
- **Idade:** 29 anos
- **Objetivo Principal:** Bater a meta de vendas mensal com menos tempo gasto em preenchimento de formulários burocráticos.
- **Dores:**
  - Perde tempo tentando lembrar o que conversou na reunião de 2 semanas atrás.
  - Dúvida sobre qual negócio priorizar no início do dia.
  - Detesta copiar e colar informações entre ferramentas.
- **O que espera do Birthub 360:**
  - Tela "Hoje" simplificada com a fila de tarefas e próximas ações prontas para revisão.
  - Copiloto que sugira mensagens contextualizadas e tarefas com 1 clique (aprovação humana).
  - Histórico 360° unificado em uma única tela.

### Persona 3: Eduardo Siqueira — Administrador de TI e Segurança
- **Idade:** 36 anos
- **Objetivo Principal:** Garantir segurança, isolamento multi-tenant, conformidade com a LGPD e controle dos custos de infraestrutura e IA.
- **Dores:**
  - Riscos de vazamento de dados de clientes entre empresas (cross-tenant).
  - Custos descontrolados com chamadas de APIs de LLMs.
  - Dificuldade de auditar o que agentes de software executaram.
- **O que espera do Birthub 360:**
  - Isolamento de banco estrito com Row-Level Security (RLS) fail-closed.
  - Registro de auditoria (`agent_run`) imutável para toda ação realizada.
  - Políticas claras de governança e permissões granulares por organização.

---

## 4. Hipóteses e Critérios de Descarte

| Hipótese | Forma de Validação | Critério de Descarte |
|---|---|---|
| H1: A integração de leitura do Bitrix24 gera valor perceptível nas primeiras 24 horas. | Conexão em piloto gerando radar de oportunidades esquecidas. | Se menos de 50% dos usuários pilotos considerarem o radar relevante. |
| H2: Vendedores preferem sugestões com confirmação humana em vez de automação cega. | Taxa de aceitação e edição de tarefas geradas pelo Sales Copilot. | Se os vendedores desligarem o assistente ou rejeitarem mais de 60% das sugestões. |
| H3: A métrica "Ação útil com desfecho" reflete ganho real de receita para a liderança. | Acompanhamento do fechamento de negócios sinalizados pelo radar. | Se negócios sinalizados e trabalhados não apresentarem conversão superior ao grupo de controle. |
