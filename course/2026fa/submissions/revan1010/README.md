# Submission — Revan · Mode Build · Fall 2026

## Executive summary

This folder is one student's submission for the Mode Build assignment: a job-search recipe for an international Information Systems master's student who wants a junior software job in Boston after graduating in December 2026, on a student work permit starting February 2027. The recipe ran end-to-end on real data and real job postings. Its honest status is **DRAFT**: the core path works, but nine named gaps (missing datasets, unbuilt checks, human decisions) remain open, and no human gate has been cleared yet.

## Contents

| Deliverable | Path |
|---|---|
| Mode file (recipe) + card | `recipes/cases/2026fa/revan1010-msis-swe-boston-opt.md`, `.card.md` |
| Domain justification | `course/2026fa/submissions/revan1010/domain-justification.md` |
| Worked run + attestation + reflection | `course/2026fa/submissions/revan1010/worked-run.md` |
| Run log entries | `logs/runs/2026fa-revan1010-2.md` (current run, OPT February 2027); `logs/runs/2026fa-revan1010-1.md` (superseded: used an impossible May 2027 OPT start) |
| Scripts, tests, fixtures | `scripts/contrib/2026fa/revan1010-boston-swe-triage/` |
| Presentation notes | `course/2026fa/submissions/revan1010/presentation-notes.md` |

## Where things live, and why

The assignment text says `recipes/` and `assignments/submissions/<name>/`. This repository's `CONTRIBUTING.md` ("Fall 2026 and beyond", CI-enforced) instead requires `recipes/cases/<term>/`, `course/<term>/submissions/<handle>/`, `scripts/contrib/<term>/<handle>-<component>/` and `logs/runs/`, and it rejects edits to `logs/RUN_LOG.md`. I followed `CONTRIBUTING.md` so the PR passes the contrib gate. The conflict is noted here instead of being silently resolved.

## Reproduce

```bash
npm install
python3 -m venv ../.venv && ../.venv/bin/pip install pyyaml -r scripts/ats/requirements.txt
export PATH="$PWD/../.venv/bin:$PATH"
npm run verify && npm run doctor
node --test scripts/contrib/2026fa/revan1010-boston-swe-triage/triage.test.mjs
node scripts/contrib/2026fa/revan1010-boston-swe-triage/sponsor-triage.mjs \
  --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --profile scripts/contrib/2026fa/revan1010-boston-swe-triage/profile.example.json --out-dir output/revan1010-boston-swe/demo
```
