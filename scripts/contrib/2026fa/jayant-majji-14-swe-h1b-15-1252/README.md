# swe-h1b-15-1252 — prototype

Recipe: `recipes/cases/2026fa/jayant-majji-14-swe-h1b-15-1252.md`

For an F-1 OPT student targeting Software Engineer roles (SOC 15-1252). For each candidate
role it looks up H-1B approval history in the 80 Days to Stay CSV, applies a liveness gate
and a visa-timeline gate, and sends only roles with evidence for every gate to the existing
scorer (`npm run score`). Everything else is routed to a network-target list or held for a human.

## Run (from repo root)

```bash
python3 scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/run.py
```

Defaults: input `sample-input.json` (fictional persona), data
`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, output
`course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/`.

Options: `--input`, `--csv`, `--out-dir`, `--today YYYY-MM-DD`, `--no-score`.

## Test (offline, fixtures only, no network)

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252 -p "test_*.py" -v
```

## Outputs

| File | For | Written by |
|---|---|---|
| `run.json` | agent log: every value with its label, every route and reason | this prototype |
| `report.md` | the person: apply / network / held lists, what was not verified | this prototype |
| `roles.json` | scorer input, shaped like `data/examples/ch11-roles.json` | this prototype |
| `role-scores.json`, `role-scores.md` | decisions and per-term audit | existing scorer |

## Labels

`record` = from repo data · `your-input` = persona value or my rule · `model-judgment` = a guess.
This prototype produces no model-judgment values.

## Stops without inventing a value

| Case | Behavior |
|---|---|
| Company not in CSV / brand name differs from legal name | role held, reason given |
| `Total Approvals` blank | role held; blank is not treated as 0 |
| Two CSV rows normalize to the same name | role held as ambiguous |
| Liveness missing (sponsor evidence exists) | routed to network-target list |
| Liveness not `active`/`expired` | role held |
| Fit missing or unlabeled | role held |
| OPT end date not after today | whole run stops, exit 2, no outputs |
| `--out-dir` inside repo but outside my folders | run stops, exit 2 |

## Limits

No SOC column in the CSV (title substring is a proxy). Exact normalized name matching only.
Liveness is pasted from a manual `npm run ats:liveness` run. Form D samples not used.
Tier thresholds and the timeline rule are unvalidated assumptions [VERIFY].
Never reads `phone`, `executive_officers`, or `board_directors` columns.