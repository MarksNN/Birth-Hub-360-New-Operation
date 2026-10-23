# Segurança, LGPD, isolamento e confiabilidade

## Modelo Zero Trust para o produto

- Toda rota privada verifica identidade, tenant, capability e recurso.
- Em PostgreSQL, executar runtime com usuário sem `BYPASSRLS`, sem superuser, com RLS apropriado e testes de políticas.
- Garantir que jobs, webhooks, exportações, objetos e cache não reutilizem contextos de organizações diferentes.
- Roles de implantação e migração são diferentes da role runtime.
- Segredos em Secrets Manager ou equivalente, nunca no repositório nem enviados a prompts.

## Dados pessoais

- Mapeamento de controlador/operador e base legal por tratamento; inventário de finalidade e retenção.
- Consentimentos e preferências de contato com histórico de revogação; não confundir legítimo interesse com consentimento automático.
- Direitos dos titulares, exportação/retificação/exclusão sujeita a retenções legais; trilha de prova.
- Minimização e pseudonimização; DLP e classificação de dados.
- Revisão jurídica/LGPD antes de colocar prospecção e comunicação automatizada em produção.

## Proteções de IA

- Validação de tool input/output e do escopo de cada ferramenta.
- Rejeitar instruções provenientes de conteúdo não confiável que contrariem a política do sistema.
- Confirmação para mutações sensíveis, massa, contratos, despesas e comunicação externa.
- Orçamento/timeout por tarefa, controles de volume e detecção de abuso.

## AppSec e supply chain

- Secret scanning; análise estática e dependências; SBOM; verificação de imagens; builds reproduzíveis com lockfile; branch protegida; PR obrigatório.
- Threat modeling por contexto; pentest antes de GA; issue de segurança com owner e SLA.
- Política de exceções com prazo, responsável, justificativa, mitigação, aprovação independente; jamais waiver indiscriminado.

## Backups, DR e incidentes

- RPO/RTO a definir com requisitos de negócio; backup criptografado; teste real periódico de restore.
- Logs e métricas estruturados com request ID, trace ID, actor e tenant tratados sem exposição de PII.
- Runbooks para credenciais vazadas, fila travada, corrupção, interrupção do CRM externo, erro de migração e falha de tenant isolation.
- Release em etapas, com rollback de app e migrações expand-contract.

## SLOs iniciais a validar

- Disponibilidade/API: hipótese de 99,9% mensal para rotas críticas após readiness.
- Definir p95 de API por operação e perfil de carga com baseline.
- Atraso de sincronização mensurado por origem, janela e tipo de operação.
- Zero tolerância a vazamento comprovado de tenant e execução fora de política.

Não divulgar um SLO como cumprido antes da telemetria demonstrá-lo.
