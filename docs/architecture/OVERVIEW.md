# Arquitetura Full Operation

## Decisoes iniciais
- Monolito modular com fronteiras de dominio.
- API independente do frontend.
- PostgreSQL como fonte transacional.
- RLS e autorizacao por organizacao.
- Integracoes por adaptadores.
- Jobs assincronos com idempotencia.
- Agentes sujeitos a politicas e auditoria.
- OpenAPI e testes de contrato antes da expansao.

## Diretriz
Nao migrar codigo legado sem avaliacao,
testes, seguranca e ownership definido.