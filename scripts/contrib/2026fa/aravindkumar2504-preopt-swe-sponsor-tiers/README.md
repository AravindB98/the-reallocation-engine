---
owner: aravindkumar2504
term: 2026fa
component: preopt-swe-sponsor-tiers
status: DRAFT
promoted_to: null
---

# Pre-OPT backend sponsor tiers (prototype)

## Executive summary

This is a small set of programs that helps one kind of job seeker: an international master's student who graduates soon, has not started work authorization, and wants a backend software job at a company that will sponsor a work visa. Given a public table of companies, the first program shows for each company what the records say about sponsoring this kind of job, how much evidence stands behind that, and where the records are silent. The live step then takes the companies worth a closer look to their job boards, picks one backend posting each, checks that the page is live, and quotes the sentences a person must read before deciding.

Read it if you want to see how the recipe works in practice, or to run it yourself. The first program runs offline in under a second, on data that ships with the repository; the live step reads public job boards. Its most important result is a limit: only about 5 percent of the 30,369 companies have any sponsorship record, and in the first live run a job board was found for only 26 of the 59 shortlisted companies, under the names tried. A person cleared 7 postings; one listed posting was already gone. It sends its evidence to the repository's own scorer and never replaces it, and it never clears a posting that no person has decided.

## About this folder

Student: Aravind Sundaravadivelu (GitHub `AravindKumar2504`). Course: INFO 7375, Fall 2026. Assignments: The Reallocation Engine, Recipe Design (version 0.1.0) and Mode Build (version 0.2.0, the live step). Recipe: `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.md`. The submission documents are in `course/2026fa/submissions/aravindkumar2504/` (for the Mode Build, start with `course/2026fa/submissions/aravindkumar2504/mode-build/README.md`).

## Run

From the repository root (`npm install` once; nothing else is needed for this step):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-10-20 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run
```

It writes its outputs to `/tmp/tiers-run`, so no tracked file changes. The committed sample run, `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/`, was made with the same command and `--out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-10-20` (the version 0.1.0 run is kept in `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/`). The company table is about a year old, so the run refuses to start without `--accept-stale-vintage`, and the report states the age. Remove the flag to see the refusal (exit 3, nothing written).

## The live step

It needs the network and the browser the liveness checker drives (`npx playwright install chromium`). The repository's scanner writes a data/ats folder wherever it runs, so it is run from an empty folder outside the repository and never touches the repository's private data/ats folder:

```bash
REPO=$PWD
D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers
R=/tmp/tiers-run
node $D/find-boards.mjs --scores $R/role-scores.json --out-dir $R/live
rm -rf /tmp/tiers-scan && mkdir -p /tmp/tiers-scan && (cd /tmp/tiers-scan && REALLOCATION_ENGINE_PORTALS=$R/live/live-portals.yml node $REPO/scripts/ats/scan.mjs)
cp /tmp/tiers-scan/data/ats/scan-history.tsv $R/live/scan-history.tsv
node $D/select-postings.mjs --history $R/live/scan-history.tsv --boards $R/live/boards.json --out-dir $R/live
node $D/h1-liveness.mjs --urls $R/live/h1-urls.txt --out-dir $R/live
node $D/h2-screen.mjs --selected $R/live/selected-postings.json --boards $R/live/boards.json --out-dir $R/live
node $D/live-report.mjs --run $R --live $R/live
```

A person then reads each chosen posting and records the decisions as `gate-decisions.json` in the live folder (the shape is in the committed run), and the last command is run again. Without that file every posting stays held. The committed live run is `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live/`; the commands exactly as run, with their output, are in `course/2026fa/submissions/aravindkumar2504/mode-build/worked-run.md`.

## Test

Offline, no network. Fixtures are synthetic, the persona is the committed fictional one, the real scorer is run as a command, and a stand-in replaces the liveness checker:

```bash
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

