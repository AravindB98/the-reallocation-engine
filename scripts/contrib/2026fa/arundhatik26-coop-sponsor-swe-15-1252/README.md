# arundhatik26 — co-op sponsor check for software roles

## Executive summary

This is a small working prototype. For each co-op role a student is considering, it checks whether the employer has a recorded history of sponsoring software jobs. It also checks whether the posting is live and whether the co-op fits before graduation, then hands the result to the existing role scorer. It runs on a fictional persona and on the data that ships with the repository. Where there is no record, it says "unknown" instead of guessing.

## Run it (from the repo root)

```bash
python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py
```

It needs Python 3 (standard library only) and Node 20+ for the scorer. It makes no network calls. Output goes to `course/2026fa/submissions/arundhatik26/runs/sample/`:

| File | Reader |
|---|---|
| `report.md` | the person |
| `run-log.json` | the agent; every value labeled `record` / `your-input`, with its CSV line |
| `grad-dec-2027/`, `grad-apr-2028/` → `roles.json`, `role-scores.json`, `role-scores.md` | the scorer's input and its audit, one per graduation scenario |

Options: `--input <persona.json>` and `--out-dir <dir>`.

## Test (offline, from fixtures)

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests -v
```

17 tests. They cover the six named failure cases (F1–F6 in the change brief), the "MELLON"-style substring trap, unknown SOC, bad input, and a full pipeline run through the **real** `scripts/score/role-scorer.mjs`. Python socket connects are blocked during the run.

## Files

| Path | What |
|---|---|
| `coop_sponsor_check.py` | the prototype |
| `inputs/sample-persona.json` | fictional persona (Ananya Rao, `@example.com`); every value is `your-input` |
| `inputs/liveness-2026-10-02.txt` | real `npm run ats:liveness` output for the two URLs in the sample, captured 2026-10-02 |
| `tests/test_coop_sponsor_check.py` | offline tests |
| `tests/fixtures/` | made-up CSV / BLS / liveness / persona fixtures, one row per failure case |

## Data it reads

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- `data/bls/compact/soc_occupation_compact.csv`
- the liveness record named in the input file

Recipe: `recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.md` (agent) and `.card.md` (human).
