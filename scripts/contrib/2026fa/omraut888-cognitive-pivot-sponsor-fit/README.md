---
owner: omraut888
term: 2026fa
component: cognitive-pivot-sponsor-fit
status: RUNNABLE-SAMPLE
promoted_to: null
---

# omraut888-cognitive-pivot-sponsor-fit

## Executive summary

These scripts join visa-sponsorship records to a work-durability score for one
target occupation, then score the result with the engine's existing role
scorer at two weights and write a plain-language report. They never invent a
score: an occupation with no durability score is refused, and every posting is
labelled as unchecked for liveness.

## Files

| File | Role |
|---|---|
| `title-to-soc.py` | v2 phrase matcher: sponsored titles → target SOC (proxy; the CSV has no SOC field) |
| `cognitive-pivot-roles-builder.py` | match file + compact table → `roles.json` for `scripts/score/role-scorer.mjs`; gates G1/G2; explicit liveness/timeline labels |
| `cognitive-pivot-report.py` | two `role-scores.json` → human report + agent log; gate G4 (Apply → "Consider — liveness unchecked") |
| `test_cognitive_pivot_roles_builder.py` | 19 unittest cases: normalization, source labels, explicit gates, stop conditions, downgrade, refusal |

Maintained-file patch (declared): `scripts/score/role-scorer.mjs`, an additive `--role-quality-weight <n>`
flag. When the flag is absent, the output is byte-identical to `HEAD`.

## Run

From the repo root, see `recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md` § Run.

```bash
python3 -m unittest scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/test_cognitive_pivot_roles_builder.py
```

The tests read `data/bls/compact/soc_occupation_compact.csv` relative to the working directory, so run them from the repo root.