Two more commands show that the tests and the evidence are real. The first breaks the code one way at a time, in a private copy, and reports whether a test failed (81 breaks, a few minutes). The second runs the small checks behind the pasted evidence in the worked run (`scenarios`, `scorer-probe`, `watchlist`, `source`, `formd-pairs`, `parity-names`, `parity-titles`; python3 is needed for the last two):

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

The base program:

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

The live step: `find-boards.mjs --scores <role-scores.json> --out-dir <dir> [--max-companies N]`; `select-postings.mjs --history <scan-history.tsv> --boards <boards.json> --out-dir <dir> [--families <file>] [--params <file>]`; `h1-liveness.mjs --urls <h1-urls.txt> --out-dir <dir> [--checker <file>]`; `h2-screen.mjs --selected <selected-postings.json> --boards <boards.json> --out-dir <dir>`; `live-report.mjs --run <base run folder> --live <live folder>`.

## Outputs

Written to the output folder. A run whose inputs all sit in the committed sample locations (`search/examples/`, this folder's `sample-inputs/` and `fixtures/`, and the repository's own company table, wage file and Form D samples) may write inside the repository only in `course/2026fa/submissions/aravindkumar2504/runs/`. A persona outside `search/examples/`, or a watchlist, company table, wage file or Form D folder outside those locations, is treated as real data, and its output may go only to `private/` or outside the repository; the program compares where paths really are (through symlinks and letter case) and refuses anything else. It checks where a file is, not whether git tracks it, so a real file placed in a sample location would be treated as a sample. Paths outside the repository are written into outputs as `<outside the repository>/name`, never as this machine's folders.

The four files the base program writes are byte-identical when the same inputs are run again into the same output folder. The scorer's own two files carry the date the scorer ran (in UTC), so running on another day into the committed sample folder rewrites those two tracked files; discard that with `git checkout` if you only re-ran to look.

