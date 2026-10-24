---
owner: Sreevarshann
term: 2026fa
component: de-ml-soc-sponsor
status: DRAFT
promoted_to: null
---

# de-ml-soc-sponsor — offline evidence pass for Data/ML Engineer targets

## Executive summary

This folder holds a small, offline tool for a new graduate on a student visa who is targeting Data Engineer and Machine Learning Engineer jobs. Given a short list of companies and job postings, it looks up each company's recorded visa-sponsorship history, checks whether the job titles it has sponsored before include data or ML work, pulls national occupation data for the occupations those roles are usually filed under, and folds in a posting-liveness check and the person's visa timeline. It then says, for each company, whether there is enough evidence to score it, whether it is on hold, or whether it is blocked.

Read this if you are running or reviewing the mode. The tool does not guess: a missing value stays missing, a company it cannot match exactly is blocked, and anything it infers (keyword matches, which occupation code a title belongs to) is labelled a judgment. The one question at the centre of the mode — which occupation code an employer actually files these roles under — cannot be answered from data in this project yet, so the tool reports it as proposed and never as a finding.

## Technical notes

- `lookup.py` — pure functions: name normalization, sponsor lookup and tier rule, title-keyword match, BLS lookup, Form D sample lookup, persona reader, timeline gate, liveness parsing, vote guard.
- `run.py` — command line. Writes `evidence.json` (agent log), `report.md` (human report), and, when anything is scoreable, `roles.json` + `profile.json` for the existing scorer. It never calls or re-implements the scorer.
- `fixtures/` — small slices of the public sponsor and BLS tables (personal columns removed), synthetic `ZZFIXTURE` rows for edge cases, a synthetic liveness output, and the `BROKEN-missing-as-zero.py` mutant.
- `tests/` — offline `unittest` suite; sockets are patched to fail, so any network call fails a test.

Standard library only; Python 3.12+. No network. Reads only tracked public data:
`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`,
`data/bls/compact/soc_occupation_compact.csv`,
`data/sec/form-d/processed/sample/*.sample.json`, and the fictional persona
`search/examples/priya-nair/profile.yml`. Refuses to read or write under
`private/`, `data/ats/`, or `search/resume.json`.

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/tests -v
python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py \
  --targets <targets.csv> --out-dir <dir> \
  [--liveness <saved npm run ats:liveness stdout>] [--checks <posting-checks.csv>]
npm run score -- <dir>/roles.json --profile <dir>/profile.json --out-dir <dir>
```

Exit codes: 0 ok · 2 input halt · 3 timeline gate closed · 4 authorization trap · 5 vote guard tripped.

### Definitions applied (user decisions, recorded in the recipe)

| Item | Definition |
|---|---|
| Sponsorship tier | proven: approvals ≥ 10 and approval rate ≥ 90; likely: approvals ≥ 1; possible: only denials; otherwise blocked |
| Tier → `sponsorship.p` | proven 0.9, likely 0.7, possible 0.3 — the user's definition (the scorer has no convention) |
| Fit | constant 0.5, `your-input`, neutral |
| Timeline gate | remaining = 90 − unemployment_days_used; factor 1 if remaining > buffer_target, else 0 |
| Title keywords → candidate SOC (judgment) | data engineer / etl / data platform / analytics engineer → 15-1252, 15-1243; machine learning / ml engineer / mlops / ai engineer → 15-1252, 15-2051 |
| Name join | exact normalized match only (same rules as `scripts/sec/entity-resolution.py`) |

### Known limitation (kept by decision)

Seniority is not read. Fit is a neutral constant, so a Senior posting scores
the same as an entry-level one for a new-graduate persona. The report says so
in its "cannot verify" section.

### Known defect in a maintained file (not fixed here)

`scripts/score/role-scorer.mjs:60` decides sponsorship need from the free-text
`authorization` string with `/citizen|permanent|green|gc|pr\b|no.?sponsor|authorized/`,
so "work authorized" reads as *not* needing sponsorship, and it never reads
`needs_sponsorship`. `run.py` stops with exit 4 if the persona needs
sponsorship and its authorization string would trip that pattern.
