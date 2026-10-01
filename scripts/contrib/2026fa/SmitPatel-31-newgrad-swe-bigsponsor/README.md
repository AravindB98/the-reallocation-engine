---
owner: SmitPatel-31
term: 2026fa
component: newgrad-swe-bigsponsor
status: RUNNABLE-SAMPLE
promoted_to: null
---

# newgrad-swe-bigsponsor — prototype

## Executive summary

A small script for an international student who graduates in **December** and wants an **entry-level software
engineering** job at a company that sponsors many H-1B visas. For each job posting it checks two things the
student can't easily see. First, whether the company's sponsorship record actually includes entry-level
software titles or only senior and non-software ones. Second, whether the job's start date fits before the
student's OPT unemployment limit runs out. It passes what it verified to the repo's existing scorer and writes
a decision per posting, plus a list of postings a person has to look at because the data couldn't answer them.
It runs on **sample data only**: a fictional persona and fictional postings at companies that are real rows in
the shipped CSV.

## Run it (one command, from the repo root)

```bash
node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs
```

Optional flags: `--today yyyy-mm-dd` (pins the run date, for reproducible output), `--persona <file>`,
`--postings <file>`, `--out-dir <dir>`, `--csv <file>`, `--bls <file>`. To run on your own dates, pass your own
persona file, and keep it **outside git**.

Test (offline, no network):

```bash
node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs
```

## What it reads (all local)

| Input | Path | Label |
|---|---|---|
| Sponsorship records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| BLS national wage, SOC 15-1252 | `data/bls/compact/soc_occupation_compact.csv` | record |
| Persona (dates, limits, assumptions) | `fixtures/persona-dec-grad.json` (fictional) | your-input |
| Postings (company, title, start date, liveness, fit) | `fixtures/postings-sample.json` (fictional) | your-input |
| Scorer | `scripts/score/role-scorer.mjs`, run as a CLI (not copied) | — |

## What it writes (`out/` by default)

| File | For | Written by |
|---|---|---|
| `triage-log.json` | the agent: every value with its label, every exclusion with its reason | this script |
| `triage-report.md` | the person: decisions, next action, what needs a human, what wasn't checked | this script |
| `roles.json` | scorer input | this script |
| `role-scores.json`, `role-scores.md` | the scorer's own output and audit trace | `role-scorer.mjs` |

## Exit codes

`0` ok · `2` missing or invalid input (a persona field missing, a bad date, a missing CSV). No value is defaulted
· `3` the OPT unemployment window is already closed; nothing is scored.

## Files

- `lib.mjs`: pure functions (CSV parse, exact company match, title classifier, tier map, date gates)
- `triage.mjs`: the run: gates → `roles.json` → scorer CLI → log + report
- `triage.test.mjs`: 13 offline tests, including end-to-end runs against the real scorer
- `fixtures/`: fictional persona, a closed-window persona, sample postings, and a tiny made-up CSV for tests
