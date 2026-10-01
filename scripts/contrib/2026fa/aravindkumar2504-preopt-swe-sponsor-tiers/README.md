---
owner: aravindkumar2504
term: 2026fa
component: preopt-swe-sponsor-tiers
status: RUNNABLE-SAMPLE
promoted_to: null
---

# Pre-OPT backend sponsor tiers (prototype)

Student: Aravind Sundaravadivelu (GitHub `AravindKumar2504`). Course: INFO 7375, Fall 2026. Assignment: The Reallocation Engine, Recipe Design Assignment. Recipe: `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.md`. The submission documents are in `course/2026fa/submissions/aravindkumar2504/` (start with its `README.md`).

## Executive summary

This is a small program that helps one kind of job seeker: an international master's student who graduates soon, has not started work authorization, and wants a backend software job at a company that will sponsor a work visa. Given a public table of companies, it shows for each company what the records say about sponsoring this kind of job, how much evidence stands behind that, and where the records are silent.

Read it if you want to see how the recipe works in practice, or to run it yourself. It runs offline in under a second, on data that ships with the repository. On the sample data its most important result is a limit: only about 5 percent of the 30,369 companies have any sponsorship record, so the honest output is a short list, a large "unknown" remainder, and two steps only a person can do (confirm the posting is real, and read it for eligibility traps). It sends its evidence to the repository's own scorer and never replaces it.

## Run

From the repository root (`npm install` once; nothing else is needed):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run
```

It writes its outputs to `/tmp/tiers-run`, so no tracked file changes. The committed sample run, `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/`, was made with the same command and `--out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30`. The company table is about a year old, so the run refuses to start without `--accept-stale-vintage`, and the report states the age. Remove the flag to see the refusal (exit 3, nothing written).

## Test

Offline, no network. Fixtures are synthetic, the persona is the committed fictional one, and the real scorer is run as a command:

```bash
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

