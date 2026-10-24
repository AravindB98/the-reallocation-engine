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
- Lifecycle stage claimed: RUNNABLE-LIVE (v0.1.2), with the evidence in the run log; VERIFIED not claimed.

## Contents (paths as in the repository)

- Mode file: recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md (+ .card.md)
- Domain justification, worked run, run-log entry, show-and-tell notes: course/2026fa/submissions/hemanthrayuduu/mode-build/01-04
- Tool, tests, fixtures, sample data: scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/
- Full run log: logs/runs/2026fa-hemanthrayuduu-2.md
- Evidence and run outputs: course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/, runs/

## Run it

The tool calls the engine's own scripts, so run it inside a checkout of the branch (or of the PR) at the commit above:

    git clone --branch mode/hemanthrayuduu-ai-data-opt https://github.com/hemanthrayuduu/the-reallocation-engine
    cd the-reallocation-engine
    python3 -m unittest discover -s scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh -p 'test_*.py'
    python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py

**One deliberate behaviour, and what it means for where you run it** (checked 2026-10-21): the tool's privacy guard
writes to a tracked folder only when git confirms that the sample queue and the persona are committed examples.

- In a checkout of the branch or of the PR: all 47 tests pass, and the documented command runs.
- In a copy with no git at all, the guard falls back to the folder location. The documented command runs, and 45 of 47
  tests pass: the two that test the git-tracking check itself need a git checkout.
- If these files are copied into a different clone *without being committed*, git reports them as untracked, so the
  guard fails closed: it refuses any output folder outside private/, and the tests that write to a temporary folder fail.
  Commit them first, or use a checkout of the branch.
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
