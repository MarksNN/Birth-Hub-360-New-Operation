#!/usr/bin/env python3
"""Validação estática do blueprint. Não testa nem certifica uma aplicação."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    'README.md', 'docs/01-PLANO-MESTRE.md', 'docs/02-ARQUITETURA.md',
    'docs/03-ROADMAP-ONDAS.md', 'docs/04-PRODUTO-E-UX.md',
    'docs/05-MIGRACAO-LEGADO.md', 'docs/06-AGENTES-E-IA.md',
    'docs/07-SEGURANCA.md', 'docs/08-DADOS-E-INTEGRACOES.md',
    'docs/09-OPERACAO-RELEASE.md', 'docs/10-METRICAS-NEGOCIO.md',
    'docs/11-PUBLICAR-NO-GITHUB.md', 'planning/ondas.json',
]
missing = [p for p in REQUIRED if not (ROOT / p).is_file()]
assert not missing, f'Arquivos obrigatórios ausentes: {missing}'
data = json.loads((ROOT/'planning/ondas.json').read_text(encoding='utf-8'))
assert data['status'] == 'BLUEPRINT'
waves = data['waves']
assert len(waves) == 14, f'Esperadas 14 ondas, encontradas {len(waves)}'
assert [w['id'] for w in waves] == [f'W{i:02}' for i in range(14)]
assert len({w['id'] for w in waves}) == len(waves)
assert all(w['status'] == 'PLANEJADA' for w in waves)
assert all(w['acceptance_gate'].strip() and w['deliverables'].strip() for w in waves)
print(f'OK: blueprint consistente, {len(waves)} ondas, {len(REQUIRED)} arquivos essenciais.')
print('Nota: sem aplicação, não foram executados testes de produto, segurança ou deploy.')
