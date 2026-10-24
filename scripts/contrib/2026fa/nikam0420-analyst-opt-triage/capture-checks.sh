#!/usr/bin/env bash
# Run from repo root. Capture actual student output; never sign human approval.
set -u
set -o pipefail
code="scripts/contrib/2026fa/nikam0420-analyst-opt-triage"
logs="course/2026fa/submissions/nikam0420/my-checks"
mkdir -p "$logs"
printf 'Captured logs redact email strings to prevent copying scanner findings into your branch.\n'
failed=0
check() {
  name="$1"
  shift
  "$@" 2>&1 | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[REDACTED_EMAIL]/g' | tee "$logs/$name.txt"
  result=${PIPESTATUS[0]}
  printf '\nExit code: %s\n' "$result" | tee -a "$logs/$name.txt"
  if [ "$result" -ne 0 ]; then failed=1; fi
}
check doctor npm run doctor
check verify npm run verify
check prototype python3 "$code/prototype.py"
check tests python3 "$code/test_prototype.py"
check conformance node scripts/conformance.mjs "$code"
check pii node scripts/pii-scan.mjs
python3 "$code/prototype.py" --fixture "$code/fixtures/missing-company.json" 2>&1 | tee "$logs/deliberate-break.txt"
result=${PIPESTATUS[0]}
printf '\nExit code: %s (expected 2)\n' "$result" | tee -a "$logs/deliberate-break.txt"
if [ "$result" -ne 2 ]; then failed=1; fi
printf '\nReview your actual logs, then complete the unsigned attestation yourself.\n'
exit "$failed"
