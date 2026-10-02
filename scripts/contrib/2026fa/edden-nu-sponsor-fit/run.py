"""Offline sample prototype. Python standard library + Node 20+. No network."""
import argparse
import csv
import hashlib
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
DATA = ROOT / 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'
PERSONA = ROOT / 'search/examples/aarav-patel/resume.example.json'
DEFAULT_OUT = ROOT / 'course/2026fa/submissions/edden-nu/runs/sample-01'
LABELS = {'record', 'model-judgment', 'your-input'}


def labeled(value, source, evidence):
    assert source in LABELS
    return {'value': value, 'source': source, 'evidence': evidence}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def load_cases(path):
    payload = json.loads(path.read_text())
    require(payload.get('synthetic') is True, 'sample-only: synthetic=true required')
    as_of = date.fromisoformat(payload['as_of'])
    cases = payload['cases']
    require(isinstance(cases, list) and len(cases) > 0, 'cases must be a nonempty list')
    ids = set()
    for c in cases:
        for field in ['id', 'company', 'title', 'policy_quote', 'required_skill']:
            require(isinstance(c.get(field), str) and bool(c[field].strip()), f'missing/invalid {field}')
        require(c['id'] not in ids, 'duplicate case id')
        ids.add(c['id'])
        require(c.get('policy') in ('yes', 'no', 'unknown'), 'invalid policy')
        for key in ['earliest_start', 'deadline']:
            require(key in c, f'missing {key}; use null for unknown')
            if c[key] is not None:
                date.fromisoformat(c[key])
        s = c.get('snapshot')
        require(isinstance(s, dict), 'snapshot required')
        require(type(s.get('status')) is int and 100 <= s['status'] <= 599, 'invalid HTTP status')
        require(isinstance(s.get('bodyText'), str), 'bodyText required')
        require(isinstance(s.get('applyControls'), list) and all(isinstance(x, str) for x in s['applyControls']), 'applyControls required')
    return cases, as_of


def build(fixture=HERE / 'fixtures/cases.json', dataset=DATA):
    cases, as_of = load_cases(fixture)
    with dataset.open(newline='', encoding='utf-8') as stream:
        reader = csv.DictReader(stream)
        required = {'company_name', 'website', 'Total Approvals', 'top_job_titles_sponsored'}
        require(required.issubset(reader.fieldnames or []), 'dataset missing required columns')
        rows = list(reader)
    index = {}
    for line, row in enumerate(rows, 2):
        index.setdefault(row['company_name'], []).append((line, row))
    persona = json.loads(PERSONA.read_text())
    skills = persona['skills']['languages'] + persona['skills']['backend_automation'] + persona['skills']['database_cloud'] + persona['skills']['devops_cicd']
    proc = subprocess.run(['node', str(HERE / 'liveness.mjs')], input=json.dumps([c['snapshot'] for c in cases]), text=True, capture_output=True, check=True)
    live_results = json.loads(proc.stdout)
    require(len(live_results) == len(cases), 'classifier result count mismatch')
    output = []
    for c, live in zip(cases, live_results):
        matches = index.get(c['company'], [])
        match = len(matches) == 1
        line, row = matches[0] if match else (None, {})
        raw = row.get('Total Approvals', '')
        history = 'unknown'
        if raw:
            count = float(raw)
            require(count >= 0 and count == count and count != float('inf'), 'invalid approval count')
            history = 'populated-positive' if count > 0 else 'stored-zero'
        start, end = c['earliest_start'], c['deadline']
        timeline = None if start is None or end is None else date.fromisoformat(start) <= date.fromisoformat(end) and as_of <= date.fromisoformat(end)
        # A short-page classification is not proof that a requisition is closed.
        live_gate = None if live['result'] == 'uncertain' or live['code'] == 'insufficient_content' else live['result'] == 'active'
        # A visible Apply button on an HTTP error page is not healthy evidence.
        if c['snapshot']['status'] not in (404, 410) and not 200 <= c['snapshot']['status'] < 300:
            live_gate = None
        skill_match = c['required_skill'].casefold() in {s.casefold() for s in skills}
        if live_gate is False:
            action, why, next_step = 'Skip', 'closed-liveness-gate', 'Skip this opening; inspect other openings before networking.'
        elif timeline is False:
            action, why, next_step = 'Skip', 'closed-timeline-gate', 'Skip under the explicit fictional timing assumptions.'
        elif not match or live_gate is None or timeline is None:
            action, why, next_step = 'Blocked', 'missing-or-uncertain-evidence', 'Resolve employer identity, page status, or timing before an application decision.'
        elif c['policy'] == 'no':
            action, why, next_step = 'Skip', 'explicit-policy-restriction', 'Do not tailor for this fictional opening; do not infer a company-wide restriction.'
        elif not skill_match:
            action, why, next_step = 'Consider', 'skill-evidence-gap', 'Build or locate a relevant portfolio artifact during credibility time.'
        elif c['policy'] == 'unknown':
            action, why, next_step = 'Consider', 'role-policy-unknown', 'Prepare a role-specific sponsorship question for networking; do not send automatically.'
        else:
            action, why, next_step = 'Apply', 'candidate-for-human-review', 'Human reviews evidence first; only then tailor an application. No automatic submission.'
        source_ref = f'{DATA.relative_to(ROOT)} record {line}' if dataset == DATA else f'test fixture record {line}'
        input_ref = f'synthetic case {c["id"]}; not an employer statement'
        output.append({
            'id': labeled(c['id'], 'your-input', input_ref),
            'company': labeled(c['company'], 'your-input', input_ref),
            'title': labeled(c['title'], 'your-input', input_ref),
            'policy': labeled(c['policy'], 'your-input', input_ref),
            'policy_quote': labeled(c['policy_quote'], 'your-input', input_ref),
            'exact_company_match': labeled(match, 'record', 'exact-key lookup in CSV; original H-1B identity join not validated'),
            'historical_approvals_raw': labeled(raw or None, 'record', source_ref),
            'historical_state': labeled(history, 'record', source_ref + '; blank remains unknown'),
            'historical_titles': labeled(row.get('top_job_titles_sponsored') or None, 'record', source_ref),
            'required_skill': labeled(c['required_skill'], 'your-input', input_ref),
            'skill_list_match': labeled(skill_match, 'record', str(PERSONA.relative_to(ROOT)) + ' skills lists; not proficiency verification'),
            'liveness_result': labeled(live['result'], 'record', 'actual upstream classifier output on synthetic input'),
            'liveness_reason': labeled(live['code'], 'record', 'scripts/ats/liveness-core.mjs on synthetic input'),
            'liveness_gate': labeled(live_gate, 'model-judgment', 'reason-aware routing; insufficient_content stays unknown'),
            'earliest_start': labeled(start, 'your-input', input_ref),
            'deadline': labeled(end, 'your-input', input_ref + '; not a legal eligibility date'),
            'timeline_gate': labeled(timeline, 'model-judgment', 'date comparison over fictional assumptions; unknown stays null'),
            'action': labeled(action, 'model-judgment', 'ordered rules in run.py; Apply remains pending human review'),
            'reason': labeled(why, 'model-judgment', 'ordered rules in run.py'),
            'next_step': labeled(next_step, 'model-judgment', '3-3-2 allocation suggestion, not measured benefit'),
        })
    return {
        'sample_only': labeled(True, 'your-input', 'fixtures/cases.json'),
        'as_of': labeled(as_of.isoformat(), 'your-input', 'fictional scenario date'),
        'dataset_sha256': labeled(hashlib.sha256(dataset.read_bytes()).hexdigest(), 'record', 'SHA-256 of actual input bytes'),
        'dataset_rows': labeled(len(rows), 'record', 'CSV parser row count'),
        'human_clearance': labeled('pending', 'record', 'no human approval collected; no applications executed'),
        'roles': output,
    }


