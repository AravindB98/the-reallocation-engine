"""Cross-check recorded sample output against source CSV and independent rerun."""
import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DATA = ROOT / 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('run_root', type=Path)
a = parser.parse_args()
first = json.loads((a.run_root / 'run/run.json').read_text())
second = json.loads((a.run_root / 'repeat/run.json').read_text())
assert first == second, 'independent rerun differs'
with DATA.open(newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
assert first['dataset_rows']['value'] == len(rows)
assert first['dataset_sha256']['value'] == hashlib.sha256(DATA.read_bytes()).hexdigest()
nulls = {'', 'null', 'NULL', 'None', 'none', 'NaN', 'nan', 'N/A', 'n/a'}
cols = ['Total Approvals', 'Total Denials', 'Approval_Rate', 'median_salary_offered', 'top_job_titles_sponsored']
populated = sum(any((r.get(k) or '').strip() not in nulls for k in cols) for r in rows)
audit = (a.run_root / 'evidence/h1b-audit-report.txt').read_text()
assert f'{len(rows):,}' in audit and f'{populated:,}' in audit
for role in first['roles']:
    matches = [r for r in rows if r['company_name'] == role['company']['value']]
    assert role['exact_company_match']['value'] == (len(matches) == 1)
    if len(matches) == 1:
        assert role['historical_approvals_raw']['value'] == (matches[0]['Total Approvals'] or None)
    if any(role[k]['value'] is None for k in ['liveness_gate', 'timeline_gate']):
        assert role['action']['value'] in ['Blocked', 'Skip']
assert first['human_clearance']['value'] == 'pending'
print(f'CSV rows independently counted: {len(rows)}')
print(f'Rows with any H-1B field populated: {populated}; matches maintained audit')
print('All exact-name lookups and raw approval values agree with source CSV')
print('SHA-256 source hash verified; independent rerun JSON identical')
print('Unknown gates never recommend Apply; human clearance remains pending')
print('Outcome counts: ' + json.dumps(dict(Counter(r['action']['value'] for r in first['roles'])), sort_keys=True))
