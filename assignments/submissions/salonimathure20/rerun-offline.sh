#!/usr/bin/env bash
# rerun-offline.sh — re-run every OFFLINE step of the 2026-10-21 worked run and
# re-record its terminal output. No network: the posting evidence and liveness
# files saved on 2026-10-21 are the inputs. Run from the repo root (Node 20+):
#
#   bash assignments/submissions/salonimathure20/rerun-offline.sh
#
# Re-records terminal/04 (the mode), 05 (independent verifier), 06 (break
# attempts B3–B6). B1, B2 and the network steps 01–03 are not re-run here.
set -u
D=assignments/submissions/salonimathure20/runs/live-2026-10-21
F=scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21
P=scripts/contrib/2026fa/salonimathure20-opt-countdown
BI=$D/break-inputs
T=$(mktemp -d)
rec() { echo "\$ $*"; "$@"; echo "[exit $?]"; }
clean() { sed -E "s#(\.\./)*${T#/}#<tmp>#g; s#$T#<tmp>#g" | grep -v '^npm notice'; }

rec node $P/opt-countdown.mjs --mode live --persona $F/persona.json --candidates $F/candidates.json \
  --liveness $F/liveness.txt --posting-evidence $F/posting-evidence.json --out-dir $D/out 2>&1 | tee $D/terminal/04-opt-countdown-live.txt

rec python3 assignments/submissions/salonimathure20/verify-run.py $D/out $F/persona.json \
  data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv 2>&1 | tee $D/terminal/05-verify-independent.txt | tail -2

{
echo "### B3. Stale evidence: same evidence (checked 2026-10-21), persona as_of moved to 2026-10-24"
rec node $P/opt-countdown.mjs --mode live --persona $BI/persona-stale.json --candidates $F/candidates.json \
  --liveness $F/liveness.txt --posting-evidence $F/posting-evidence.json --out-dir $T/stale
node -e 'const l=require(process.argv[1]);for(const r of l.roles.slice(0,3))console.log(" ",r.role_id,"→",(r.blocked||[r.decision.reason]).join("; "));console.log("  summary:",JSON.stringify(l.summary))' $T/stale/opt-countdown-log.json
echo; echo "### B4. Live mode with no posting evidence (v0.1 liveness has no freshness check)"
rec node $P/opt-countdown.mjs --mode live --persona $F/persona.json --candidates $F/candidates.json \
  --liveness $F/liveness.txt --posting-evidence $T/does-not-exist.json --out-dir $T/noevidence
echo; echo "### B5. Clock exhausted: 81 of 90 unemployment days used, buffer 10"
rec node $P/opt-countdown.mjs --mode live --persona $BI/persona-clock-out.json --candidates $F/candidates.json \
  --liveness $F/liveness.txt --posting-evidence $F/posting-evidence.json --out-dir $T/clockout
echo "  files left in out-dir: $(ls $T/clockout | tr '\n' ' ')"
echo; echo "### B6. Shared scorer, fit = 0 at a Proven sponsor, both gates open (NOT caught by the mode)"
rec npm run score -- $BI/fit-zero-roles.json --out-dir $T/fitzero
node -e 'const s=require(process.argv[1]).roles[0];console.log("  ",s.role_id,"→",s.recommendation,s.composite,"|",s.trace.arithmetic)' $T/fitzero/role-scores.json
} 2>&1 | clean > $D/terminal/06b-break-attempts-offline.txt
echo "break attempts B3–B6 → $D/terminal/06b-break-attempts-offline.txt"
