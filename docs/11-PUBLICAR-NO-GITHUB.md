# Publicação do novo repositório GitHub

**Importante:** Este pacote é um repositório Git local inicializado e com commit. **A publicação remota não foi executada** pela ferramenta que gerou o plano, porque sua conexão com GitHub não possui endpoint de criação de repositórios.

## Recomendações

- Nome: `MarksNN/Birthub-360-Full-Operation`
- Visibilidade inicial: **private** (segurança durante bootstrap)
- Branch: `main`
- Não configurar fork nem template do legado; criar repositório novo.

## Via GitHub CLI (no terminal já autenticado)

```bash
gh auth status
cd Birthub-360-Full-Operation
gh repo create MarksNN/Birthub-360-Full-Operation --private --source=. --remote=origin --push
```

Se já existir o repositório remoto criado vazio na interface, use:

```bash
cd Birthub-360-Full-Operation
git remote add origin https://github.com/MarksNN/Birthub-360-Full-Operation.git
git push -u origin main
```

Não executar ambos os caminhos; escolher de acordo com o estado real. Se `gh repo create` não tiver permissão, solicitar uma credencial/conta com permissão legítima de criação. **Não** embutir PAT em scripts.

## Depois de publicar

1. Habilitar proteção da `main`, PR obrigatório e checks exigidos.
2. Configurar dependabot/secret scan e permissões mínimas do token de Actions.
3. Criar labels/roadmap issues W00..W13 a partir de `planning/ondas.json`.
4. Definir owners e aprovação independente para segurança, IA e migração.
5. Executar `python3 scripts/validate_blueprint.py` e conferir workflow.
6. Criar issues de decisões pendentes (ICP, stack final, dados, SLAs, preço).

## Prompt para agente com acesso legítimo ao GitHub

Consulte `prompts/00-CODEX-PUBLICAR-E-EXECUTAR.md`. O plano não autoriza deploy nem migração de dados reais.
