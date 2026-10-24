# rithika-sr-ds-newgrad-h1b-15-2051 — prototype

Sponsor triage for a fictional F-1 new-grad Data Scientist (SOC 15-2051).
Recipe: `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`.

## Setup (once, from the repo root)

```bash
npm install
python3 -m venv .venv && source .venv/bin/activate && pip install pyyaml   # needed by npm run verify
npx playwright install chromium                                           # needed by npm run ats:liveness
```

`triage.py` itself uses only the Python standard library.

## Run (one command, from the repo root)

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py --candidates course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/worked-run/out
```

Reads the real `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
and `data/bls/compact/soc_occupation_compact.csv`, runs the existing
`scripts/score/role-scorer.mjs`, and writes `triage-log.json` (agent) and
`triage-report.md` (person) to `--out-dir`. It refuses to write outside
`course/2026fa/submissions/rithika-sr/` or this folder.

## Test (offline, fixtures only)

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051 -p "test_*.py" -v
```

## Files

| File | What |
|---|---|
| `triage.py` | the prototype |
| `test_triage.py` | 17 offline tests |
| `fixtures/persona.example.json` | fictional persona Sasha Jones (your-input) |
| `fixtures/mini_targets.csv` | 5 invented companies in the real CSV's format |
| `fixtures/candidates.test.json` | 9 invented roles, one per gate path |

Exit codes: `0` success; `2` stopped on bad input (message on stderr, no value invented).
