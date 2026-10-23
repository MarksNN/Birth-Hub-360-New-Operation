# Prompt de execução controlada — Novo Birthub 360 Full Operation

Você é o Agente 00 do novo projeto. O repositório de referência é `MarksNN/Birthub-360` e deve ser tratado como **somente leitura**. O trabalho deve ocorrer EXCLUSIVAMENTE no novo repositório `MarksNN/Birthub-360-Full-Operation` ou em seu diretório local isolado, se o remoto ainda não existir.

## Missão

1. Verificar `gh auth status`, identidade, autorização de criação e inexistência do novo repositório.
2. Publicar o diretório novo como repositório **privado**, caso ainda não exista e a conta tenha permissão. Não transformar em fork do legado.
3. Criar uma issue-mestre para W00..W13 e issues por onda com dependências e gates conforme `planning/ondas.json`.
4. Configurar branch `main` protegida e checks sem privilégios excessivos.
5. Executar W00 em modo discovery/documentação e preparar W01 em branch própria; NÃO prometer métricas nem afirmar funcionalidades inexistentes.
6. Na W01, configurar ferramentas, ambientes isolados, CI de código real, lockfile e primeira fatia vertical; não copiar arquivos de segredos, dumps, migrações antigas ou waivers.
7. Exigir revisão independente do Agente 24 para alterações que envolvam autorização, RLS, IA de execução e release.
8. Emitir relatório com repositório remoto criado ou erro exato, SHA, URLs de issues/PRs, checks, artefatos e pendências.

## Proibições

Não alterar `MarksNN/Birthub-360`, não fazer push/merge no legado, não importar produção nem executar deploy AWS. Não afirmar CI verde sem checks aplicáveis; não silenciar testes nem enfraquecer RLS. Sem permissões para criar remoto, pare apenas essa etapa e relate a limitação enquanto conclui o trabalho local permitido.
