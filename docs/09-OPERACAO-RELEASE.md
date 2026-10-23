# Operação de engenharia, CI/CD e release

## Modelo de branches

- `main`: protegida e pronta para release (com gates aplicáveis, obrigatórios e estáveis).
- Branches curtas: `feat/W04-crm-leads`, `fix/W02-tenant-policy`.
- PRs pequenos: escopo, comportamento, evidência, riscos, migrações, rollback e screenshots para UI.
- Releases etiquetados, changelog e owner de deploy; preview/homologação isolados.

## Agentes de desenvolvimento

- **00 — Coordenador:** contratos, prioridades, ordenação e integração.
- Especialistas: produto/UX, backend/DB/RLS, integrações, IA, frontend, SRE, QA.
- **24 — Auditor Independente:** revisão separada dos patches e gates; sem autoaprovação.
- Execução paralela somente quando ownership não conflitar. Codex não deve operar múltiplas branches na mesma árvore sem isolamento explícito.

## Gatilhos mínimos de CI depois do bootstrap de código

1. instalação com lockfile imutável;
2. formato/lint/typecheck;
3. testes unitários/contratos;
4. testes de integração com PostgreSQL real e RLS;
5. build/API schema compatibility;
6. E2E em fluxos críticos com dados de teste;
7. análise SAST/deps/segredos/container;
8. checks de acessibilidade e visual regression nas mudanças de interface;
9. migration forward/expand-contract e rollback documentado;
10. gate agregado final por SHA, sem simular verde por `continue-on-error` em requisito obrigatório.

O workflow de blueprint incluído no repositório valida APENAS documentação; os gates de aplicação devem ser adicionados na W01, junto com código executável e lockfile.

## Go/no-go para produção

- `main` verde no SHA de release, sem requisitos críticos omitidos.
- Revisor independente APROVADO; deployment autorizado por humano responsável.
- Migração testada, backup/restore conferido, dry run, varredura de configuração.
- Observabilidade ativa; rollout progressivo e rollback testado.
- Atendimento e incident response de prontidão com contatos/SLAs reais.

## Observabilidade de produto

Traces da jornada completa (entrada, IA, decisão, ferramenta, CRM externo, outcome). Dashboards de taxa de erro, latência, filas, custos, qualidade de dados e adoção. Nunca registrar credenciais ou payloads desnecessários.
