# Guia de Engenharia e Ambientes

**Onda:** W01 — Fundação de Engenharia  
**Data:** 23/10/2026  
**Status:** Implementado  

---

## 1. Estrutura do Monorepo

```text
Birth-Hub-360-New-Operation/
├── apps/
│   ├── api/                  # Backend Fastify, rotas REST, domínio e plugins
│   └── web/                  # Cockpit e interface web em React + Vite + TypeScript
├── packages/
│   ├── contracts/            # DTOs, interfaces de entidades e contratos de agentes
│   └── domain/               # Regras de negócio puras e use cases
├── infra/
│   ├── local/                # Docker Compose (PostgreSQL 16 + Redis 7) e scripts SQL
│   └── aws/                  # IaC e definições de nuvem para fases posteriores
├── docs/                     # Documentação viva, discovery, foundation e ADRs
└── planning/                 # Ondas de execução, backlog e matriz de rastreabilidade
```

---

## 2. Comandos Padronizados

Todos os comandos são executados a partir da raiz do monorepo:

| Comando | Descrição |
|---|---|
| `npm run dev:api` | Inicia a API Fastify em modo watch na porta 3001 |
| `npm run dev:web` | Inicia o servidor Vite na porta 5173 |
| `npm test` | Executa a suite de testes automatizados de todos os workspaces |
| `npm run typecheck` | Executa a verificação estática de tipos do TypeScript sem emitir arquivos |
| `npm run build` | Compila os contratos, a API e gera o bundle de produção do frontend |
| `npm run docker:up` | Sobe o PostgreSQL 16 e o Redis 7 em segundo plano |
| `npm run docker:down`| Encerra os contêineres locais |
| `npm run validate:blueprint` | Valida a integridade dos arquivos e do roadmap de ondas |

---

## 3. Diretrizes de Segurança na Fundação

1. **Gestão de Segredos:** Nunca comitar arquivos `.env` ou chaves de API. Utilizar exclusivamente variáveis de ambiente ou Secrets Manager em produção.
2. **Dependências Auditadas:** Utilização estrita do `package-lock.json` e execução de `npm ci` no pipeline de CI.
3. **Branch Protection:** A branch `main` é protegida e exige status check verde e aprovação de PR antes de qualquer merge.
