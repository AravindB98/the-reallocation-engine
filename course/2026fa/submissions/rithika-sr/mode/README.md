## Executive summary

This folder is rithika-sr's submission for the mode assignment. It is a screening step for a fictional international student who needs a sponsored entry-level data scientist job, built so that a job-listing site can never on its own convince the tool that a job is open. Start here to find each deliverable. The short version of the result: the tool caught the previous false positive and never scored a posting it could not confirm. A human review then found one new false positive and one missed open job, both written up as proposed fixes.

## What this submission is

A mode built on the earlier sponsor-triage recipe. It adds live, verbatim liveness checks, an aggregator rule (a job-board link needs a live employer link), and a separate CLOSED outcome for jobs verified gone. It was run on 13 real public postings on 2026-10-21 with a fictional persona, Sasha Jones, and every recommendation was reviewed by hand.

## Deliverables → files

The new assignment text names `assignments/submissions/<name>/` and `logs/RUN_LOG.md`. This repository uses `course/<term>/submissions/<handle>/` (CONTRIBUTING.md), and `logs/RUN_LOG.md` is maintainer-only (CI rejects student edits). Run entries go in `logs/runs/<term>-<handle>-<n>.md`, which the assignment allows ("or include it in your submission"). This table lists the deliverables named in my instructions. Check it against the Canvas page before submitting.

| Deliverable | File |
|---|---|
| Recipe (agent) | `recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md` (DRAFT, 13 typed TODOs) |
| Card (human) | `recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.card.md` |
| Code | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py`, `aggregators.json` |
| Tests + fixtures | `scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/test_mode_run.py`, `fixtures/` |
| Run log | `logs/runs/2026fa-rithika-sr-2.md` |
| Domain justification | `course/2026fa/submissions/rithika-sr/mode/DOMAIN-JUSTIFICATION.md` |
| Worked run (commands, real output, attestation) | `course/2026fa/submissions/rithika-sr/mode/WORKED-RUN.md` |
| Human gate review (G4) | `course/2026fa/submissions/rithika-sr/mode/G4-HUMAN-REVIEW.md` |
| Frictional log | `course/2026fa/submissions/rithika-sr/mode/FRICTIONAL.md` |
| Run outputs | `course/2026fa/submissions/rithika-sr/mode/worked-run/out/` (live), `out-offline/` (fixture) |
| Terminal transcripts | `course/2026fa/submissions/rithika-sr/mode/worked-run/terminal/` |
| Real candidates | `course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json` |
| Earlier recipe, status corrected to DRAFT | `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md` |
| Video (under 4 minutes) | <EDIT ME: link> |

Branch: `mode/rithika-sr-ds-h1b-liveness`. CONTRIBUTING.md names branches `contrib/<term>-<handle>-<component>`. CI does not check the branch name, but the contract does.

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

Offline, reproducible (no network):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/candidates.mode.test.json --targets scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/mini_targets.csv --offline scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/liveness.offline.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline
```

Live (opens each posting in a headless browser):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out
```

## Test

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v
```

```bash
npm run verify && npm run doctor
```

## AI contribution statement

Claude Code wrote the code, tests, fixtures and first drafts of these documents. It also searched for real postings and ran every command. I designed the gates together with Claude chat, chose and approved the candidate rows, did the G4 browser review, and made every final decision recorded in `G4-HUMAN-REVIEW.md`.
