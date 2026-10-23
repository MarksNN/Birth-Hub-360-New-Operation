# ADR 0003 — Migração seletiva strangler, sem fork do código

**Status:** proposta — validar W00/W01.

## Decisão

Manter o Birthub atual operacional, criar interfaces novas, portar apenas regras/integrações comprovadas e migrar por caso de uso/tenant. Separação de segredos e de bancos desde o início.

## Consequências

Coexistência temporária e necessidade de reconciliação. Evita herdar involuntariamente dívida, fragilidade de CI ou migrações antigas.