- `report.md`: the plain-language report for a person.
- `run-log.json`: the agent log, with every input hash, the parameters, the gate results, every row, and a label for every value.
- `roles.json`, `scorer-profile.json`, `role-scores.json`, `role-scores.md`: what was sent to the scorer and what it returned.
- In `live/`: `report-live.md` for a person and `run-log-live.json` for an agent, plus the evidence each step wrote (`boards.json`, `live-portals.yml`, `scan-history.tsv`, `scan.stdout.txt`, `selected-postings.json`, `h1-urls.txt`, `h1-liveness.json` with the checker's own output in `h1-liveness.stdout.txt`, `h2-screen.json`) and the person's `gate-decisions.json`.

## Exit codes

The base program: 0 done · 1 an unexpected error (a bug; the stack trace is printed) · 2 bad input (a persona that is missing fields, is not valid YAML or says it does not need sponsorship, a renamed data column, bad options, a Form D folder that was asked for but is missing, empty or a file, an output folder that is a file or cannot be written, or real data aimed at a tracked folder) · 3 data too old · 4 the scorer's answer failed the integrity check · 5 the scorer itself failed.

The live step: 0 done · 2 bad input or a refusal (a missing argument, a missing liveness checker, an empty URL list, a scan history without the needed columns, a decisions file that is not valid, or a report whose groups do not add up to the shortlist; nothing is written over). `h1-liveness.mjs` exits 0 even when the checker finds an expired posting: the verdicts are the evidence, and the checker's own exit code is recorded.

## The files

| File | What it does |
|---|---|
| `preopt-sponsor-tiers.mjs` | the base command: runs the gates in order and writes the outputs |
| `evidence.mjs` | reads the data files; name matching; titles; tiers; funding; the wage ratio; the Form D spot check |
| `timeline.mjs` | the visa-timeline gate, from dates |
| `persona.mjs` | reads and checks the persona; invents no defaults |
| `scorer-bridge.mjs` | writes the scorer's input, runs the scorer, and checks its answer |
| `guard.mjs`, `paths.mjs` | the privacy guard (which inputs are real data, where output may go) and the path helper it uses |
| `report.mjs` | renders the report and the agent log, and holds the label dictionaries |
| `params.json`, `role-families.json` | the thresholds and the title rule, each value with who decided it and why |
| `find-boards.mjs` | live step L0: proposes a job board for each shortlisted company and writes the scanner's input |
| `select-postings.mjs`, `live-params.json` | live step L2: the posting rules and the choice, with the author's posting decisions |
| `h1-liveness.mjs` | live step L3: runs the repository's liveness checker over the chosen URLs and records one verdict per URL |
| `h2-screen.mjs` | live step L4: quotes the sentences in each posting that a person must read for gate H2 |
| `live-report.mjs` | live step L5: joins the evidence and the person's decisions under fail-closed rules |
| `sample-inputs/watchlist.txt` | a sample company list that exercises every branch |
| `*.test.mjs` | the offline tests: timeline, evidence, persona and scorer, the command end to end, the guard, the title sampler, the live step, the live report, and whether the documents name paths that exist |
| `fixtures/` | synthetic test data, plus deliberately wrong or stand-in scorers and a stand-in liveness checker used only by tests |
| `checks.mjs` | the commands behind the pasted evidence in the worked run |
| `break-it.mjs` | the deliberate-break harness |
| `check-titles.mjs` | draws the seeded title samples for the title-rule check |

## What it does not do

It does not decide to apply. It checks postings only at companies whose job board it can find on Greenhouse, Lever or Ashby, and a person makes both posting calls. It does not score fit. It does not treat a missing record as a no. It cannot tell you why every count in the table is even. It does not check whether an employer will wait until the candidate can start. The recipe lists what it can and cannot verify, and eleven open typed proposals for the engine and the data.

## Using your own data

A persona outside `search/examples/`, or a watchlist, company table, wage file or Form D folder outside the committed sample locations, is treated as real data: keep the persona in the untracked `search/` layer (start from `cp search/examples/kiran-rao/profile.yml search/profile.yml` and edit), keep a real watchlist in `private/` (a company list shows job-search activity), and send the output to `private/` or outside the repository. The program refuses to write the output of such inputs into a tracked folder (but never put real data in `search/examples/` or this folder's `sample-inputs/` and `fixtures/`: those count as samples). The candidate must need sponsorship (`needs_sponsorship: true`); the program refuses a persona that does not, because the scorer would then drop the sponsorship term. A live step on a real persona's shortlist shows real job-search activity too: keep its folder in `private/`.

## Credits and assistance

- The tool is a companion to the repository's scorer and reuses its rules: the name normalization is a port of `normalize_company_name` in `scripts/sec/entity-resolution.py`; the tier vocabulary and the timeline idea come from chapters 7, 10 and 11 of the book in this repository; the data is the 80 Days to Stay table and the BLS and SEC files shipped here. The live step runs the repository's own job-board providers, scanner and liveness checker in `scripts/ats/`, unmodified.
- Version 0.1.0 was written with Claude Code (Sonnet 5.5) on 2026-09-30; what the assistant did and what the author decided for it is recorded in `course/2026fa/submissions/aravindkumar2504/FRICTIONAL.md` and `course/2026fa/submissions/aravindkumar2504/SOURCES.md`. Version 0.2.0 was built on 2026-10-19 and 2026-10-20. AI use: following the engine's own rule (AI executes, a person decides), Claude Code (Opus 5.5) did the execution: it proposed the design and the options, wrote the code and the documents, and ran every command not listed under the author's name. The judgment is the author's: choosing the mode, deciding the parameters and rules marked as the author's, reading every chosen posting and deciding both human gates wherever they applied, reading the live report, and running the checks and break attempts recorded under the author's name (`course/2026fa/submissions/aravindkumar2504/mode-build/author-decisions.md`, with every pick word for word in `course/2026fa/submissions/aravindkumar2504/mode-build/author-picks.json`).
