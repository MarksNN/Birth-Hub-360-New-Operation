# Birthub 360° — Full Operation

> **Nova geração da plataforma de inteligência e execução comercial.**
> Repositório independente de planejamento, arquitetura e implantação incremental.

**Estado deste repositório:** `BLUEPRINT / ONDA W00` — planejado; **não é uma aplicação concluída**, nem um fork/cópia automática do sistema original.

## Propósito

Ser o **sistema operacional da operação de receita**: entender empresas e oportunidades, recomendar decisões e executar operações com IA de modo rastreável e controlado.

**Estratégia de entrada:** funcionar como camada inteligente sobre CRMs existentes, inicialmente Bitrix24, mantendo CRM nativo funcional e progressivamente mais completo.

## Documentação central

- [Plano-mestre](docs/01-PLANO-MESTRE.md)
- [Arquitetura de referência](docs/02-ARQUITETURA.md)
- [Roadmap por ondas e gates](docs/03-ROADMAP-ONDAS.md)
- [Produto, UX e módulos](docs/04-PRODUTO-E-UX.md)
- [Migração seletiva do projeto original](docs/05-MIGRACAO-LEGADO.md)
- [Agentes de IA e governança](docs/06-AGENTES-E-IA.md)
- [Segurança, privacidade e confiabilidade](docs/07-SEGURANCA.md)
- [Dados e integrações](docs/08-DADOS-E-INTEGRACOES.md)
- [Operação e release](docs/09-OPERACAO-RELEASE.md)
- [Economia, métricas e go-to-market](docs/10-METRICAS-NEGOCIO.md)
- [Guia de bootstrap/push](docs/11-PUBLICAR-NO-GITHUB.md)
- [Decisões arquiteturais](docs/adr/)
- [Backlog estruturado](planning/ondas.json)

## Estrutura-alvo (diretórios reservados — implementação futura)

```text
apps/
  web/                  # cockpit React/TypeScript
  api/                  # Fastify, REST/OpenAPI, domínios
  workers/              # tarefas assíncronas, outbox, jobs
packages/
  domain/               # regras de domínio, ports, use cases
  contracts/            # DTOs, Zod, OpenAPI e eventos versionados
  design-system/        # tokens, componentes e guidelines
  ai-runtime/           # ferramentas de IA e controles
  integration-kit/      # interface e adapters de conectores
infra/
  aws/                  # IaC ECS/RDS/S3/Secrets/observabilidade
  local/                # Docker Compose e ambiente isolado
planning/               # ondas, dependências e critérios
```

## Princípios não negociáveis

1. Isolamento multi-tenant **fail closed**; RLS de verdade e autorização de serviço.
2. MVP ponta a ponta antes da expansão horizontal de módulos.
3. Agentes com ferramentas limitadas, aprovação e trilha auditável.
4. Infraestrutura proporcional ao uso: monólito modular antes de microserviços.
5. **Não** copiar código, segredos, migrações ou configurações de CI do legado sem análise.
6. PR pequeno, revisão independente, testes, rollback e evidências no SHA exato.
7. LGPD, acessibilidade, resiliência e custos desde o desenho.

## Como começar

Leia o plano e execute a W00, que define ICP, personas e requisitos. Depois siga W01 para a fundação. O novo repositório deve ficar **privado** durante bootstrap. O repositório atual permanece intacto.

## Referência do sistema atual (somente leitura)

- Fonte original: https://github.com/MarksNN/Birthub-360
- Inventário inicial realizado em 23/10/2026: 52 diretórios em `src/features` e 20 workflows em `.github/workflows`.
- Esses números são uma fotografia e devem ser novamente verificados antes da migração.

## Comandos de validação deste blueprint

```bash
python3 scripts/validate_blueprint.py
```

A validação checa a integridade documental e o registro de ondas. **Não** representa CI funcional de uma aplicação ainda não implementada.