def render(result):
    lines = ['# Sponsorship evidence triage', '', '## Executive summary', '',
             'This offline sample combines real repository company records with fictional openings. Recommendations require human review. No current employer policy, visa eligibility, or live vacancy is verified.', '',
             'All scenario facts are `your-input`; file contents and observed tool outputs are `record`; routing and recommendations are `model-judgment`.', '',
             '| Case [your-input] | Action [model-judgment] | Reason [model-judgment] |', '|---|---|---|']
    for r in result['roles']:
        lines.append(f'| {r["id"]["value"]} | {r["action"]["value"]} | {r["reason"]["value"]} |')
    lines += ['', '## Per-field evidence (matches JSON)', '']
    for key, value in result.items():
        if key != 'roles':
            lines.append(f'- {key}: {json.dumps(value["value"])} [{value["source"]}] — {value["evidence"]}')
    for r in result['roles']:
        lines += ['', f'### {r["id"]["value"]} — synthetic scenario', '']
        for key, value in r.items():
            lines.append(f'- {key}: {json.dumps(value["value"])} [{value["source"]}] — {value["evidence"]}')
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fixture', type=Path, default=HERE / 'fixtures/cases.json')
    parser.add_argument('--out-dir', type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    try:
        out = args.out_dir.resolve()
        allowed = (ROOT / 'course/2026fa/submissions/edden-nu').resolve()
        require(out.is_relative_to(allowed) and out != allowed, 'out-dir must be a new directory inside the student submission folder')
        require(not out.exists(), 'output directory already exists; use a new run ID (no overwrite)')
        result = build(args.fixture.resolve())
        out.mkdir(parents=True)
        (out / 'run.json').write_text(json.dumps(result, indent=2) + '\n')
        (out / 'report.md').write_text(render(result))
        print(f'Read {result["dataset_rows"]["value"]} CSV rows; processed {len(result["roles"])} synthetic cases.')
        for r in result['roles']:
            print(f'{r["id"]["value"]}: {r["action"]["value"]} — {r["reason"]["value"]}')
        print(f'Wrote {out.relative_to(ROOT)}/run.json and report.md; human clearance pending.')
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
