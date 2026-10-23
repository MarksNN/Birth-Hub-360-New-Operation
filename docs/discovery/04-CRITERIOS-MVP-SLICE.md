# Discovery: Critérios do Primeiro Vertical Slice (MVP)

**Onda:** W00 — Estratégia e Discovery  
**Data:** 23/10/2026  
**Status:** Validado para Discovery / Pré-Fundação  

---

## 1. Definição do Primeiro Vertical Slice

Um **Vertical Slice** (fatia vertical) atravessa todas as camadas do sistema (Interface, API, Domínio, Banco de Dados, Fila de Mensagens e Integração Externa), comprovando a viabilidade técnica e a entrega de valor real em um fluxo único e coeso.

```
+-------------------------------------------------------------+
| UI: Tela "Hoje" (React + Design System Tokens)              |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
| API: Fastify REST com Autenticação e Autorização por Tenant  |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
| Domínio: Oportunidade, Sinal de Risco e Próxima Ação        |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
| Persistência: PostgreSQL com Row-Level Security (RLS)       |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
| Assíncrono: Outbox Pattern + Worker BullMQ / Redis          |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
| Externo: Conector Bitrix24 (Leitura inicial + Escrita tarefa)|
+-------------------------------------------------------------+
```

---

## 2. Escopo Incluso no MVP (O que entra)

1. **Gestão de Identidade e Organização:**
   - Cadastro de tenant (organização).
   - Login por e-mail e senha / token seguro.
   - Atribuição de papéis: `admin` e `sales`.

2. **Conexão Segura com Bitrix24:**
   - Configuração de credenciais (webhook / token REST).
   - Ingestão em lote de Negócios (Deals), Empresas (Companies) e Contatos (Contacts).
   - Registro de proveniência de dados (`source: bitrix24`, IDs externos mapeados).

3. **Cockpit Operacional Mínimo ("Hoje"):**
   - Lista priorizada de negócios com cards informativos.
   - Destaque visual para negócios estagnados (> 7 dias sem atividade).

4. **Copiloto de Próxima Ação (Human-in-the-Loop):**
   - Caixa de sugestão de próxima ação fundamentada em histórico.
   - Nível de autonomia A0/A1 (somente sugerir e rascunhar).
   - Botão de aprovação manual para criação de tarefa interna.

5. **Sincronização de Tarefa Aprovada:**
   - Criação da tarefa no banco do Birthub 360.
   - Envio da tarefa criada de volta ao Bitrix24 via worker assíncrono idempotente.
   - Registro de log estruturado na tabela `agent_run`.

---

## 3. Escopo Excluído do MVP (O que NÃO entra no MVP)

Para evitar dispersão de esforço e garantir entrega sólida, os seguintes itens estão **explicitamente fora** do MVP inicial:

- ❌ Telefonia, discador e canais de voz integrados.
- ❌ Envio autônomo e não supervisionado de e-mails ou mensagens de WhatsApp (A4).
- ❌ Prospecção fria e raspagem em massa de fontes não autorizadas.
- ❌ Gateway de pagamento por cartão e cobrança recorrente automatizada (usar faturamento assistido).
- ❌ Aplicativos móveis nativos (iOS e Android) — foco em web responsivo com PWA se necessário.
- ❌ Múltiplos conectores simultâneos (Salesforce, HubSpot, Pipedrive adiados para fases posteriores).

---

## 4. Critérios de Aceite (Definition of Done do Slice)

- [ ] Organização e usuário de teste criados em menos de 2 minutos.
- [ ] Ingestão de ao menos 10 negócios do Bitrix24 sem duplicatas e com RLS estrito.
- [ ] Identificação automática de ao menos 1 negócio parado pelo algoritmo do Radar.
- [ ] Exibição de recomendação contextual explicada na interface.
- [ ] Clique de aprovação do usuário gera a tarefa no Birthub e no Bitrix24 com idempotência.
- [ ] Demonstração de falha simulada de rede com recuperação automática pelo worker (sem duplicação de registro).
- [ ] Registro completo do evento em auditoria sem vazamento de PII em logs.
