# Discovery: Scorecard de Valor, North-Star e Guardrails

**Onda:** W00 — Estratégia e Discovery  
**Data:** 23/10/2026  
**Status:** Validado para Discovery / Pré-Fundação  

---

## 1. Métrica Norte (North-Star Metric)

> **Oportunidades com ação útil concluída e resultado observado**  
> *(Qualified Opportunities with Completed Action & Tracked Outcome)*

### O que significa "Ação Útil"?
Uma intervenção comercial fundamentada (ex: follow-up agendado e realizado, dúvida técnica resolvida, proposta atualizada com base em feedback) sugerida pelo sistema ou iniciada pelo operador, com evidência temporal e factual.

### O que significa "Resultado Observado"?
Mudança de estado mensurável da oportunidade após a ação (ex: avanço de estágio no funil, agendamento de demonstração, resposta do decisor, fechamento ganho ou perda qualificada documentada).

---

## 2. Regras Anti-Gaming (Proteção contra métricas artificiais)

Para evitar que usuários ou automações gerem dados falsos para simular produtividade, aplicam-se as seguintes regras de validação:

1. **Anti-Duplicação Estrita:** Ações repetidas em uma mesma oportunidade dentro de uma janela inferior a 24 horas contam como apenas 1 ação útil.
2. **Exigência de Evidência Externa/Temporal:** Uma tarefa só é considerada "concluída com desfecho" quando há interação registrada do cliente ou transição formal de status de negócio no CRM.
3. **Descarte de Ações Sem Conteúdo:** Tarefas genéricas (ex: "olhar negócio", "acompanhar") sem notas explicativas ou sem associação a contato específico não pontuam na North-Star.
4. **Taxa de Rejeição Monitorada:** Se um usuário descarta mais de 40% das recomendações do Copilot, o modelo daquela conta entra em quarentena para recalibração de regras.

---

## 3. Scorecard de Guardrails de Negócio e Confiabilidade

| Dimensão | Métrica Alvo (Hipótese de Entrada) | Limite Crítico (Alarme) | Ação de Mitigação |
|---|---|---|---|
| **Tempo até 1º Valor (TTV)** | < 24 horas após integração Bitrix24 | > 72 horas | Simplificar fluxo de mapeamento e onboarding |
| **Aceitação de Sugestões de IA** | > 70% aprovadas ou aproveitadas | < 50% | Ajustar prompts, adicionar exemplos do segmento |
| **Custo de IA por Ação Útil** | < R$ 0,05 por recomendação | > R$ 0,25 | Cache de embeddings, modelos menores (Flash/Haiku) |
| **Isolamento de Tenants** | 0 incidentes cross-tenant | > 0 incidentes | Bloqueio imediato do serviço e auditoria de RLS |
| **Idempotência de Sincronização** | 100% de transações reconciliadas | > 0 duplicações | Suspensão da fila e reprocessamento por DLQ |
| **Disponibilidade da API (SLO)** | 99,9% mensal | < 99,5% | Rollback da versão e acionamento de runbook SRE |

---

## 4. Matriz de Rastreabilidade e Decisões

- Todas as métricas reportadas no produto deverão ter sua fórmula de cálculo documentada no código de contratos.
- Nenhum dashboard apresentará métricas sintéticas ou projeções sem exibir o intervalo de confiança e a quantidade de dados reais de suporte.
