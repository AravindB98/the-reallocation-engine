#!/usr/bin/env bash
# rerun.sh — regenerate every offline output of the 2026-10-18 worked run from the committed
# snapshot, and re-run the verification transcript, tests, and repo checks.
# Network: one curl (the live cross-check of one Klaviyo posting). The liveness checks in
# 2026-10-18/liveness.txt are NOT re-run here (they are time-specific; re-run them by hand).
#   bash course/2026fa/submissions/mayank-1024/mode-build/runs/rerun.sh
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
[ -f .venv/bin/activate ] && source .venv/bin/activate
M=scripts/contrib/2026fa/mayank-1024-wage-level-floor
S=course/2026fa/submissions/mayank-1024/mode-build/runs
R=$S/2026-10-18
B=$S/2026-10-18-broad
x() { printf '$'; printf ' %q' "$@"; echo; "$@"; echo "[exit $?]"; }

x node $M/wage-level.mjs --snapshot $R/pay-snapshot.json --out-dir $R > $R/wage-level.stdout.txt 2>&1
x node $M/wage-level.mjs --persona $B/persona.broad.json --snapshot $R/pay-snapshot.json --out-dir $B > $B/wage-level.stdout.txt 2>&1

{
  echo "# verification transcript — commands verbatim, output as printed"
  echo; echo "# 1. DOL row: raw export vs committed extract (raw is gitignored; needs fetch-oflc.sh first)"
  x grep -E '^"14460","15-1252"' data/dol/oflc/raw/2026-27/ALC_Export.csv
  x grep -E '^14460,.*,15-1252,' data/dol/oflc/compact/alc-2026-27-ma-nh-soc15-17.csv
  x shasum -a 256 data/dol/oflc/raw/2026-27/OFLC_Wages_2026-27.zip
  x node -e 'console.log(54.94*2080, 66.46*2080, 77.98*2080, 89.50*2080)'
  echo; echo "# 2. one posting: live API now vs snapshot vs report"
  PRINT='let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.title,"|",j.location?.name,"|",JSON.stringify((j.pay_input_ranges||[]).map(p=>[p.min_cents/100,p.max_cents/100,p.currency_type])))})'
  echo "\$ curl -s 'https://boards-api.greenhouse.io/v1/boards/klaviyo/jobs/7855798003?pay_transparency=true' | node -e '$PRINT'"
  curl -s 'https://boards-api.greenhouse.io/v1/boards/klaviyo/jobs/7855798003?pay_transparency=true' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.title,"|",j.location?.name,"|",JSON.stringify((j.pay_input_ranges||[]).map(p=>[p.min_cents/100,p.max_cents/100,p.currency_type])))})'
  x node -e 'const s=require("./'$R'/pay-snapshot.json");const p=s.boards.find(b=>b.slug==="klaviyo").postings.find(p=>p.id==="7855798003");console.log(p.title,"|",p.location,"|",JSON.stringify(p.pay_structured.map(r=>[r.min,r.max,r.currency])))'
  x grep -F 'Software Engineer II - Recommendations' $R/wage-level.report.md
  echo; echo "# 3. one company: 80 Days CSV row vs report"
  x node --input-type=module -e 'import fs from "node:fs";import {csvObjects} from "./'$M'/lib.mjs";for(const x of csvObjects(fs.readFileSync("data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv","utf8")).filter(r=>r.company_name==="KLAVIYO INC"))console.log(x.company_name,"|",x.city,"|",x["Total Approvals"],"|",x["Total Denials"],"|",x.Approval_Rate,"|",x.median_salary_offered)'
  x grep -F '| KLAVIYO INC |' $R/wage-level.report.md
  echo; echo "# 4. determinism: second run into a temp dir, diff everything except the timestamp"
  T=$(mktemp -d)
  node $M/wage-level.mjs --snapshot $R/pay-snapshot.json --out-dir "$T" > /dev/null
  echo "\$ diff <(grep -v '\"run_at\"' $R/wage-level.log.json) <(grep -v '\"run_at\"' \$T/wage-level.log.json) && echo identical"
  diff <(grep -v '"run_at"' $R/wage-level.log.json) <(grep -v '"run_at"' "$T/wage-level.log.json") && echo identical
  echo "\$ diff <(grep -v 'run at' $R/wage-level.report.md) <(grep -v 'run at' \$T/wage-level.report.md) && echo identical"
  diff <(grep -v 'run at' $R/wage-level.report.md) <(grep -v 'run at' "$T/wage-level.report.md") && echo identical
  echo; echo "# 5. funnel arithmetic from the log"
  x node -e 'const l=require("./'$R'/wage-level.log.json");const f=l.funnel;console.log("classified+stopped",f.classified+f.stopped,"in_target_area",f.in_target_area,"model_judgment_values",l.model_judgment_values,"postings",l.postings.length)'
} > $R/verification.txt 2>&1

{ echo "\$ node --test $M/test/wage-level.test.mjs"
  node --test --test-reporter=spec $M/test/wage-level.test.mjs 2>&1 | grep -v '^$' | sed -E 's/ \([0-9.]+ms\)//; /duration_ms/d'
  echo "[exit ${PIPESTATUS[0]}]"; } > $R/tests.txt

{ x node scripts/conformance.mjs $M/ recipes/cases/2026fa/ course/2026fa/submissions/mayank-1024/mode-build/ data/dol/oflc/
  x npm run --silent verify
  echo "\$ npm run doctor   (privacy + recipe sections)"; npm run --silent doctor 2>&1 | sed -n '/PRIVACY/,$p'; echo "[exit ${PIPESTATUS[0]}]"
  x node scripts/pii-scan.mjs --diff upstream/main
} > $R/checks.txt 2>&1

grep -h '^\[exit' $R/*.txt $B/*.txt | sort | uniq -c
