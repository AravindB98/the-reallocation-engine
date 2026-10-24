---
owner: Gnanasudharsan
term: 2026fa
component: de-mlops-h1b
status: DRAFT
promoted_to: null
---

# de-mlops-h1b — prototype

## Executive summary

A small Node script that checks data-engineering and MLOps job postings against the engine's
H-1B sponsorship records, a saved posting-liveness check, and a pre-OPT student's
work-authorization dates. It sends only postings with complete evidence to the engine's
existing scorer, puts the rest on hold with a reason, and writes a JSON log for agents and a
Markdown report for people. It reads local files only and invents no values.

Recipe: `recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md` · Card: `…card.md`

## Run (from repo root)

```bash
node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs --persona scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json --postings scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json --liveness scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt
```

Writes:

- `roles.json` + `profile.json`, written here. These are the scorer input.
- `course/2026fa/submissions/gnanasudharsan/runs/<today>/`, containing `de-mlops-h1b-log.json`, `de-mlops-h1b-report.md`, and the scorer's own `role-scores.{json,md}`.

Options: `--csv`, `--formd-dir`, `--bls` (default to the real repo data), `--today YYYY-MM-DD`,
`--out-dir`, `--roles-dir`. Exit codes: 0 ok · 2 bad input / G0 failed · 3 scorer misread the
profile · 4 scorer failed.

The scorer is `scripts/score/role-scorer.mjs`, spawned unchanged. There is no copy here.

## Test (offline)

```bash
node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/
```

## Files

| Path | What |
|---|---|
| `de-mlops-h1b.mjs` | the prototype |
| `de-mlops-h1b.test.mjs` | 14 offline tests; spawns the prototype, which spawns the real scorer |
| `fixtures/companies.sample.csv` | 13 rows copied verbatim from the 80 Days CSV (officer/director/phone columns dropped) |
| `fixtures/formd/` | 3 Form D records copied from the shipped samples (people and addresses removed) |
| `fixtures/persona*.json` | fictional persona (`@example.com`) + a past-dates and a regex-trap variant |
| `fixtures/postings.json`, `fixtures/liveness.txt` | hand-written test postings at `example.com`, and liveness lines in the checker's output format (not a real run) |
| `sample/postings.json` | 12 real public postings from Greenhouse boards, fetched 2026-10-01. **`fit` 0.7 and `start_date: "flexible"` are placeholders the student must replace** |
| `sample/liveness.txt` | real `npm run ats:liveness` output, one URL per call, 2026-10-01 |
| `sample/liveness-batch.txt` | real output of the same 12 URLs in one call: the batch-interference defect |
