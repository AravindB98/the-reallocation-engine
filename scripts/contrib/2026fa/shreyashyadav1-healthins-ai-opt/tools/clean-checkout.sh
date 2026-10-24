#!/bin/bash
# Clean-checkout verification: clone the committed branch, overlay exactly what WOULD be committed (modified and
# untracked files, never ignored ones), install, and run the gates there. Compares the PII-scan result with a pristine
# checkout of upstream `main`, and replicates CI's contrib-scope gate on everything that differs from `origin/main`.
#
#   bash scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/clean-checkout.sh
#
# Needs: git, node, npm (network for npm install), and PyYAML importable by python3 (`conformance` and `manifest-check`
# call `python3 -c "import yaml"`; CI installs pyyaml, a fresh Homebrew Python does not). Writes only under $TMPDIR.
set -u
cd "$(dirname "$0")/../../../../.." || exit 99   # tools/ -> contrib dir -> 2026fa -> contrib -> scripts -> repo root
ROOT="$(pwd)"
CL="$(mktemp -d "${TMPDIR:-/tmp}/healthins-clean.XXXXXX")"
T=scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt
D=assignments/submissions/shreyashyadav1/runs/2026-10-20

git clone --quiet --local "$ROOT" "$CL/mine"
git clone --quiet --local --branch main "$ROOT" "$CL/pristine"
echo "committed branch head under test: $(git -C "$CL/mine" log -1 --format='%h %s')"
echo "pristine upstream main:           $(git -C "$CL/pristine" log -1 --format='%h %ad %s' --date=short)"

git ls-files -m -o --exclude-standard > "$CL/overlay.txt"
while read -r f; do [ -f "$f" ] || continue; mkdir -p "$CL/mine/$(dirname "$f")"; cp "$f" "$CL/mine/$f"; done < "$CL/overlay.txt"
echo "files overlaid from the working tree: $(wc -l < "$CL/overlay.txt" | tr -d ' ')"
# tracked files that are gone from the working tree (moved elsewhere) must be gone from the clean copy too
git ls-files -d > "$CL/deleted.txt"
while read -r f; do git -C "$CL/mine" rm -q -f -- "$f"; done < "$CL/deleted.txt"
echo "tracked files removed in the working tree: $(wc -l < "$CL/deleted.txt" | tr -d ' ')"

echo; echo "## npm install (both checkouts)"
(cd "$CL/pristine" && npm install --silent 2>&1 | tail -2)
(cd "$CL/mine" && npm install --silent 2>&1 | tail -2)
echo "done"

echo; echo "## pii-scan on PRISTINE upstream main (the baseline)"
(cd "$CL/pristine" && node scripts/pii-scan.mjs 2>&1 | head -3)
echo; echo "## in my clean checkout"
echo "--- npm run verify";  (cd "$CL/mine" && npm run verify 2>&1 | grep -E "conformance:|all conform|manifest check|FAILED")
echo "--- npm run doctor";  (cd "$CL/mine" && npm run doctor 2>&1 | grep -E "no private|SUMMARY|environment|recipes:")
echo "--- pii-scan";        (cd "$CL/mine" && node scripts/pii-scan.mjs 2>&1 | head -3)
echo "--- the offline tests"; (cd "$CL/mine" && node --test "$T/test/*.test.mjs" 2>&1 | grep -E "^ℹ (tests|pass|fail)")
echo "--- decision step re-run from the committed snapshot, compared with the committed outputs"
(cd "$CL/mine" && mkdir -p output/clean-run && cp "$D/candidates.snapshot.json" output/clean-run/ \
  && node "$T/run.mjs" --today 2026-10-20 --candidates output/clean-run/candidates.snapshot.json --out-dir output/clean-run > /dev/null \
  && node "$T/tools/diff-runs.mjs" output/clean-run "$D" | tail -6)

echo; echo "## CI's contrib-scope gate, replicated on everything that differs from upstream main"
(cd "$CL/mine" && { git diff --name-only origin/main; git ls-files -o --exclude-standard; } | sort -u > "$CL/changed.txt")
echo "files that differ from upstream main (the future PR): $(wc -l < "$CL/changed.txt" | tr -d ' ')"
echo "protected paths touched: $(grep -c -E '^(logs/RUN_LOG\.md|SNICKERDOODLE\.md|DOMAIN\.md|DATA_CONTRACT\.md|package\.json|\.github/|\.githooks/|AGENTS\.md|CLAUDE\.md)' "$CL/changed.txt")"
echo "files outside the allowed namespaces: $(grep -v -c -E '^(scripts/contrib/|recipes/cases/|logs/runs/|course/[^/]+/submissions/|search/examples/|scripts/(score|ats|sec|bls|resumes|gates|test)/[^/]+\.(mjs|py)$)' "$CL/changed.txt")"
echo "largest files in the PR (bytes):"
(cd "$CL/mine" && while read -r f; do [ -f "$f" ] && echo "$(wc -c < "$f" | tr -d ' ') $f"; done < "$CL/changed.txt" | sort -rn | head -4)
echo; echo "clean checkout kept at: $CL"
