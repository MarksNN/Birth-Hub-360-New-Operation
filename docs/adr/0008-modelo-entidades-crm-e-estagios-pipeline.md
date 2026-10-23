# ADR 0008 — Modelo de Entidades de CRM, Estágios de Pipeline e RLS

**Status:** Aprovado — Onda W04.

## Contexto

O CRM do Birthub 360 Full Operation opera tanto como CRM nativo para empresas sem ferramenta prévia quanto como camada de inteligência e reconciliação sobre CRMs externos (inicialmente Bitrix24). É imperativo que as entidades centrais (Empresas, Contatos, Oportunidades e Tarefas) possuam integridade relacional, rastreabilidade de proveniência de dados e isolamento multi-tenant garantido por Row-Level Security no PostgreSQL.

## Decisão

Adotar a seguinte modelagem relacional com RLS fail-closed:
1. **Entidades Principais:**
   - `companies`: armazena organizações clientes, domínio, porte e proveniência (`source`, `external_id`).
   - `contacts`: armazena indivíduos e decisores, associados opcionalmente a uma empresa do mesmo tenant.
   - `deals`: representa a oportunidade comercial, vinculada a empresa, contato e proprietário (`owner_id`), com valor financeiro, moeda e estágio de funil.
   - `tasks`: representa atividades e follow-ups, com vínculo direto a uma oportunidade, responsável, prazo e status.
2. **Estágios Canônicos de Funil:**
   - `lead` -> `qualification` -> `meeting_scheduled` -> `proposal_sent` -> `negotiation` -> `closed_won` / `closed_lost`.
3. **Isolamento de Tenant:**
   - Todas as quatro tabelas possuem `tenant_id NOT NULL` e RLS ativado e forçado (`FORCE ROW LEVEL SECURITY`), filtrando estritamente por `current_tenant_id()`.

## Consequências

- **Positivas:** Permite fluxo E2E fluido (prospecção até fechamento), funil unificado com agregação de métricas em tempo real e proteção absoluta contra vazamentos entre tenants.
- **Negativas / Cuidados:** Exige que alterações de estágio disparem atualização de `last_activity_at` para manter o radar de estagnação calibrado.
