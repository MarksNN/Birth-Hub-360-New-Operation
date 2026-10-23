# Matriz de Permissões e Evidências de Testes Adversariais Cross-Tenant

**Onda:** W02 — Identidade e Isolamento  
**Data:** 23/10/2026  
**Status:** Implementado e Testado  

---

## 1. Matriz de Autorização por Rota e Papel

| Rota | Método | Papéis Permitidos | Status Não Autorizado |
|---|---|---|---|
| `/api/v1/auth/login` | POST | Público (qualquer visitante) | 401 (se credencial incorreta) |
| `/api/v1/organizations/me` | GET | Qualquer membro autenticado | 401 |
| `/api/v1/organizations/members` | GET | Qualquer membro autenticado | 401 |
| `/api/v1/organizations/members` | POST | `owner`, `admin` | 403 Forbidden |
| `/api/v1/audit/logs` | GET | `owner`, `admin` | 403 Forbidden |
| `/api/v1/tenants/:targetTenantId/data` | GET | Apenas se `targetTenantId == session.tenantId` | 403 Cross-Tenant Violation |

---

## 2. Cenários de Testes Automatizados Implementados

Os seguintes testes são executados em `apps/api/tests/identity.test.ts`:

1. **Autenticação Válida:** Login com e-mail e senha válidos emite token com tenant e perfil atribuídos.
2. **Autenticação Inválida:** Credenciais incorretas rejeitadas com HTTP 401.
3. **Fail-Closed em Rotas Protegidas:** Chamadas sem header de autenticação rejeitadas com HTTP 401.
4. **Ataque Cross-Tenant Simulado:** Usuário autenticado na Organização Alpha tenta acessar a rota de dados da Organização Beta; a API intercepta e rejeita com HTTP 403 (`CROSS_TENANT_VIOLATION`).
5. **Tentativa de Escalação de Privilégio (RBAC):** Usuário com papel `sales` tenta cadastrar novo membro; a API rejeita com HTTP 403 (`FORBIDDEN`).
6. **Ação Administrativa com Auditoria:** Usuário `admin` cadastra membro e a operação gera registro imutável na tabela de auditoria com ator, recurso e timestamp.
