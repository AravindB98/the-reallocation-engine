#!/usr/bin/env bash
# Re-create every non-network output of the 2026-10-21 worked run from the
# committed inputs. Run from the repository root:
#   bash course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/reproduce.sh
# The two liveness files are NOT regenerated: they are saved output of
#   npm run ats:liveness -- --file <run-dir>/urls.txt          (first pass)
#   npm run ats:liveness -- --file <run-dir>/urls-recheck.txt  (re-check)
# which hit the live web and will differ on another day.
# The IPEDS and USCIS extracts are read from scripts/contrib/.../data/extracts/
# (built by ingest.py, which is the only network step besides liveness).
# Then check the outputs are byte-identical to the committed ones:
#   git diff --stat <run-dir>   → expect no changes, or
#   (cd <run-dir> && shasum -a 256 audit.md run.json report.md stdout.txt $(find breaks -type f | sort) | shasum -a 256)
#   → expect 96a7e6628c407eb2369d47e42efbf2a1946b2fc49c8bcab5867d731bedd8441f
set -u
D=course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21
B=$D/breaks
S=scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py
X=scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures
P=search/examples/priya-nair/profile.yml
run() { echo "\$ $*"; "$@" 2>&1; echo "exit: $?"; echo; }

rm -rf "$B"/b1-b2 "$B"/b3-opt-ended "$B"/b4-unemployed "$B"/b5-bad-header "$B"/b6-no-liveness "$B"/b7-first-pass-only

{
run python3 $S audit --out $D/audit.md --json
run python3 $S triage --persona $P --ext $X/priya-lottery-ext.json --targets $D/targets.json \
  --liveness $D/liveness.txt --liveness $D/liveness-recheck.txt --g4 $D/g4-decisions.json --run-date 2026-10-21 --out-dir $D
} > $D/stdout.txt

{
echo "## B1+B2+B8: look-alikes (blind spot, Form D record, IPEDS for-profit record)"
run python3 $S triage --persona $P --ext $X/priya-lottery-ext.json --targets $B/targets.breaks.json \
  --liveness $D/liveness.txt --liveness $D/liveness-recheck.txt --run-date 2026-10-21 --out-dir $B/b1-b2
echo "## B3: OPT already ended (run date after 2027-01-31)"
run python3 $S triage --persona $P --ext $X/priya-lottery-ext.json --targets $D/targets.json \
  --liveness $D/liveness.txt --run-date 2027-02-15 --out-dir $B/b3-opt-ended
echo "## B4: not employed on OPT -> unemployment clock binds"
run python3 $S triage --persona $P --ext $X/breaks/ext.unemployed.json --targets $D/targets.json \
  --liveness $D/liveness.txt --run-date 2026-10-21 --out-dir $B/b4-unemployed
echo "## B5: corrupted 80 Days header -> G1 halt, nothing written"
run python3 $S triage --persona $P --ext $X/priya-lottery-ext.json --targets $D/targets.json \
  --liveness $D/liveness.txt --csv $X/breaks/mini_80days.bad-header.csv --run-date 2026-10-21 --out-dir $B/b5-bad-header
echo "b5 output dir exists? $(test -e $B/b5-bad-header && echo YES || echo no)"; echo
echo "## B6: no liveness file at all"
run python3 $S triage --persona $P --ext $X/priya-lottery-ext.json --targets $D/targets.json \
  --run-date 2026-10-21 --out-dir $B/b6-no-liveness
echo "## B7: first liveness pass only (no re-check)"
run python3 $S triage --persona $P --ext $X/priya-lottery-ext.json --targets $D/targets.json \
  --liveness $D/liveness.txt --run-date 2026-10-21 --out-dir $B/b7-first-pass-only
} > $B/breaks-stdout.txt

echo "regenerated $D/{audit.md,run.json,report.md,stdout.txt} and $B/*"
