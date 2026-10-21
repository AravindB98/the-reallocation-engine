#!/usr/bin/env bash
# Break-attempt harness for the design-engineer SOC triage (bash, run from the repo root).
set -u
C=scripts/contrib/2026fa/o7580-design-engineer-soc-triage; M=course/2026fa/submissions/o7580/mode-build; T=$C/triage.mjs
S=$(mktemp -d)
scrub(){ sed "s#$S#<scratch>#g; s#/var/folders/[^ ]*/T/[^ /]*#<tmp>#g; s#/private<tmp>#<tmp>#g"; }
echo "# Break attempts — design-engineer SOC triage v0.1.0 — run $(date +%Y-%m-%d)"
echo "# Harness: $C/break-tests.sh (bash). Each block: command, verbatim output, exit code."
echo
echo "## B1 Time shift: same live postings, as of 2027-03-01 with 56 OPT unemployment days used"
echo "\$ node $T --as-of 2027-03-01 --days-used 56 --out-dir $M/runs/2027-03-01-timeshift"
node $T --as-of 2027-03-01 --days-used 56 --out-dir $M/runs/2027-03-01-timeshift 2>&1; echo "exit $?"
node -e "const l=require('./$M/runs/2027-03-01-timeshift/triage-log.json');for(const r of l.roles.filter(r=>r.eligibility_timeline))console.log(' ',r.role_id,'→',r.outcome,'|',r.eligibility_timeline.closures.map(c=>c.split(':')[0]).join(', '))"
echo
echo "## B2 Remove the 15-1255.00 row from the BLS table (BROKEN fixture), run the live scenario"
echo "\$ node $T --bls $C/fixtures/BROKEN-bls-no-15-1255.csv --out-dir $M/runs/break-bls-no-15-1255"
node $T --bls $C/fixtures/BROKEN-bls-no-15-1255.csv --out-dir $M/runs/break-bls-no-15-1255 2>&1; echo "exit $?"
node -e "const l=require('./$M/runs/break-bls-no-15-1255/triage-log.json');const r=l.roles.find(x=>x.role_id==='palantir-web-design-engineer');console.log('  Web Design Engineer readout:',JSON.stringify(r.soc_readout.candidates.map(c=>({soc:c.onet_soc_code,missing:c.missing,score:c.cognitive_pivot_score}))))"
echo
echo "## B3 Corrupt scenario JSON: must exit 2 and write nothing"
printf '{ "persona": ' > $S/corrupt.json
echo "\$ node $T --scenario <scratch>/corrupt.json --out-dir $M/runs/break-corrupt"
node $T --scenario $S/corrupt.json --out-dir $M/runs/break-corrupt 2>&1 | scrub; echo "exit ${PIPESTATUS[0]}"
test -e $M/runs/break-corrupt && echo "  WROTE $M/runs/break-corrupt" || echo "  nothing written"
echo
echo "## B4 Dead posting: a role pointing at the broken Palantir ID that ats:liveness reported expired, with a deliberately high fit (0.9)"
node -e "const s=require('./$C/scenarios/design-engineer.live.json');s.roles.push({role_id:'BREAK-dead-posting',company:'Palantir Technologies Inc',state:'CA',title:'Product Designer',posting_url:'https://jobs.lever.co/palantir/00000000-dead-4bad-8bad-000000000000',fit:{p:0.9,basis:'break test: deliberately high fit',drafted_by:'break test'},posting:{transcribed_by:'break test'}});require('fs').writeFileSync('$S/dead.json',JSON.stringify(s))"
O=$(mktemp -d); echo "\$ node $T --scenario <scratch>/dead.json --out-dir <tmp>"
node $T --scenario $S/dead.json --out-dir $O 2>&1 | scrub; echo "exit ${PIPESTATUS[0]}"
node -e "const l=require('$O/triage-log.json');const r=l.roles.find(x=>x.role_id==='BREAK-dead-posting');console.log(' ',r.outcome,'|',r.decision.reason,'|',r.decision.arithmetic)"
echo
echo "## B5 Out-of-range fit (1.5) must not reach the scorer"
node -e "const s=require('./$C/scenarios/design-engineer.live.json');s.roles[0].fit.p=1.5;require('fs').writeFileSync('$S/fit.json',JSON.stringify(s))"
O=$(mktemp -d); echo "\$ node $T --scenario <scratch>/fit.json --out-dir <tmp>"
node $T --scenario $S/fit.json --out-dir $O 2>&1 | scrub; echo "exit ${PIPESTATUS[0]}"
node -e "const l=require('$O/triage-log.json');const r=l.roles.find(x=>x.role_id==='toast-swe2-frontend');console.log(' ',r.outcome,'|',JSON.stringify(r.missing));console.log('  in roles.json:',require('$O/roles.json').some(x=>x.role_id==='toast-swe2-frontend'))"
echo
echo "## B6 Ambiguous-title override without a basis is refused"
node -e "const s=require('./$C/scenarios/design-engineer.live.json');s.roles.push({role_id:'BREAK-designer',company:'Palantir Technologies Inc',state:'CA',title:'Designer',posting_url:'https://jobs.lever.co/palantir/a3eaa0ef-3378-495f-8308-edbd9a93d26c',family_override:{family:'ux-design'},fit:{p:0.5,drafted_by:'break test'}});require('fs').writeFileSync('$S/amb.json',JSON.stringify(s))"
O=$(mktemp -d); node $T --scenario $S/amb.json --out-dir $O > /dev/null 2>&1; echo "exit $?"
node -e "const l=require('$O/triage-log.json');const r=l.roles.find(x=>x.role_id==='BREAK-designer');console.log(' ',r.outcome,'|',JSON.stringify(r.missing))"
echo
echo "## B7 Reproducibility: re-run the live scenario into a temp dir; diff against the saved run (generated_at stripped)"
O=$(mktemp -d); node $T --out-dir $O > /dev/null 2>&1; echo "exit $?"
# normalize the out-dir, which the log records as a repo-relative path
strip(){ grep -v '"generated_at"\|generated 20\|"generated":\|^# Role Scorer report' "$1" | sed -E "s#(\.\./)*\.\.(/private)?$O#OUT#g; s#$O#OUT#g; s#$M/runs/2026-10-19-live#OUT#g"; }
for f in triage-log.json triage-report.md roles.json role-scores.json role-scores.md; do if diff <(strip $O/$f) <(strip $M/runs/2026-10-19-live/$f) >/dev/null; then echo "  identical: $f"; else echo "  DIFFERS: $f"; diff <(strip $O/$f) <(strip $M/runs/2026-10-19-live/$f) | head -5; fi; done
echo
echo "## B8 Independent cross-check of the audit counts with Python's csv + ast modules (not this recipe's parser)"
python3 - <<'PY'
import csv, ast, re, json
rows=list(csv.DictReader(open('data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv', newline='')))
sp=[r for r in rows if r['Total Approvals'].strip()]
n=sum(1 for r in sp for t in ast.literal_eval(r['top_job_titles_sponsored'] or '[]') if re.search('design',t,re.I))
a=json.load(open('course/2026fa/submissions/o7580/mode-build/runs/2026-10-19-live/design-title-audit.json'))
print('  rows', len(rows), 'vs audit', a['inputs']['csv_rows'])
print('  sponsor rows', len(sp), 'vs audit', a['sponsor_rows'])
print('  "design" title instances', n, 'vs audit', a['naive_design_filter']['titles_matched'])
b=list(csv.DictReader(open('data/bls/compact/soc_occupation_compact.csv', newline='')))
print('  blank pivot rows', sum(1 for r in b if r['cognitive_pivot_score']==''), 'vs audit', a['bls']['blank_cognitive_pivot_rows'])
print('  15-1255.00 cognitive_pivot_score field:', repr(next(r for r in b if r['onet_soc_code']=='15-1255.00')['cognitive_pivot_score']))
ma=[r for r in sp if r['state'].upper()=='MA']
print('  MA sponsor rows', len(ma), '| MA rows with any title containing "designer":', sorted(r['company_name'] for r in ma if re.search('designer', r['top_job_titles_sponsored'], re.I)))
PY
rm -rf "$S"
