# Arquitetura de Isolamento Multi-Tenant e RBAC

**Onda:** W02 — Identidade e Isolamento  
**Data:** 23/10/2026  
**Status:** Implementado  

---

## 1. Modelo de Identidade e Tenants

O Birthub 360 Full Operation adota workspaces estritamente isolados por **Organização (Tenant)**:

```text
[Organização / Tenant]
       │
       ├── Membros (Usuários com papéis RBAC específicos)
       ├── Clientes e Contatos (Isolados por RLS)
       ├── Oportunidades e Pipelines (Isolados por RLS)
       ├── Configurações de Conectores (Bitrix24)
       └── Trilhas de Auditoria (Logs imutáveis)
```

---

## 2. Papéis e Níveis de Autorização (RBAC)

| Papel (`role`) | Escopo | Permissões Principais |
|---|---|---|
| `owner` | Tenant completo | Faturamento, exclusão de workspace, gestão total de membros e segurança |
| `admin` | Administrativo | Convidar membros, gerenciar integrações, visualizar auditoria e métricas |
| `manager` | Gestão comercial | Visualizar pipelines de todos os vendedores, aprovar propostas e metas |
| `sales` | Operacional | Visualizar e editar suas próprias oportunidades, executar tarefas, usar Copilot |
| `analyst` | Somente leitura | Visualizar relatórios e dashboards analíticos sem permissão de mutação |
| `integration_service` | Automação / API | Ingestão e sincronização externa restrita ao tenant de emissão |

---

## 3. Resolução de Sessão e Interceptação Fail-Closed

1. Toda requisição privada enviada à API passa pelo hook de autenticação Fastify.
2. O token Bearer é validado contra a sessão ativa e confere o `tenantId` correspondente.
3. Se o token for inexistente, expirado ou o usuário estiver inativo, a requisição é abortada com **HTTP 401 Unauthorized**.
4. Se o usuário tentar acessar dados cujo `tenant_id` seja diferente da sua sessão, a requisição é abortada com **HTTP 403 Cross-Tenant Violation**.
