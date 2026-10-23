# Governança de IA e agentes

## Começar com quatro capacidades, não uma centena de agentes

1. **Radar:** detecta sinais e riscos, gera hipóteses auditáveis.
2. **Research:** investiga/enriquece empresas com fontes e confiança.
3. **Sales Copilot:** redige recomendações e planos com evidências.
4. **Executor:** executa somente ferramentas aprovadas e de escopo restrito.

**Agente 00** coordena engenharia e waves; **Agente 24** atua como auditor independente da solução/entrega, sem autoaprovação. Estes são agentes de DESENVOLVIMENTO, distintos dos agentes comerciais de PRODUTO.

## Separação técnica

- **Tool:** ação tipada e autorizada (ex.: `create_crm_task`).
- **Workflow:** sequência determinística com idempotência e estado persistente.
- **Agent:** componente que raciocina/seleciona passos dentro das ferramentas permitidas.
- **Policy Engine:** decisão fora do modelo, antes da execução.

## Classificação de autonomia

| Nível | Permissão | Exemplo |
|---|---|---|
| A0 | Somente recomendar | alerta e explicação |
| A1 | Rascunhar | mensagem ou proposta não enviada |
| A2 | Leitura autorizada | consultar CRM, score, métricas |
| A3 | Escrita limitada por política | tarefa interna sem comunicação externa |
| A4 | Ação sensível: aprovação explícita | mensagem externa, alteração em massa, despesa, contrato |

A política não permite que o modelo eleve seu próprio nível. Consentimento para comunicações, rate limits, budget e direitos do usuário devem ser checados fora do LLM.

## Execução rastreável

`agent_run` registra org, ator, objetivo, prompts/versionamento, dataset/context hashes, modelo, custo, ferramentas, decisões da política, aprovação, entrada/saída minimizada, idempotency key e resultado. Segredos não entram no prompt; PII só quando imprescindível e permitido.

## Avaliações necessárias

- Dataset dourado de consultas e respostas esperadas, com versionamento.
- Testes adversariais: prompt injection, vazamento cross-tenant, exfiltração, privilege escalation, tool misuse.
- Falhas de serviços, timeouts, retries, custo máximo, circuit breaker e fallback.
- Testes de utilidade comercial: sugestão aproveitada, follow-up concluído, conversão, feedback explícito.
- Antes de rollout de modelo ou prompt: A/B/avaliação com thresholds definidos, rollback e rastreabilidade.

## FinOps de IA

Definir limites por organização, funcionalidade, usuário e execução, inclusive gasto máximo por agente. Registrar tokens, latência, preço por modelo, custo aproximado por operação útil e repetição evitada por cache autorizado.
