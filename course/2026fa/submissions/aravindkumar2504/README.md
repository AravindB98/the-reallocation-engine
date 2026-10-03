# Submission: pre-OPT backend sponsor tiers

## Executive summary

This folder holds the written part of one submission to the INFO 7375 assignment "The Reallocation Engine, Recipe Design Assignment" (Fall 2026), by Aravind Sundaravadivelu (GitHub `AravindKumar2504`). The work is a recipe, its card and a small prototype for one job seeker: an international master's student who graduates in the spring, has not started work authorization, and wants a backend software job at a company that will sponsor a work visa. The prototype reads the repository's own company table, turns each company's visa-sponsorship record into a tier, keeps "no record" as unknown instead of "no", computes the student's visa-timeline gate from dates, and runs the repository's scorer as a command. It stops at two steps only a person can do: check that the posting is live, and read it for eligibility traps. An AI assistant (Claude Code) wrote almost all of it; `SOURCES.md` and `FRICTIONAL.md` say exactly who did what, and what the author has not yet checked.

## Start here (ten minutes)

1. Read the executive summary of `worked-run.md`, then its section 3 (what is verified, what is inferred).
2. Install the dependencies once, then run the prototype and the tests from the repository root (the two `node` commands change no tracked file):

```bash
npm install
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

3. Open `/tmp/tiers-run/report.md`. It is the same as `runs/2026-09-30/report.md` here, apart from the folder names in one line of its run record.

## What is in this folder

| File | What it is |
|---|---|
| `CHANGE-BRIEF.md` | written before any code: the situation, predictions and planned failure cases; later revisions are appended, never rewritten |
| `domain-justification.md` | who it is for, the information asymmetry, where it fits the 3-3-2 day, domain-specific failure modes |
| `worked-run.md` | the commands run, with their real output, what is verified and what is inferred, the reflection and the attestation |
| `TEST-REPORT.md` | the toolchain before and after, the offline tests, the deliberate breaks, each named failure case, a clean checkout, and what a person must still judge |
| `FRICTIONAL.md` | the honest log: what was tried, what went wrong, what the assistant did and what the author did |
| `SOURCES.md` | the repository documents, data and tools used, and the split between the assistant's work and the author's |
| `title-matcher-check.md` | an 80-title check of the rule that decides which titles count as backend |
| `runs/2026-09-30/` | the committed sample run: `report.md` and `run-log.json` plus the scorer's input and output |

The rest of the submission is in its assigned places: the recipe and card in `recipes/cases/2026fa/` (`aravindkumar2504-preopt-swe-sponsor-tiers.md` and `.card.md`), the prototype, its tests and fixtures in `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/` (see its `README.md`), the run-log entry in `logs/runs/2026fa-aravindkumar2504-1.md`, and one new fictional persona, `search/examples/kiran-rao/profile.yml`, in the directory the repository reserves for them (the only file outside the four assigned locations).

## Where it stands

The recipe claims RUNNABLE-SAMPLE (sample data only; attestation null) and says plainly why that is the weaker claim: nine typed proposals are still open, and no person has cleared gate H1 or H2 on any company. The author has not yet confirmed the thresholds the assistant proposed. The author read the sample run's report and signed its adequacy on 2026-10-03, for the sample path only. Nothing here shows that any job exists.