Two more commands show that the tests and the evidence are real. The first breaks the code one way at a time, in a private copy, and reports whether a test failed (a few minutes). The second runs the small checks behind the pasted evidence in the worked run (`scenarios`, `scorer-probe`, `watchlist`, `source`, `formd-pairs`, `parity-names`, `parity-titles`; python3 is needed for the last two):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/break-it.mjs
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs scenarios
```

Before pushing, the repository's own checks (`npm run verify` and the conformance check need Python's YAML package on the path):

```bash
npm run verify
npm run doctor
node scripts/pii-scan.mjs
node scripts/conformance.mjs scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/
```

## Options

| Flag | Meaning | Default |
|---|---|---|
| `--as-of YYYY-MM-DD` | the run date (an input, so runs are repeatable) | today's date in UTC |
| `--accept-stale-vintage` | proceed although the table is more than 6 months old | off |
| `--watchlist file` | the candidate's own company names, one per line | none |
| `--discover N` | how many discovered companies the report shows (the log keeps all) | 15 |
| `--persona file` | a persona profile | `search/examples/kiran-rao/profile.yml` |
| `--csv`, `--bls`, `--formd-dir` | data locations | the shipped files |
| `--soc`, `--family`, `--days-used`, `--days-to-start` | fill in what an older persona file lacks; recorded as command-line values | from the persona |
| `--out-dir dir` | where outputs go | `private/tiers-run/<as-of>/` (git ignores `private/`, so a bare run changes no tracked file) |

## Outputs

Written to the output folder. A run whose inputs all sit in the committed sample locations (`search/examples/`, this folder's `sample-inputs/` and `fixtures/`, and the repository's own company table, wage file and Form D samples) may write inside the repository only in `course/2026fa/submissions/aravindkumar2504/runs/`. A persona outside `search/examples/`, or a watchlist, company table, wage file or Form D folder outside those locations, is treated as real data, and its output may go only to `private/` or outside the repository; the program compares where paths really are (through symlinks and letter case) and refuses anything else. It checks where a file is, not whether git tracks it, so a real file placed in a sample location would be treated as a sample. Paths outside the repository are written into outputs as `<outside the repository>/name`, never as this machine's folders.

The four files this program writes are byte-identical when the same inputs are run again into the same output folder. The scorer's own two files carry the date the scorer ran (in UTC), so running on another day into the committed sample folder rewrites those two tracked files; discard that with `git checkout` if you only re-ran to look.

- `report.md`: the plain-language report for a person.
- `run-log.json`: the agent log, with every input hash, the parameters, the gate results, every row, and a label for every value.
- `roles.json`, `scorer-profile.json`, `role-scores.json`, `role-scores.md`: what was sent to the scorer and what it returned.

## Exit codes

0 done · 1 an unexpected error (a bug; the stack trace is printed) · 2 bad input (a persona that is missing fields, is not valid YAML or says it does not need sponsorship, a renamed data column, bad options, a Form D folder that was asked for but is missing, empty or a file, an output folder that is a file or cannot be written, or real data aimed at a tracked folder) · 3 data too old · 4 the scorer's answer failed the integrity check · 5 the scorer itself failed.

## The files

| File | What it does |
|---|---|
| `preopt-sponsor-tiers.mjs` | the command: runs the gates in order and writes the outputs |
| `evidence.mjs` | reads the data files; name matching; titles; tiers; funding; the wage ratio; the Form D spot check |
| `timeline.mjs` | the visa-timeline gate, from dates |
| `persona.mjs` | reads and checks the persona; invents no defaults |
| `scorer-bridge.mjs` | writes the scorer's input, runs the scorer, and checks its answer |
| `guard.mjs`, `paths.mjs` | the privacy guard (which inputs are real data, where output may go) and the path helper it uses |
| `report.mjs` | renders the report and the agent log, and holds the label dictionaries |
| `params.json`, `role-families.json` | the thresholds and the title rule, proposed by the assistant and not yet confirmed by the author, each with its reasoning |
| `sample-inputs/watchlist.txt` | a sample company list that exercises every branch |
| `*.test.mjs` | the offline tests: timeline, evidence, persona and scorer, the command end to end, the guard, the title sampler, and whether the documents name paths that exist |
| `fixtures/` | synthetic test data, plus deliberately wrong or stand-in scorers used only by break tests |
| `checks.mjs` | the commands behind the pasted evidence in the worked run |
| `break-it.mjs` | the deliberate-break harness |
| `check-titles.mjs` | draws the seeded title samples for the title-rule check |

## What it does not do

It does not decide to apply. It does not check that a posting exists (gate H1) or read one (gate H2). It does not score fit. It does not treat a missing record as a no. It cannot tell you why every count in the table is even. The recipe lists what it can and cannot verify, and nine typed proposals for the engine and the data.

## Using your own data

A persona outside `search/examples/`, or a watchlist, company table, wage file or Form D folder outside the committed sample locations, is treated as real data: keep the persona in the untracked `search/` layer (start from `cp search/examples/kiran-rao/profile.yml search/profile.yml` and edit), keep a real watchlist in `private/` (a company list shows job-search activity), and send the output to `private/` or outside the repository. The program refuses to write the output of such inputs into a tracked folder (but never put real data in `search/examples/` or this folder's `sample-inputs/` and `fixtures/`: those count as samples). The candidate must need sponsorship (`needs_sponsorship: true`); the program refuses a persona that does not, because the scorer would then drop the sponsorship term.

## Credits and assistance

- The tool is a companion to the repository's scorer and reuses its rules: the name normalization is a port of `normalize_company_name` in `scripts/sec/entity-resolution.py`; the tier vocabulary and the timeline idea come from chapters 7, 10 and 11 of the book in this repository; the data is the 80 Days to Stay table and the BLS and SEC files shipped here.
- Written with Claude Code (Sonnet 5.5) in a working session on 2026-09-30. The author, Aravind Sundaravadivelu, chose the recipe from three options; the assistant wrote the rest, and the author has not yet reviewed the code, the parameters or the results. What the assistant did, what the author decided or has not yet checked, and what went wrong along the way are recorded in `course/2026fa/submissions/aravindkumar2504/FRICTIONAL.md` and `SOURCES.md`.
