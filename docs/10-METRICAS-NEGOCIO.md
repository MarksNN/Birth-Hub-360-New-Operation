# Métricas de negócio, unit economics e go-to-market

## Hipóteses de monetização

- Taxa mensal por workspace + usuários elegíveis, com limites claros de funcionalidades.
- Créditos ou franquias para enriquecimento, modelos caros e telefonia, com custos visíveis.
- Enterprise: SSO, políticas de dados, SLA/ambientes, auditabilidade e suporte contratual.
- Política de cobrança e comunicação explícitas; cobrança por uso precisa de medidor auditável.

## Instrumentação desde o início

| Grupo | Métrica | Cuidado |
|---|---|---|
| Adoção | time-to-first-value | definir evento real de valor |
| Uso | usuários ativos e uso recorrente | evitar vanity metrics |
| Resultado | ação útil com desfecho, oportunidade recuperada | atribuição e anti-gaming |
| Comercial | conversão por etapa, ciclo, win-rate, cobertura de pipeline | segmentação e vieses |
| IA | precisão, aceitação de sugestões, custo/ação, taxa de intervenção | dataset e versão |
| Dados | cobertura/completude, duplicatas, atraso de sync | distinguir 0 de unknown |
| Receita SaaS | MRR, expansão, churn, CAC e margem de contribuição | conciliação do ledger |
| Confiabilidade | SLOs, incidentes, restore drill, bugs regressivos | medir continuamente |

## Experimentos de entrada

- Piloto 1: leitura do Bitrix → oportunidade parada → tarefa aprovada → acompanhamento do resultado.
- Piloto 2: enriquecimento de contas prioritárias → melhoria em cobertura → conversão.
- Piloto 3: copiloto de próxima ação → ganho em tempo de follow-up, controlando qualidade.

Resultados devem ser comparados com baseline, janela de observação, amostra e limitações, sem declarar causalidade automática.

## Prioridade de produto

O roadmap segue: segurança básica + fluxo de valor > estabilidade de integração > inteligência verificável > automação > expansões enterprise. Custos operacionais e preço devem ser validados em pilotos antes de contratos comerciais definitivos.
