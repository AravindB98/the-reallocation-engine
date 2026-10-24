#!/usr/bin/env bash
# run-mode.sh — one real pass of the Boston MSIS->SWE mode, steps 1-5.
# Network is touched only by the repo's own ingest/liveness scripts (steps 2-3).
# Usage: bash scripts/contrib/2026fa/revan1010-boston-swe-triage/run-mode.sh <out-dir> <candidates.json> <fit.json>
set -uo pipefail
OUT="${1:?out dir}"; CAND="${2:?candidates.json (keep in private/)}"; FIT="${3:?fit.json (keep in private/)}"
T=scripts/contrib/2026fa/revan1010-boston-swe-triage
CSV=data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
mkdir -p "$OUT"
echo "== 1. sponsor triage (80 Days layer + timeline gate) =="
node $T/sponsor-triage.mjs --csv $CSV --profile $T/profile.example.json --out-dir "$OUT" || exit $?
echo "== 2. liveness gate (Job-Ops layer) =="
node -e "for (const c of JSON.parse(require('fs').readFileSync('$CAND','utf8'))) console.log(c.url)" > "$OUT/urls.txt"
node scripts/ats/check-liveness.mjs --file "$OUT/urls.txt" | tee "$OUT/liveness.txt"   # exit 1 on any non-active is expected; build-roles enforces it
echo "== 3. build scorer input (refuses any role missing a gate or a fit input) =="
node $T/build-roles.mjs --triage "$OUT/triage.json" --candidates "$CAND" --liveness "$OUT/liveness.txt" \
  --fit "$FIT" --soc data/bls/compact/soc_occupation_compact.csv --out "$OUT/roles.json" || exit $?
echo "== 4. engine scorer (Ch.11 composite) =="
node scripts/score/role-scorer.mjs "$OUT/roles.json" --profile $T/scorer-profile.json --out-dir "$OUT" || exit $?
echo "== 5. done: human gates are still open — see the recipe =="
