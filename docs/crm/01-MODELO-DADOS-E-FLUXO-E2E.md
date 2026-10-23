# Modelo de Dados e Fluxo Comercial End-to-End (E2E)

**Onda:** W04 — CRM Operacional  
**Data:** 23/10/2026  
**Status:** Implementado e Testado  

---

## 1. Ciclo Comercial Canônico (Gate W04)

O ciclo operacional completo atende à seguinte jornada:

```text
[1. Lead / Empresa / Contato]
             │
             ▼
[2. Oportunidade (Deal)] ──(Qualificação)──> [3. Atividade / Tarefa Agendada]
             │                                              │
             ▼                                              ▼
[4. Proposta Enviada (Proposal Sent)] <───── [Conclusão da Reunião]
             │
             ▼
[5. Fechamento Ganho (Closed Won)] ──> [Registro Financeiro & Pipeline]
```

---

## 2. Endpoints do Módulo CRM

| Rota | Método | Descrição |
|---|---|---|
| `/api/v1/crm/companies` | GET / POST | Listagem e criação de empresas do tenant |
| `/api/v1/crm/contacts` | GET / POST | Listagem e cadastro de contatos/decisores |
| `/api/v1/crm/deals` | GET / POST | Listagem e criação de oportunidades |
| `/api/v1/crm/deals/:id` | GET | Consulta detalhada da oportunidade |
| `/api/v1/crm/deals/:id/stage` | PATCH | Transição controlada de estágio do funil |
| `/api/v1/crm/tasks` | GET / POST | Gestão de tarefas vinculadas a negócios |
| `/api/v1/crm/tasks/:id/complete`| PATCH | Marcação de atividade concluída |
| `/api/v1/crm/pipeline` | GET | Resumo agregado por estágio e valor financeiro |

Todas as rotas são protegidas pelo interceptor fail-closed, validando identidade e tenant em cada operação.
