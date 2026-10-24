# Mode Build submission — Aditya Hasija (AdityaHasija37)

## Executive summary

**What this is.** My submission for *The Reallocation Engine — Mode Build* assignment. It
is a working mode that tells an international product-management job seeker how many
H-1B lottery entries a posted salary would earn under the 2026 wage-weighted lottery,
for each job code the employer might file. It ran on live postings and official
Department of Labor data.

**What it found.** Across three live postings (four posting-city combinations), the
same salary earned 1 to 4 entries depending on the employer's job code, which the
applicant can't see. For these postings, national pay data made salaries look
higher-level than the official city tables in 23 of 54 checks and never lower; most of
the gap remains after allowing for the national data being a year older. One posting
was refused because its range included commission.

**Status: DRAFT.** It ran in full on real data. Six proposed additions are still open,
and the lifecycle doesn't allow skipping a stage while any are open.

## Where each assignment item is

| Assignment item | File |
|---|---|
| 1. Mode file | `recipes/cases/2026fa/AdityaHasija37-msis-pm-wage-level.md` (+ person-facing card `.card.md`) |
| 2. Domain justification | `course/2026fa/submissions/AdityaHasija37/mode-build/DOMAIN-JUSTIFICATION.md` |
| 3. Worked run, verification, attestation, reflection | `course/2026fa/submissions/AdityaHasija37/mode-build/WORKED-RUN.md` |
| Real terminal output (each file: verbatim command, UTC timestamp, full output, exit code) | `course/2026fa/submissions/AdityaHasija37/mode-build/runs/` |
| 4. Run-log entry | `logs/runs/2026fa-AdityaHasija37-wage-level-1.md` |
| Scripts, tests, data extract, fixtures, sample output | `scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/` |

**Why these paths differ from the assignment text.** The assignment names
`assignments/submissions/<name>/` and an append to `logs/RUN_LOG.md`. The repo's CI
(`.github/workflows/contrib-gate.yml`) fails any student PR that edits `logs/RUN_LOG.md`
and flags paths outside the student namespaces. So I used the CI-clean equivalents,
`course/<term>/submissions/<handle>/` and `logs/runs/`. The run-log entry is also included
in the zip. No maintained file is modified.

## Reproduce (about one minute, no network)

```bash
npm install
python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py run --run-date 2026-10-21 --replay --out /tmp/wl-replay
python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/test_wage_level.py
npm run verify && npm run doctor
```

The run's freshness gates are measured against the run date, so any run on a day other
than 2026-10-21 needs `--replay`, and its log and report are stamped **REPLAY**. Apart
from that stamp (one line in the report, the `mode` field in the log), the replay output
equals the committed `out/` (`diff /tmp/wl-replay/report.md
scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/out/report.md` shows only the
stamp). The same-day run's sha256 is in `runs/15-determinism.txt`, and `runs/17` is a fresh
clone of this branch reproducing it. To rebuild the data from the government source, run
`fetch-oflc.sh 2026-27` and then `wage_level.py extract` (12 MB download, checksum-pinned).
To regenerate every capture in `runs/`: `bash scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/capture-evidence.sh`.

## Engine commands actually run

`npm run verify` · `npm run doctor` · `npm run ats:liveness` (×5: the 3 scenario postings,
1 break attempt on a fake job ID, and 1 re-check of a posting that timed out on the first
pass) · `npm run pii-scan`, plus the mode's own scripts. All outputs are in `runs/`.

## Related earlier work

This is a separate mode from my earlier network-targets recipe (nikbearbrown/the-reallocation-engine#43).
That one decides *apply vs network* at sponsoring companies; this one decides *what a
salary means for the lottery*. They share no code.
