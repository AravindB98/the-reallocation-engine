#!/bin/sh
# Build the LMS upload: reallocation-hemanthrayuduu-mode.zip, next to the repository folder (never committed).
# Contains, from ONE commit: the mode file + card, this folder (01-04, README, evidence, runs), the tool folder,
# and the run log, plus a top-level SUBMISSION.md with the commit SHA and PR link. Never contains private/.
#   sh course/2026fa/submissions/hemanthrayuduu/mode-build/make-zip.sh <pr-url>
set -e
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
cd "$REPO"
if [ -n "$(git status --porcelain)" ]; then
  echo "REFUSING: uncommitted changes. Commit first, so the ZIP equals exactly one commit."; git status --short; exit 1
fi
PR_URL=${1:-"(not given)"}
SHA=$(git rev-parse HEAD)
OUT="$REPO/../reallocation-hemanthrayuduu-mode.zip"
STAGE=$(mktemp -d)
cat > "$STAGE/SUBMISSION.md" <<EOF
# SUBMISSION — Mode Build (Hemanth Rayudu, hemanthrayuduu)

## Executive summary

The upload for the Reallocation Engine Mode Build assignment: a weekly apply-queue refresh for AI / Data Engineers on
F-1 OPT. Everything below is the content of one commit of the branch named here; the PR is the proof it runs in the
real repository. Start with \`course/2026fa/submissions/hemanthrayuduu/mode-build/README.md\`.

## Record

- Assignment: The Reallocation Engine — Mode Build Assignment
- Student: Hemanth Rayudu (GitHub: hemanthrayuduu)
- Repository / branch: https://github.com/hemanthrayuduu/the-reallocation-engine / mode/hemanthrayuduu-ai-data-opt
- Pull request: $PR_URL
- Commit: $SHA
- Lifecycle stage claimed: RUNNABLE-LIVE (v0.1.1), with the evidence in the run log; VERIFIED not claimed.

## Contents (paths as in the repository)

- Mode file: recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md (+ .card.md)
- Domain justification, worked run, run-log entry, show-and-tell notes: course/2026fa/submissions/hemanthrayuduu/mode-build/01-04
- Tool, tests, fixtures, sample data: scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/
- Full run log: logs/runs/2026fa-hemanthrayuduu-2.md
- Evidence and run outputs: course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/, runs/

## Run it

The tool calls the engine's own scripts, so run it inside a clone of the repository at the commit above:

    python3 -m unittest discover -s scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh -p 'test_*.py'
    python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py
EOF
rm -f "$OUT"
git archive --format=zip --prefix=reallocation-hemanthrayuduu-mode/ --add-file="$STAGE/SUBMISSION.md" -o "$OUT" "$SHA" -- \
  recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md \
  recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.card.md \
  course/2026fa/submissions/hemanthrayuduu/mode-build \
  scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh \
  logs/runs/2026fa-hemanthrayuduu-2.md
rm -rf "$STAGE"
echo "== built $OUT"
echo "   commit $SHA · files $(unzip -Z1 "$OUT" | grep -vc '/$')"
echo "== must-not-contain check (each count should be 0)"
for pat in 'private/' 'node_modules/' '/\.build/' '__pycache__/' '\.pyc$' '(^|/)\.env' 'resume\.json$'; do
  printf '   %-16s %s\n' "$pat" "$(unzip -Z1 "$OUT" | grep -cE "$pat" || true)"
done
