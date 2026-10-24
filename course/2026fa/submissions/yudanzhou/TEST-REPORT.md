# TEST-REPORT: is-funded-sponsor-triage

## Executive summary

I checked out my branch fresh (a new clone with no leftover files) and ran the toolchain checks, the prototype, its tests, and conformance. Everything passed: the prototype ran with one command, all 11 offline tests passed, conformance passed, and the branch only touches my own namespaced folders. The full, unedited terminal output is in `runs/02-clean-checkout-output.txt` (commit `a12541a`, the final code; only this report and that output file were committed after it). An earlier clean run, before the persona moved to `search/examples/`, is kept in `runs/01-clean-checkout-output.txt`. The one thing a human still has to judge is listed at the end.

## Environment

- Windows 11, Node v24.11.1, Python 3.14.2 (`python3`), git 2.51.2.
- Fresh clone of branch `contrib/2026fa-yudanzhou-is-funded-sponsor-triage` at commit `a12541a`, with `core.autocrlf=false` (see FRICTIONAL #5: with CRLF line endings, `npm run verify` fails and `npm run doctor` reports 0/33 recipes with frontmatter).
- `pyyaml` installed for `python3` (needed by `npm run verify`'s manifest check, not by my prototype).

## Results

| Check | Command | Result |
|---|---|---|
| Toolchain before | `npm run doctor` | `environment: ✓ runnable` · `recipes: 33/33 carry lifecycle frontmatter` |
| Conformance before | `npm run verify` | `✓ manifest check passed (3 warnings)`, all upstream warnings |
| Prototype sample run | `python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py --today 2026-10-02 --out-dir <temp>/out` | `9 postings → 5 scored · 4 held out (timeline gate 1.0)`; scorer `Apply 4 · Consider 0 · Skip 1`; exit 0 |
| Offline tests | `python3 -m unittest discover -s scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage -p "test_*.py" -v` | `Ran 11 tests … OK` |
| Conformance (mine) | `node scripts/conformance.mjs` on all five of my paths | `✓ all conform` |
| Toolchain after | `npm run doctor` / `npm run verify` | unchanged from before |
| PII (my branch) | `node scripts/pii-scan.mjs --diff 015843d` | `pii-scan: clean ✓` |
| PII (whole tree) | `node scripts/pii-scan.mjs` | 1 finding, `[email] package-lock.json`. It is in an **upstream** file I did not change (an npm package author's address). Nothing in my paths. |

## Failure cases exercised (each is a test)

| Predicted failure (CHANGE-BRIEF) | Test | Observed |
|---|---|---|
| §5.1 company missing from the CSV | `test_missing_company_is_held_out` | status `no-company-row`, not scored |
| §5.2 blank `Total Approvals` | `test_blank_approvals_is_held_out_not_zero` | status `no-h1b-record`, **no p = 0 invented** |
| §5.3 OPT window already closed | `test_closed_opt_window_zeroes_timeline` | timeline factor 0.0 |
| §5.4 name join ambiguity | `test_ambiguous_name_is_held_out`, `test_exact_name_resolves_twin` | ambiguous → held out; exact name wins |
| §6 Data Engineer ≠ Data Analyst | `test_data_engineer_is_not_data_analyst` | `[]` for "Data Engineer" |
| G1 missing columns | `test_missing_column_stops` | exit 2, `✗ STOP: G1 data gate …`, no `roles.json` written |
| G2 liveness | `test_liveness_gate` | unchecked held out; expired scored with factor 0 |
| Labels on every term | `test_every_scored_value_is_labeled` | all in {record, your-input, model-judgment} |
| Existing scorer, not a copy | `test_end_to_end_with_existing_scorer` | calls `scripts/score/role-scorer.mjs`; dead posting → Skip |

## `git diff --stat` (branch vs. upstream base `015843d`)

All 26 files (at `a12541a`) are under `course/2026fa/submissions/yudanzhou/`, `recipes/cases/2026fa/yudanzhou-*`, `scripts/contrib/2026fa/yudanzhou-*`, `logs/runs/2026fa-yudanzhou-1.md`, or `search/examples/is-ms-2027-funded-undecided/` (the fictional persona, where DATA_CONTRACT requires personas to live). No shared file is touched, including `logs/RUN_LOG.md` and `package-lock.json`. Full listing in `runs/02-clean-checkout-output.txt`.

## What the gate requires a human to judge

- **G2:** whether each real posting is live. The sample run's liveness values are invented demo inputs.
- **G3:** whether the persona's OPT start, days used, and 60-day hiring lag match the student's real situation.
- **G4:** whether an Apply is actually worth two hours. Example: DELOITTE CONSULTING LLP scores Apply, but it is a large consultancy whose "Series C" funding label is probably a Form D artifact, not a startup round.
