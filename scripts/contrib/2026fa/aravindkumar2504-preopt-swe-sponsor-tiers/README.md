---
owner: aravindkumar2504
term: 2026fa
component: preopt-swe-sponsor-tiers
status: RUNNABLE-SAMPLE
promoted_to: null
---

# Pre-OPT backend sponsor tiers (prototype)

## Executive summary

This is a small program that helps one kind of job seeker: an international master's student who graduates soon, has not started work authorization, and wants a backend software job at a company that will sponsor a work visa. Given a public table of funded companies, it shows for each company what the records say about sponsoring this kind of job, how much evidence stands behind that, and where the records are silent.

Read it if you want to see how the recipe works in practice, or to run it yourself. It runs offline in about a second, on data that ships with the repository. On the sample data its most important result is a limit: only about 5 percent of the 30,369 companies have any sponsorship record, so the honest output is a short list, a large "unknown" remainder, and two steps only a person can do (confirm the posting is real, and read it for eligibility traps). It sends its evidence to the repository's own scorer and never replaces it.

## Run

From the repository root (`npm install` once; nothing else is needed):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30
```

The company table is about a year old, so the run refuses to start without `--accept-stale-vintage`, and the report states the age. Remove the flag to see the refusal (exit 3, nothing written).

## Test

Offline, no network. Fixtures are synthetic, the persona is the committed fictional one, and the real scorer is run as a command:

```bash
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

Before pushing, the repository's own checks:

```bash
npm run verify
npm run doctor
node scripts/pii-scan.mjs
node scripts/conformance.mjs scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/
```

## Options

| Flag | Meaning | Default |
|---|---|---|
| `--as-of YYYY-MM-DD` | the run date (an input, so runs are repeatable) | today |
| `--accept-stale-vintage` | proceed although the table is more than 6 months old | off |
| `--watchlist file` | the candidate's own company names, one per line | none |
| `--discover N` | how many discovered companies the report shows (the log keeps all) | 15 |
| `--persona file` | a persona profile | `search/examples/kiran-rao/profile.yml` |
| `--csv`, `--bls`, `--formd-dir` | data locations | the shipped files |
| `--soc`, `--family`, `--days-used`, `--days-to-start` | fill in what an older persona file lacks; recorded as command-line values | from the persona |
| `--out-dir dir` | where outputs go | `course/2026fa/submissions/aravindkumar2504/runs/<as-of>/` |

## Outputs

Written to the output folder. A run may write only inside this recipe's own runs folder, inside `private/`, or outside the repository; it refuses anything else. The four files this program writes are byte-identical when the same inputs are run again. The scorer's own two files carry the date the scorer ran, so running on another day rewrites those two tracked files; discard that with `git checkout` if you only re-ran to look.

- `report.md`: the plain-language report for a person.
- `run-log.json`: the agent log, with every input hash, the parameters, the gate results, every row and a label for every field.
- `roles.json`, `scorer-profile.json`, `role-scores.json`, `role-scores.md`: what was sent to the scorer and what it returned.

## Exit codes

0 done · 2 bad input (a persona that is missing fields or is not valid YAML, a renamed data column, bad options, a missing Form D folder that was asked for, or real data aimed at a tracked folder) · 3 data too old · 4 the scorer's answer failed the integrity check · 5 the scorer itself failed.

## The files

| File | What it does |
|---|---|
| `preopt-sponsor-tiers.mjs` | the command: runs the gates in order and writes the outputs |
| `evidence.mjs` | reads the data files; name matching; titles; tiers; funding; the wage ratio; the Form D spot check |
| `timeline.mjs` | the visa-timeline gate, from dates |
| `persona.mjs` | reads and checks the persona; invents no defaults |
| `scorer-bridge.mjs` | writes the scorer's input, runs the scorer, and checks its answer |
| `report.mjs` | renders the report and the agent log |
| `params.json`, `role-families.json` | the thresholds and the title rule, proposed by the assistant and not yet confirmed by the author, each with its reasoning |
| `sample-inputs/watchlist.txt` | a sample company list that exercises every branch |
| `fixtures/` | synthetic test data, plus two deliberately wrong stand-in scorers used only by break tests |

## What it does not do

It does not decide to apply. It does not check that a posting exists (gate H1) or read one (gate H2). It does not score fit. It does not treat a missing record as a no. It cannot tell you why every count in the table is even. The recipe lists what it can and cannot verify, and nine typed proposals for the engine and the data.

## Using your own data

A persona outside `search/examples/`, or a watchlist that is not one of the committed samples, is treated as real data: keep the persona in the untracked `search/` layer (start from `cp search/examples/kiran-rao/profile.yml search/profile.yml` and edit), keep a real watchlist in `private/` (a company list shows job-search activity), and send the output to `private/` or outside the repository. The program refuses to write either into a tracked folder.

## Credits and assistance

- The tool is a companion to the repository's scorer and reuses its rules: the name normalization is a port of `normalize_company_name` in `scripts/sec/entity-resolution.py`; the tier vocabulary and the timeline idea come from chapters 7, 10 and 11 of the book in this repository; the data is the 80 Days to Stay table and the BLS and SEC files shipped here.
- Written with Claude Code (Sonnet 5.5) in a working session on 2026-09-30. The author, Aravind Sundaravadivelu, chose the recipe from three options; the assistant wrote the rest, and the author has not yet reviewed the code, the parameters or the results. What the assistant did, what the author decided or has not yet checked, and what went wrong along the way are recorded in `course/2026fa/submissions/aravindkumar2504/FRICTIONAL.md` and `SOURCES.md`.
