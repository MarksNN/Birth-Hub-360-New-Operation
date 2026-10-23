# Migração seletiva a partir de MarksNN/Birthub-360

## Princípio

**Usar o repositório atual como fonte de conhecimento, testes, regras de negócio e funcionalidades a avaliar; não fazer fork cego nem `git clone` e renomear.** O legado permanece operacional e inalterado. Novos dados só entram por importação validada, com consentimento/política adequada.

### Evidência inicial (23/10/2026)

Consulta à `main` do GitHub mostrou **52 diretórios** de funcionalidades em `src/features`, incluindo CRM, prospecting, integrations, intelligence, signals-risks, voice, billing, LGPD, gamification, knowledge e workspace; e **20 workflows** de Actions. O README descreve React/Vite, Prisma/PostgreSQL com RLS, Redis/BullMQ, vetores e VoiceHub. Estes fatos não significam que cada módulo esteja funcional ou pronto para transferir.

## Matriz de decisão por capacidade

| Área legado | Ação planejada | Motivo/critério |
|---|---|---|
| Companies / Contacts / CRM / CRM360 | REAPROVEITAR CONCEITOS E TESTES, REIMPLEMENTAR CONTRATOS | núcleo comercial limpo |
| Integrations / Bitrix | AVALIAR ADAPTER E PORTAR SOB INTERFACE | manter integrações úteis sem acoplamento |
| Prospecting / ICP | PORTAR REGRAS VALIDAS APÓS EVAL | identidade, provenance e scoring |
| Intelligence / Copilot / Signals | REFATORAR PARA MOTOR DE DECISÃO | recomendações explicáveis e ações rastreadas |
| Auth / LGPD / Module-access | REVISAR, NÃO COPIAR ÀS CEGAS | isolamento e segurança devem ser demonstrados |
| AI Voice / VoiceHub / Mobile | ADIAR OU PILOTAR | custo e maturidade de negócio |
| Gamification / Roleplay / Design-Lab | BACKLOG POST-GA | diferencial secundário até validação |
| Existing Actions / workflows | REDESENHAR PARA GATES MÍNIMOS ESSENCIAIS | evitar carregar falhas/waivers históricos |

## Procedimento de incorporação de um módulo

1. Identificar caso de uso e teste de aceite (quais usuários/resultado).
2. Inventariar dependências, origem dos dados e dados pessoais.
3. Avaliar cobertura, riscos, ciclo de vida, licença e acoplamento.
4. Criar contrato do domínio no novo repositório.
5. Portar apenas lógica comprovada, atribuindo proveniência do código e autoria quando exigido.
6. Rodar testes unitários, integração, RLS, E2E, performance e regressão.
7. Habilitar por flag para tenant piloto; comparar side by side.
8. Definir rollback; só depois cortar tráfego/uso para implementação nova.

## Migração de dados

- Não transportar `.env`, segredos, dumps de produção, tokens ou credenciais.
- Mapear IDs legados para IDs novos por `external_identity` e `organization_id`.
- Migrar em ensaio com dados sintetizados/anonimizados; depois executar plano autorizado.
- Documentar mapeamento de campos, timezone, enum e regras de deduplicação.
- Carga inicial → verificação de contagem/checksum/amostragem → delta sync → cutover por tenant → observação → rollback.
- Manter acessos de produção apartados de agentes de desenvolvimento.

## Regras de corte

Nunca desligar integração nem migrar em massa sem reconciliação, observabilidade, aprovação de negócio e validação de restauração. Não executar `DROP` ou migração destrutiva automatizada no primeiro cutover.
