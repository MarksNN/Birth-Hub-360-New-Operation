import json
import subprocess
import sys

REPO = "MarksNN/Birth-Hub-360-New-Operation"

def run_cmd(args):
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        print(f"Command failed: {' '.join(args)}\nError: {result.stderr}", file=sys.stderr)
    return result

def ensure_label(name, color, description):
    res = run_cmd(["gh", "label", "create", name, "--description", description, "--color", color, "--repo", REPO, "--force"])
    if res.returncode == 0:
        print(f"Label '{name}' verified/created.")

def main():
    labels = [
        ("wave", "1D76DB", "Onda de execucao do roadmap"),
        ("epic", "3E4B9E", "Issue-mestre ou epico de acompanhamento"),
        ("P0", "B60205", "Prioridade critica P0"),
        ("P1", "D93F0B", "Prioridade alta P1"),
        ("P2", "FBCA04", "Prioridade media/baixa P2"),
        ("discovery", "0E8A16", "Descoberta, validacao de produto e UX"),
        ("security", "D93F0B", "Seguranca, isolamento e auditoria"),
        ("governance", "5319E7", "Governanca, parecer Agente 24 e conformidade"),
    ]

    for name, color, desc in labels:
        ensure_label(name, color, desc)

    with open("planning/ondas.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    waves = data["waves"]
    created_issues = {}

    for wave in waves:
        wid = wave["id"]
        title = f"[{wid}] {wave['name']}"
        body = f"""## Visão Geral — {wid}: {wave['name']}

**Prioridade:** {wave['priority']}  
**Responsável:** {wave['owner']}  
**Status Atual:** {wave['status']}  

### Objetivo
{wave['objective']}

### Entregáveis Esperados
{wave['deliverables']}

### Gate de Aceite
{wave['acceptance_gate']}

### Saídas Exigidas (DoD)
- [ ] Issue de escopo detalhada e branch própria criada
- [ ] Implementação / Documentação com rastreabilidade
- [ ] Testes automáticos e logs com commit SHA exato
- [ ] Avaliação de segurança / UX / isolamento aplicável
- [ ] Parecer independente do Agente 24 registrado
- [ ] Plano de rollback e verificação de reversibilidade
- [ ] Atualização da matriz de rastreabilidade e gates

---
*Referência:* `docs/03-ROADMAP-ONDAS.md` e `PLANO-MESTRE-FULL-OPERATION.html`
"""
        labels_to_apply = ["wave", wave["priority"]]
        if wid == "W00":
            labels_to_apply.append("discovery")
        elif wid in ["W02", "W10"]:
            labels_to_apply.append("security")

        cmd = [
            "gh", "issue", "create",
            "--repo", REPO,
            "--title", title,
            "--body", body,
            "--label", ",".join(labels_to_apply)
        ]
        res = run_cmd(cmd)
        if res.returncode == 0:
            url = res.stdout.strip()
            created_issues[wid] = (title, url)
            print(f"Criada issue {wid}: {url}")
        else:
            print(f"Falha ao criar issue {wid}: {res.stderr}")

    # Criar a Issue-Mestre
    epic_body = """# Birthub 360 Full Operation — Plano-Mestre de Execução

Repositório independente de reconstrução e operação da plataforma de **Revenue Intelligence + Commercial Operations + Governed AI**.

**Fonte de verdade:** `PLANO-MESTRE-FULL-OPERATION.html` e `docs/01-PLANO-MESTRE.md`.  
**Repositório de referência técnica (somente leitura):** `MarksNN/Birthub-360`.

---

## Ondas de Execução e Status

| Onda | Nome | Prioridade | Responsável | Issue | Gate de Aceite |
|---|---|---|---|---|---|
"""
    for wave in waves:
        wid = wave["id"]
        title, url = created_issues.get(wid, (wave["name"], "#"))
        epic_body += f"| {wid} | {wave['name']} | {wave['priority']} | {wave['owner']} | [{wid}]({url}) | {wave['acceptance_gate']} |\n"

    epic_body += """
---

## Checklist Geral de Execução
- [ ] **W00:** Estratégia e discovery (ICP, personas, JTBD, scorecard de valor e critérios de MVP)
- [ ] **W01:** Fundação de engenharia (Monorepo, CI, lockfile, ADRs, ambientes isolados)
- [ ] **W02:** Identidade e isolamento (Multi-tenant fail-closed, RLS, RBAC, auditoria)
- [ ] **W03:** Design system e workspace (Componentes, acessibilidade WCAG 2.2 AA)
- [ ] **W04:** CRM operacional (Empresas, contatos, leads, pipeline E2E)
- [ ] **W05:** Integrações e sincronização (Bitrix24, outbox, idempotência, reconciliação)
- [ ] **W06:** Inteligência comercial (ICP Fit, sinais, radar, previsibilidade explicável)
- [ ] **W07:** Copiloto e agentes seguros (Gateway multi-modelo, tool registry governado)
- [ ] **W08:** Automações e engajamento (Cadências, propostas, opt-out, trilhas)
- [ ] **W09:** RevOps e monetização (Forecast com intervalos, ledger de custos IA, billing)
- [ ] **W10:** Segurança e confiabilidade avançadas (DR, backups testados, SLOs, zero críticos)
- [ ] **W11:** Pilotos controlados (Clientes reais, telemetria, retenção inicial)
- [ ] **W12:** GA Full Operation (Release go/no-go, contratos, suporte, rollout progressivo)
- [ ] **W13:** Expansão enterprise (Mobile offline, voice advanced sob demanda)

## Princípios Inegociáveis
1. Isolamento multi-tenant **fail-closed** com RLS real e autorização de serviço.
2. MVP ponta a ponta antes de dispersão funcional.
3. Agentes com ferramentas limitadas, human-in-the-loop e auditoria completa.
4. Sem cópia cega de segredos, dumps ou migrações antigas do legado.
5. Todo merge na `main` exige CI verde no SHA e aprovação independente.
"""

    res_epic = run_cmd([
        "gh", "issue", "create",
        "--repo", REPO,
        "--title", "Birthub 360 Full Operation — Issue-Mestre de Acompanhamento (W00 a W13)",
        "--body", epic_body,
        "--label", "epic,P0,governance"
    ])
    if res_epic.returncode == 0:
        print(f"Criada Issue-Mestre: {res_epic.stdout.strip()}")
    else:
        print(f"Falha ao criar Issue-Mestre: {res_epic.stderr}")

if __name__ == "__main__":
    main()
