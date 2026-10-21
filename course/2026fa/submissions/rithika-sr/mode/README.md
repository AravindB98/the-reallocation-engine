## Executive summary

This folder is rithika-sr's submission for the mode assignment. It is a screening step for a fictional international student who needs a sponsored entry-level data scientist job. Start here to find each deliverable.

The tool went through three runs on the same 13 real postings:
- **First run:** it caught an old false recommendation, but a person's review found a new one, a missed open job, and a job board it trusted by accident.
- **Second run:** it checks each employer's own job record, which fixed all three. But it then recommended two senior roles.
- **Third run:** it sets senior-titled roles aside, and agreed with the person's decisions on four of five postings.

Those five postings were also used to design the fixes, so a held-out test is the next step.

## What this submission is

A mode (v0.3.0) built on the earlier sponsor-triage recipe. Each posting must clear these checks before it is scored:
- a sponsorship record;
- the employer's own job record or page showing the job is open (job-listing sites alone never count, and unknown sites are held);
- a title at entry level;
- a visa timeline that fits.

Anything else is HELD, CLOSED or OVER-LEVEL with a reason. The tool was run three times on 2026-10-21 with a fictional persona, Sasha Jones, and the results were reviewed by hand.

## Deliverables → files

The assignment text names `assignments/submissions/<name>/` and `logs/RUN_LOG.md`. This repository uses `course/<term>/submissions/<handle>/` instead (CONTRIBUTING.md). `logs/RUN_LOG.md` is maintainer-only, and CI rejects student edits. Run entries therefore go in `logs/runs/<term>-<handle>-<n>.md`, which the assignment allows ("or include it in your submission"). This table lists the deliverables named in my instructions; check it against the Canvas page before submitting.

| Deliverable | File |
|---|---|
| Recipe (agent), v0.3.0 | `recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md` (DRAFT, 13 typed TODOs) |
| Card (human), v0.3.0 | `recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.card.md` |
| Code | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/` (`mode_run.py`, `ats_record.py`, `aggregators.json`, `ats_hosts.json`, `level_rules.json`, `README.md`) |
| Tests + fixtures | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/test_mode_run.py` (69 tests), `fixtures/` |
| Run logs | `logs/runs/2026fa-rithika-sr-2.md` (Run 1), `-3.md` (Run 2, including the failed attempt), `-4.md` (Run 3) |
| Domain justification | `course/2026fa/submissions/rithika-sr/mode/DOMAIN-JUSTIFICATION.md` |
| Worked run (all three runs, real output, attestation) | `course/2026fa/submissions/rithika-sr/mode/WORKED-RUN.md` |
| Human gate review (G4) | `course/2026fa/submissions/rithika-sr/mode/G4-HUMAN-REVIEW.md` |
| Evaluation vs human review | `course/2026fa/submissions/rithika-sr/mode/worked-run/EVALUATION.md` |
| Frictional log | `course/2026fa/submissions/rithika-sr/mode/FRICTIONAL.md` |
| Run outputs | `worked-run/out/` (Run 1), `out-run2/`, `out-run2-attempt1-no-ca/` (Run 2), `out-run3/` (Run 3), plus `out*-offline*/` replays |
| Terminal transcripts | `worked-run/terminal/` (Run 1: `T1`, `D1`–`D7c`; Run 2: `R2-*`; Run 3: `R3-*`) |
| Real candidates | `worked-run/candidates.real.json` |
| Earlier recipe, status corrected to DRAFT | `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md` |
| Video (under 4 minutes) | <EDIT ME: link> |

Branch: `mode/rithika-sr-ds-h1b-liveness`. CONTRIBUTING.md names branches `contrib/<term>-<handle>-<component>`; CI does not check the branch name, but the contract does.

## Setup (once, from the repo root)

```bash
npm install
```

```bash
python3 -m venv .venv && source .venv/bin/activate && pip install pyyaml
```

```bash
npx playwright install chromium
```

## Run

Replay Run 3 without the network into a fresh folder (expected: 13 roles → 2 scored, 3 closed, 2 over-level, 6 held):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --offline course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/replay-fixture.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/replay-check
```

New live run (opens each posting in a headless browser and makes read-only public requests). Use a new folder so recorded runs are never overwritten:

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run4
```

## Test

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v
```

```bash
npm run verify && npm run doctor
```

## AI contribution statement

Claude Code wrote the code, tests, fixtures and first drafts of these documents, and searched for real postings. It ran every command, approved by me one step at a time. I made these decisions myself:
- chose the fix-round direction instead of reframing the first results;
- chose and approved the candidate rows;
- did the G4 browser review and made every decision recorded in `G4-HUMAN-REVIEW.md`;
- approved each run before it was made.
