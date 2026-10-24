"""Offline sample adapter; no network, personal profile, or duplicated scorer."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
from datetime import date

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
DATA = ROOT / 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'
OUT = ROOT / 'course/2026fa/submissions/nikam0420/runs'


def labeled(value, source, provenance):
    return {'value': value, 'source': source, 'provenance': provenance}


def evaluate(rows, scenario):
    """Join one exact company and derive explicit policy inputs, never defaults."""
    company = scenario['company']
    matches = [r for r in rows if r['company_name'] == company]
    if not matches:
        raise ValueError('company-missing: exact name not found')
    if len(matches) != 1:
        raise ValueError('company-ambiguous: duplicate exact-name rows')
    row = matches[0]
    try:
        approvals = float(row['Total Approvals'])
    except (ValueError, TypeError, KeyError):
        raise ValueError('approval-missing: cannot substitute zero') from None
    if not math.isfinite(approvals) or approvals < 0:
        raise ValueError('approval-invalid')
    live = scenario.get('liveness_factor')
    if type(live) not in (int, float) or live not in (0, 1):
        raise ValueError('liveness-missing-or-invalid: explicit sample input required')
    lag = scenario.get('hiring_lag_days')
    if type(lag) is not int or lag <= 0:
        raise ValueError('hiring-lag-invalid: positive integer required')
    try:
        as_of = date.fromisoformat(scenario['as_of'])
        deadline = date.fromisoformat(scenario['fictional_deadline'])
    except (ValueError, KeyError, TypeError):
        raise ValueError('date-invalid: ISO date required') from None
    days_left = (deadline - as_of).days
    fit = scenario.get('fit_input')
    if type(fit) not in (int, float) or not math.isfinite(fit) or not 0 <= fit <= 1:
        raise ValueError('fit-invalid: explicit finite value in [0,1] required')
    # Binary evidence-presence policy, NOT an estimated visa probability.
    sponsor_signal = 1 if approvals > 0 else 0
    timeline = 1 if days_left >= lag else 0
    role = {
        'role_id': scenario['id'], 'company': company,
        'title': 'Data analyst — fictional posting',
        'sponsorship': {'p': sponsor_signal, 'tier': 'Likely' if sponsor_signal else 'None',
                        'source': 'your-input'},
        'fit': {'p': fit, 'source': 'your-input'},
        'liveness': {'factor': live, 'source': 'your-input'},
        'timeline': {'factor': timeline, 'source': 'your-input'},
    }
    evidence = {
        'scenario_id': labeled(scenario['id'], 'your-input', 'fictional scenario fixture'),
        'company': labeled(company, 'record', 'exact-name company_name CSV row'),
        'approvals': labeled(approvals, 'record', 'CSV Total Approvals; aggregate upstream field, not independently revalidated DOL data'),
        'listed_titles': labeled(row['top_job_titles_sponsored'], 'record', 'CSV top_job_titles_sponsored; descriptive only, not role/SOC proof'),
        'sponsor_signal': labeled(sponsor_signal, 'your-input', 'declared binary policy: approvals > 0; not a probability'),
        'sponsor_tier': labeled(role['sponsorship']['tier'], 'your-input', 'conservative policy uses Likely, never Proven'),
        'fit': labeled(fit, 'your-input', 'fictional self-rating; no model inference'),
        'as_of': labeled(scenario['as_of'], 'your-input', 'frozen fictional scenario date'),
        'deadline': labeled(scenario['fictional_deadline'], 'your-input', 'fictional last feasible start date; not a legal OPT calculation'),
        'days_left': labeled(days_left, 'your-input', 'deterministic subtraction of fictional dates'),
        'hiring_lag_days': labeled(lag, 'your-input', 'assumed elapsed calendar days; not measured employer hiring time'),
        'liveness': labeled(live, 'your-input', 'simulated active/closed posting; NO live ATS verification'),
        'timeline': labeled(timeline, 'your-input', 'declared policy: days_left >= hiring_lag_days'),
    }
    return role, evidence


def run(fixture, out_dir=OUT):
    # Only write into this student's output namespace, even when used in tests.
    out_dir = Path(out_dir).resolve()
    if not out_dir.is_relative_to(OUT.resolve()):
        raise ValueError('output-outside-student-namespace')
    scenarios = json.loads(Path(fixture).read_text())
    if not isinstance(scenarios, list) or not scenarios:
        raise ValueError('scenario-list-required')
    with DATA.open(newline='') as f:
        rows = list(csv.DictReader(f))
    pairs = [evaluate(rows, s) for s in scenarios]  # Validate ALL before writing.
    out_dir.mkdir(parents=True, exist_ok=True)
    roles_file = out_dir / 'roles.json'
    roles_file.write_text(json.dumps([r for r, _ in pairs], indent=2) + '\n')
    subprocess.run(['node', str(ROOT / 'scripts/score/role-scorer.mjs'),
                    str(roles_file), '--out-dir', str(out_dir)], cwd=ROOT, check=True)
    scored = json.loads((out_dir / 'role-scores.json').read_text())
    by_id = {r['role_id']: r for r in scored['roles']}
    audit = []
    for role, evidence in pairs:
        result = by_id[role['role_id']]
        action = ('Skip this simulated application; optionally research networking.'
                  if result['recommendation'] == 'Skip'
                  else 'Hold for human evidence review; only then research/tailor.')
        audit.append({'evidence': evidence,
            'conditional_decision': labeled(result['recommendation'], 'your-input', 'existing scorer applied to declared sample policies; not independent empirical evidence'),
            'composite': labeled(result['composite'], 'your-input', 'existing scorer arithmetic on recorded and assumed inputs'),
            'human_gate': labeled('pending', 'your-input', 'no human approval recorded'),
            'next_action': labeled(action, 'your-input', 'recipe action policy'),
            'scorer_trace': result['trace']})
    log = {
        'source_file': labeled(str(DATA.relative_to(ROOT)), 'record', 'shipped repository CSV'),
        'source_sha256': labeled(hashlib.sha256(DATA.read_bytes()).hexdigest(), 'record', 'hash of exact local bytes'),
        'mode': labeled('sample-only', 'your-input', 'offline fictional posting/date inputs'),
        'rows': audit,
    }
    (out_dir / 'agent-log.json').write_text(json.dumps(log, indent=2) + '\n')
    lines = ['# Analyst OPT triage — sample report', '', '## Executive summary', '',
        'This demonstration compares three fictional posting scenarios using a stored company record and explicit timeline assumptions. It helps a student see why an application should wait or be skipped. All results stop at human review; no current posting or sponsorship commitment was verified.', '',
        '## Results', '', '| Scenario | Conditional result | Composite | Next action |',
        '|---|---|---|---|']
    for row in audit:
        lines.append(f"| {row['evidence']['scenario_id']['value']} | {row['conditional_decision']['value']} | {row['composite']['value']} | {row['next_action']['value']} |")
    lines += ['', '## Evidence boundary', '',
        'Record: exact company name, aggregate approvals, listed titles, source path and source-byte hash. These are verified against the shipped CSV, not independently against current DOL filings.', '',
        'Your-input: fictional dates, hiring lag, simulated posting liveness, self-rated fit, sponsorship presence policy, conditional recommendations and computed timeline. These are not empirical probabilities or immigration advice. No model-judgment values are used.', '',
        '## Human hard stop', '',
        'Approval remains pending. Before any real application, a person must inspect current posting liveness, confirm role-specific sponsorship with the employer, validate their actual timing with the appropriate advisor, and record name/date/evidence. This offline sample does not clear that gate.', '',
        '## Known gaps', '',
        'Company aggregates cannot prove this particular Data Analyst role is sponsored. Funding is unused. Role-quality weight remains zero in the existing scorer. No live ATS check or legal deadline calculation was implemented. Scorer weights and Consider floor are inherited, including its documented unsettled defaults.', '',
        '## Provenance', '', f"Source: `{DATA.relative_to(ROOT)}`; see agent-log.json for hash and each value label. Raw scorer trace: role-scores.json. All files remain in the student namespace."]
    (out_dir / 'human-report.md').write_text('\n'.join(lines) + '\n')
    print('Sample-only; current liveness NOT verified; human gate PENDING.')
    for row in audit:
        print(f"{row['evidence']['scenario_id']['value']}: {row['conditional_decision']['value']} composite={row['composite']['value']} days_left={row['evidence']['days_left']['value']}")
    print('Outputs: ' + str(out_dir.relative_to(ROOT)) + '/agent-log.json + human-report.md')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--fixture', type=Path, default=HERE / 'fixtures/scenarios.json')
    args = p.parse_args()
    try:
        run(args.fixture)
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as e:
        print(f'BLOCKED: {e}', file=sys.stderr)
        sys.exit(2)
