# network-eng-h1b prototype (sample mode)

## Executive summary

This small program checks a short list of Network Engineer job openings for a fictional F-1 student. For each opening it asks whether the employer has a past record of H-1B sponsorship, and whether any of the titles it sponsored were network jobs. It sends the openings that pass every check to the repository's existing scorer, and writes two files: a report for the person and a log for the agent. Openings it cannot check are listed with the reason, never guessed. It runs on sample data only and makes no network calls.

Recipe: `recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241.md` (DRAFT v0.1.0) · decisions: `course/2026fa/submissions/prpathak1/CHANGE-BRIEF.md` (r1–r3).

## Run (from the repo root)

```bash
node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs
```

Options:
- `--persona <json>` (default `fixtures/persona.json`);
- `--candidates <json>` (default `fixtures/candidates.json`);
- `--run-date YYYY-MM-DD` (default: today, UTC; a passed date is labeled your-input);
- `--run-id <id>` (default: a timestamp).

Exit codes:

| Code | Meaning |
|---|---|
| 0 | every opening scored |
| 1 | run complete; at least one opening missing or not scored (each listed with its reason) |
| 2 | run stopped (G0, G2a, input, PII, scorer error) — nothing scored, stop record written |

## Test (offline)

```bash
node --test "scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/test/*.test.mjs"
```

Node 24 treats `node --test <dir>/` as a file path and fails with `Cannot find module`, so pass the glob (quoted). There are 19 tests:
- F1: missing company;
- F2: bare "Engineer";
- F3: closed OPT window;
- F4: the "authorized" profile trap;
- F5: 404 via `classifyLiveness` from `scripts/ats/liveness-core.mjs`;
- G1: networking list;
- G2a: input errors;
- labels, privacy, and data cross-check.

Integration tests write to `course/2026fa/submissions/prpathak1/runs/_test-*` and delete it.

## Inputs

| Input | Path | Label |
|---|---|---|
| H-1B data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`. Only `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored` are read; `phone`, `executive_officers`, `board_directors` never are. | record |
| Form D | `data/sec/form-d/processed/sample/*.sample.json` (samples only) | record, context only |
| BLS | `data/bls/compact/soc_occupation_compact.csv`, row 15-1241.00 | record, context only |
| Persona | `fixtures/persona.json` (fictional, `@example.com`) | your-input |
| Openings | `fixtures/candidates.json`: company, title, posting URL, `fit_p`, `sample_liveness` | your-input |
| Rules | `RULES` in `run.mjs` (keyword rule, sponsorship mapping, slack → factor, liveness mapping) | your-input |

Also used, never copied:
- `scripts/score/role-scorer.mjs`, run as `npm run score -- <roles.json> --profile <persona> --out-dir <run dir>`;
- `normalize_company_name()` from `scripts/sec/entity-resolution.py`, through `normalize_names.py`.

## Outputs

`course/2026fa/submissions/prpathak1/runs/<run_id>/`:

| File | What it is |
|---|---|
| `run.json` | agent log; every value is `{value, label, source}`, and computed values add `derived_from` |
| `report.md` | the person's report |
| `roles.json` | what was sent to the scorer, every source set explicitly |
| `role-scores.json` | the scorer's own output, unedited |
| `role-scores.md` | the scorer's own output, unedited |
| `g0-probe/` | the profile pre-check against the real scorer |

## Requirements

- Node 20+.
- Python 3 on PATH as `python3`. On native Windows this needs a `python3.cmd` shim (→ `py -3.11`); it is called through a shell, because Node cannot spawn a `.cmd` without one.
- No new npm dependencies.

## Known limitations

- **Sample mode only.** Liveness values come from the fixture and are labeled your-input; no posting is checked. Live checking is recipe item A4.
- **Company matching** is exact equality of the repo's normalized name. Two spellings of one employer become two companies. Rows that share a normalized name are reported "ambiguous" (missing).
- **Keyword rule** is a substring rule. "Engineering Manager, Networking" matches because "Engineering" contains "engineer" (SKYTAP INC is Likely only through this; an over-match that prediction P1 did not foresee). Network roles sponsored under generic titles do not match.
- **Sponsorship evidence:** no per-title counts and no dates, so there is no Proven tier, and network matches cap at Consider.
- **Possible vs. Likely:** Possible (p 0.5) and Likely (p 0.6) differ by only 0.035 on the composite. A company with no network title can reach Consider too (COMPOUND LABS INC in the sample run).
- **Funding** is context only, from samples. "No record in sample data" is not "not funded".
- **Fit values** in `fixtures/candidates.json` were proposed by the AI and accepted by the person as their your-input (2026-10-03).
- **Run-level failures** (G0, G2a) exit 2. A closed G2 window marks every opening not scored (exit 1).
