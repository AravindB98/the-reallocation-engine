# Independent check of screen-log.json against the source CSV (Python csv module, not lib.mjs).
import csv, json, hashlib, sys
CSV = 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'
LOG = sys.argv[1]
raw = open(CSV, 'rb').read()
rows = list(csv.DictReader(open(CSV, newline='', encoding='utf-8-sig')))
by = {r['company_name']: r for r in rows}
log = json.load(open(LOG))
print(f"csv rows: python={len(rows)} log={log['inputs']['sponsor_csv']['rows']} match={len(rows)==log['inputs']['sponsor_csv']['rows']}")
print(f"csv sha256 match: {hashlib.sha256(raw).hexdigest()==log['inputs']['sponsor_csv']['sha256']}")
c = log['counts']
print(f"row accounting: {c['candidates']} == {c['unscored']}+{c['apply']}+{c['consider']}+{c['skip']} -> {c['candidates']==c['unscored']+c['apply']+c['consider']+c['skip']}")
bad = 0
for r in log['roles']:
    ev = (r.get('sponsorship') or {}).get('evidence') or (r['gates'].get('G1_company_match', {}).get('if_confirmed') or {}).get('evidence')
    if not ev: continue
    name = ev['csv_company_name']['value']; src = by[name]
    ok_app = float(src['Total Approvals']) == ev['total_approvals']['value']
    titles = ev['top_titles_sponsored']['value']
    ok_t = all(t in src['top_job_titles_sponsored'] for t in titles)
    bad += (not ok_app) + (not ok_t)
    print(f"  {r['role_id']:<28} {name:<26} approvals csv={src['Total Approvals']:<7} log={ev['total_approvals']['value']:<6} {'OK' if ok_app and ok_t else 'MISMATCH'}")
gated = [r for r in log['roles'] if r.get('scorer') and (r['gates']['G2_liveness']['factor'] <= 0.05 or log['timeline_gate']['factor'] <= 0.05) and r['scorer']['recommendation'] != 'Skip']
rank = {'Skip': 0, 'Consider': 1, 'Apply': 2}
raised = [r for r in log['roles'] if r.get('scorer') and rank[r['recommendation']] > rank[r['scorer']['recommendation']]]
capped = [r['role_id'] for r in log['roles'] if (r.get('fit_floor') or {}).get('applied')]
print(f"fit floor: {len(capped)} capped {capped} · raised above the scorer: {len(raised)}")
print(f"mismatches: {bad} · closed-gate rows not Skip: {len(gated)} · invariant violations in log: {len(log['gate_invariant_violations'])}")
