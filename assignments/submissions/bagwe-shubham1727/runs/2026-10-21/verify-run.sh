#!/usr/bin/env bash
# verify-run.sh — independent checks on the 2026-10-21 live run (run from the repo root).
# Each check reads the run's outputs and compares them with a source the mode did not write.
set -u
R=assignments/submissions/bagwe-shubham1727/runs/2026-10-21
D=scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live

echo "== 1. every JSON output parses"
python3 - "$R" <<'EOF'
import json, pathlib, sys
files = sorted(pathlib.Path(sys.argv[1]).rglob('*.json'))
bad = [str(f) for f in files if not (lambda f: (json.load(open(f)), True))(f)]
print(f"{len(files)} JSON files parsed, {len(bad)} failed")
EOF

echo "== 2. sponsor numbers in the report = the 80 Days CSV row (read directly, not via the mode)"
python3 - "$R" <<'EOF'
import csv, json, sys
rows = {r['company_name']: r for r in csv.DictReader(open('data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv', encoding='utf-8'))}
log = json.load(open(f"{sys.argv[1]}/evaluate-persona-neel-whatif-day10-fit/run-log.json"))
seen = set()
for e in log['roles']:
    if not e.get('sponsorship') or e['company'] in seen: continue
    seen.add(e['company'])
    row, ev = rows[e['company']], e['sponsorship']['evidence']
    same = float(row['Total Approvals']) == ev['approvals'] and float(row['Total Denials']) == ev['denials']
    print(f"{e['company']}: CSV approvals {row['Total Approvals']} denials {row['Total Denials']} | log {ev['approvals']} {ev['denials']} | tier {e['sponsorship']['tier']} | {'MATCH' if same else 'DIFFERENT'}")
EOF

echo "== 3. board totals in the capture = an independent fetch of the same public APIs now"
python3 - "$R" <<'EOF'
import json, sys, urllib.request
cap = json.load(open(f"{sys.argv[1]}/capture/capture.json"))
H = {'user-agent': 'Mozilla/5.0 (compatible; verify-run)'}
def total(b):
    u = b['careers_url']; slug = u.rstrip('/').split('/')[-1]
    api = {'greenhouse': f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs", 'lever': f"https://api.lever.co/v0/postings/{slug}", 'ashby': f"https://api.ashbyhq.com/posting-api/job-board/{slug}"}[b['provider']]
    d = json.load(urllib.request.urlopen(urllib.request.Request(api, headers=H), timeout=20))
    return len(d) if isinstance(d, list) else len(d['jobs'])
for b in [x for x in cap['boards'] if x['careers_url'].split('/')[-1] in ('pathai', 'klaviyo', 'toast', 'formlabs')]:
    now = total(b)
    print(f"{b['name']} ({b['careers_url']}): capture {b['fetch']['total']} · refetch now {now} · {'same' if now == b['fetch']['total'] else 'changed since capture (boards move; the capture is a record of its own moment)'}")
print(f"capture found {cap['counts']['found']} = engine scan 'Total jobs found' {cap['scan_crosscheck']['scan']['found']}: {cap['counts']['found'] == cap['scan_crosscheck']['scan']['found']}")
EOF

echo "== 4. the scan dry-run writes nothing (data/ats before/after)"
before=$(ls -la data/ats | md5 -q 2>/dev/null || ls -la data/ats | md5sum)
REALLOCATION_ENGINE_PORTALS=$D/fixtures/portals-boston-swe.yml node scripts/ats/scan.mjs --dry-run > /dev/null 2>&1
after=$(ls -la data/ats | md5 -q 2>/dev/null || ls -la data/ats | md5sum)
ls data/ats; [ "$before" = "$after" ] && echo "data/ats unchanged by the dry run" || echo "data/ats CHANGED"

echo "== 5. the evaluate step is deterministic: re-run into a temp dir, compare scorer input + output"
tmp=$(mktemp -d)
node $D/evaluate.mjs --capture $R/capture/capture.json --persona $D/fixtures/persona-neel-whatif-day10.yml --fit $R/evaluate-persona-neel-whatif-day10/fit-ratings.json --out-dir "$tmp" > /dev/null
for f in roles.json role-scores.json; do
  a=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); d.pop('generated',None) if isinstance(d,dict) else None; print(json.dumps(d,sort_keys=True))" "$R/evaluate-persona-neel-whatif-day10-fit/$f" | shasum | cut -c1-12)
  b=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); d.pop('generated',None) if isinstance(d,dict) else None; print(json.dumps(d,sort_keys=True))" "$tmp/$f" | shasum | cut -c1-12)
  echo "$f committed $a · re-run $b · $([ "$a" = "$b" ] && echo identical || echo DIFFERENT)"
done

echo "== 6. scorer arithmetic by hand for the one 2-hour-block job (PathAI Software Engineer I)"
python3 - "$R" <<'EOF'
import json, sys
s = next(r for r in json.load(open(f"{sys.argv[1]}/evaluate-persona-neel-whatif-day10-fit/role-scores.json"))['roles'] if r['role_id'] == 'greenhouse:8696764002')
print(s['trace']['arithmetic'], '| by hand: (0.9*0.35 + 0.8*0.30) * 1 * 1 =', round(0.9*0.35 + 0.8*0.30, 3), '|', s['recommendation'])
EOF

echo "== 7. every input hash recorded in every run log matches the committed file"
python3 - "$R" <<'EOF2'
import hashlib, json, pathlib, sys
bad = n = 0
for log in sorted(pathlib.Path(sys.argv[1]).rglob('run-log.json')):
    for name, inp in json.load(open(log)).get('inputs', {}).items():
        p = pathlib.Path(inp['path'])
        if not p.exists(): continue  # a break-test input written outside the repo
        n += 1
        if hashlib.sha256(p.read_bytes()).hexdigest() != inp['sha256']: bad += 1; print(f"  MISMATCH {log.parent.name}: {name} {p}")
print(f"{n} recorded input hashes checked, {bad} mismatches")
EOF2
