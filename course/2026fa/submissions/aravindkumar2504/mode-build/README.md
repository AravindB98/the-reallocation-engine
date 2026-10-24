# Mode Build submission: pre-OPT backend sponsor tiers (version 0.2.0)

## Executive summary

This folder holds the written part of Aravind Sundaravadivelu's submission (GitHub `AravindKumar2504`) to the INFO 7375 assignment "The Reallocation Engine, Mode Build" (Fall 2026). It builds on the same author's Recipe Design submission, a mode for an international master's student who has not started work authorization and wants a backend software job at a company that will sponsor a work visa. The difference is that the mode now runs against live job boards: for the companies the sponsorship records shortlist, it finds a real posting, checks the page is live, quotes the sentences that matter, and stops for a person to decide.

Read this page to find each deliverable. What the run found: of 59 shortlisted companies, a job board was found for 26, 8 postings were chosen, the checker found 7 live, and the author cleared those 7 after reading them; one posting was gone although its job board still listed it. Nothing yet checks whether an employer will wait for a candidate who cannot start for months. The mode still calls itself a draft, because ten proposals for the engine and its data are still open.

## Where each deliverable is

The repository's `CONTRIBUTING.md`, and the check that runs on every pull request, accept student files only in a few places, so some deliverables sit somewhere other than the brief's suggested path:

| The brief asks for | The brief's suggested place | Where it is, and why |
|---|---|---|
| The mode file | `recipes/` | `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.md`, with its human card `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.card.md` (student recipes live in `recipes/cases/<term>/`) |
| The domain justification | `assignments/submissions/<name>/` | `course/2026fa/submissions/aravindkumar2504/mode-build/domain-justification.md` (student submissions live in `course/<term>/submissions/<handle>/`; there is no `assignments/` folder) |
| The worked run, with the attestation | `assignments/submissions/<name>/` | `course/2026fa/submissions/aravindkumar2504/mode-build/worked-run.md` |
| The RUN_LOG entry | appended to `logs/RUN_LOG.md`, or included in the submission | `logs/runs/2026fa-aravindkumar2504-2.md` (the rules say students never edit `logs/RUN_LOG.md`; each entry is its own file) |
| New and edited scripts, sample data | anywhere | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/` (see its `README.md`) |
| The run's outputs | not named | `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/` and its `live/` folder |
| The branch | `mode/<yourname>-<domain>` | `mode/aravindkumar2504-preopt-backend-swe` |

Also here: `author-decisions.md`, the author's own calls (parameters, both posting gates, the rule for conditional export clauses), checks and reflection picks, with their times, and `author-picks.json`, every multiple-choice question the author answered, with the options as offered and the pick, word for word.

For Canvas: `reallocation-aravindkumar2504-mode.zip`, built from the pushed commit. Pull request title: "pre-OPT backend sponsor tiers (F-1, SOC 15-1252): DRAFT, with a live run and both posting gates decided by the author".

## Start here (ten minutes)

1. Read the executive summary of `worked-run.md`, then its "Verified and inferred" section.
2. Open `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live/report-live.md`, the report a person would read.
3. From the repository root, run the tests and the sample run (neither changes a tracked file):

```bash
npm install
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-10-20 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run
```

4. To see gate H1 work, check one posting and one made-up job number (it needs the browser the checker drives: `npx playwright install chromium`):

```bash
npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/5194598007"
npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/1"
```

## Where it stands

- **Status: DRAFT**, with 11 typed TODOs open: five scorer defects or gaps, three data sources, a tie-break for the posting cap, job-board reach beyond three systems, and a start-date rule. Two TODOs from version 0.1.0 were closed by building them (the batch liveness check and the posting screen).
- **Runs that exist, and do not raise the claim:** a sample run, and a live run in which the author decided gate H1 on all 8 chosen postings and gate H2 on the 7 that passed H1.
- **Version 0.1.0 claimed RUNNABLE-SAMPLE with nine open TODOs.** That broke the lifecycle's first rule, and this version corrects it.

## AI use

Built on 2026-10-19 and 2026-10-20. Following the engine's own rule (AI executes, a person decides), Claude Code (Opus 5.5) did the execution: it proposed the design and the options, wrote the code and the documents, and ran every command not listed under the author's name. The judgment is the author's: choosing the mode, deciding the parameters and rules marked as the author's, reading every chosen posting and deciding both human gates wherever they applied, reading the live report, and running the checks and break attempts recorded under the author's name (see `author-decisions.md` and `author-picks.json`). Version 0.1.0's split of the work is in `course/2026fa/submissions/aravindkumar2504/SOURCES.md`.
