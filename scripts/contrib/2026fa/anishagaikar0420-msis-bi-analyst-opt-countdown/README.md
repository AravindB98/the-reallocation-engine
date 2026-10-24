---
owner: anishagaikar0420
term: 2026fa
component: msis-bi-analyst-opt-countdown
status: DRAFT
promoted_to: null
---

# OPT-window countdown (MS Information Systems → BI analyst, May 2027)

## Executive summary

A small program for one specific student: an international master's student in Information Systems / Business Analytics who graduates in May 2027 and is looking for business-intelligence analyst jobs. It takes a list of job postings and answers two questions she cannot easily see from the outside: *can this job start inside my OPT window?* and *has this company actually sponsored H-1B visas?* It hands the numbers to the repository's existing role scorer and writes two files: a readable report with a next step for each job, and a machine log. When a fact is missing it says so and tells you what to check — it never fills the gap with a guess. It has only been run on sample data.

## Run it (one command, from the repo root)

```bash
node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
```

Writes to `course/2026fa/submissions/anishagaikar0420/runs/<run-date>-v<recipe_version>/` (e.g. `runs/2026-09-30-v0.1.1/`):

| File | For | What |
|---|---|---|
| `opt-countdown-report.md` | the person | decisions, next action, every value labeled |
| `opt-countdown-log.json` | an agent | same content, machine-readable, with input file hashes |
| `roles.json` | the scorer | scorer-shaped input (same shape as `data/examples/ch11-roles.json`) |
| `role-scores.json` / `.md` | — | written by the **existing** `scripts/score/role-scorer.mjs`, not a copy |

## Test it (offline, fixtures only)

```bash
node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs
node scripts/conformance.mjs scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/
```

## Options

| Flag | Default | Notes |
|---|---|---|
| `--profile` | `examples/profile.persona.json` | your dates + every rule/threshold (all your-input) |
| `--roles` | `examples/roles.persona.json` | candidate postings |
| `--as-of` | profile `as_of`, else today | the run date |
| `--liveness-log` + `--liveness-date` | none | saved stdout of `npm run ats:liveness -- <urls>`; makes liveness a **record** |
| `--out-dir` | `course/2026fa/submissions/anishagaikar0420/runs/<date>-v<version>` | refuses `data/`, `recipes/`, `logs/` |
| `--csv` / `--soc` / `--formd-dir` | the repo's real files | tests point these at `fixtures/` |

To use real liveness (needs network + Playwright):

```bash
npm run ats:liveness -- <url1> <url2> > private/liveness-$(date +%F).txt
node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs \
  --liveness-log private/liveness-$(date +%F).txt --liveness-date $(date +%F) --as-of $(date +%F)
```

(`private/` is gitignored — real posting lists stay out of git.)

## Exit codes

`0` ok · `2` bad input · `3` OPT window closed or impossible dates (nothing written) · `4` the scorer failed.

## Data read

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — H-1B approvals/denials, sampled titles, funding
- `data/bls/compact/soc_occupation_compact.csv` — national wage + cognitive pivot score (context only)
- `data/sec/form-d/processed/sample/*.sample.json` — Form D samples (50 companies each; absence proves nothing)

Recipe: `recipes/cases/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown.md` (card: `.card.md`).
