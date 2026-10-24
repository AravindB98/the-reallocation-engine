#!/usr/bin/env bash
# One documented command: build roles.json from the real 80-Days CSV, then
# score it with the repo's existing scorer (not reimplemented).
# Run from the repo root.
#
# Liveness is a gate: only roles whose posting was checked with
# `npm run ats:liveness` reach the scorer. Put the postings you chose in
# liveness/posting-urls.csv (company_name,url) and the checker's saved output in
# liveness/liveness-check.txt; every other role is held out (run/held-out.md).
# If the checker says "uncertain", a person may open the page and record a
# decision in liveness/gate-decisions.csv (labeled your-input, not record).
set -euo pipefail

HERE="scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage"
OUT_DIR="$HERE/run"
URLS="$HERE/liveness/posting-urls.csv"
LOG="$HERE/liveness/liveness-check.txt"
DECISIONS="$HERE/liveness/gate-decisions.csv"

LIVE_ARGS=()
if [ -f "$URLS" ] && [ -f "$LOG" ]; then
  LIVE_ARGS=(--posting-urls "$URLS" --liveness-log "$LOG")
  if [ -f "$DECISIONS" ]; then
    LIVE_ARGS+=(--gate-decisions "$DECISIONS")
  fi
fi

python3 "$HERE/build_roles.py" \
  --out-dir "$OUT_DIR" \
  --opt-end-date 2027-03-15 \
  ${LIVE_ARGS[@]+"${LIVE_ARGS[@]}"}

if python3 -c "import json,sys; sys.exit(0 if json.load(open('$OUT_DIR/roles.json')) else 1)"; then
  npm run score -- "$OUT_DIR/roles.json" --out-dir "$OUT_DIR"
else
  # nothing has a checked posting: do not score, and do not leave an old score report behind
  rm -f "$OUT_DIR/role-scores.json" "$OUT_DIR/role-scores.md"
  echo "scorer not run: 0 roles have a checked posting (see $OUT_DIR/held-out.md)"
fi
