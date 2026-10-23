# Plano de Rollback e Estratégia de Deploy

**Onda:** W01 — Fundação de Engenharia  
**Data:** 23/10/2026  
**Status:** Implementado  

---

## 1. Princípios de Reversibilidade

Nenhum deploy para qualquer ambiente (staging ou produção) é autorizado sem um procedimento comprovado de reversão rápida (rollback).

1. **Deploy Imutável e Baseado em Imagens/Artifacts:** Toda release gera uma imagem ou bundle estático associado a um commit SHA exato.
2. **Padrão Expand-Contract para Migrações de Banco:**
   - **Fase 1 (Expand):** Adiciona colunas e tabelas como opcionais (nullable) mantendo compatibilidade com a versão anterior do código.
   - **Fase 2 (Deploy do Código):** Código passa a ler e escrever na nova estrutura.
   - **Fase 3 (Contract):** Remoção de colunas legadas e aplicação de constraints obrigatórias somente após a estabilização completa da versão.

---

## 2. Procedimentos de Reversão Operacional

### Cenário A: Falha na Aplicação Web / API após Deploy
1. **Identificação:** Alarme de disponibilidade, taxa de erro 5xx > 1% ou teste de fumaça pós-deploy reprovado.
2. **Ação:** Rollback imediato no ECS / CDN para o SHA do artefato anterior através do comando de release ou apontamento de tráfego.
3. **Tempo Alvo de Reversão (MTTR):** < 5 minutos.

### Cenário B: Falha com Migração Pendente no Banco
1. Como o modelo é Expand-Contract, o código anterior continua funcional contra o banco que recebeu a migração de expansão.
2. Não executar `DROP COLUMN` ou rollback destrutivo em quente; manter a migração em estado de compatibilidade até análise da causa raiz (RCA).

---

## 3. Demonstração Local de Reversibilidade

No ambiente local e de desenvolvimento, a reversibilidade é validada através do histórico Git e volumes do Docker Compose:

```bash
# Simulação de reversão de código
git checkout HEAD~1
npm test && npm run build

# Restauração limpa do ambiente de banco
npm run docker:down -v
npm run docker:up
```
