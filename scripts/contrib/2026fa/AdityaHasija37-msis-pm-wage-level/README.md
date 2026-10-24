---
owner: AdityaHasija37
term: 2026fa
component: msis-pm-wage-level
status: DRAFT
promoted_to: null
---

# msis-pm-wage-level

## Executive summary

**What this is.** A small, standard-library Python tool. It looks up live product-manager
pay ranges in the Labor Department's official H-1B wage-level tables for San Francisco,
San Jose and Seattle, and reports how many weighted-lottery entries each salary would
earn under each job code an employer might file.

**Why read it.** It explains how to fetch the official data, how to run the tool, and
how to run its tests, all without installing anything.

**What it does not do.** It never estimates a wage level from national data, never
levels a pay range that includes commission, and never prints a chance of selection.

## Files

| File | Purpose |
|---|---|
| `fetch-oflc.sh` | Pinned, checksum-verified download of an OFLC wage year into `raw/` (gitignored) |
| `checksums.lock` | sha256 of each fetched OFLC zip (trust on first use, then verified) |
| `wage_level.py` | `extract` (raw → committed extract) and `run` (scenarios → report + log) |
| `test_wage_level.py` | 38 offline tests (`unittest`; pass on Python 3.13 and 3.12) |
| `xcheck_raw.py` | Independent check: recomputes every row's wages, level, entries and gap from the raw OFLC file without importing the mode (needs `raw/`) |
| `sensitivity_vintage.py` | Re-counts proxy disagreements with national wages scaled up 0–20% (data-age check) |
| `data/oflc-2026-27-pm-extract.csv` | 24 rows: 3 metros × 8 SOC codes, OFLC wage year 2026-27 |
| `data/oflc-2026-27-pm-extract.provenance.json` | origin, zip / source / extract sha256, units, missing pairs |
| `capture-evidence.sh` | Regenerates every capture in the submission's `runs/` (verbatim command, timestamp, output, exit code) |
| `data/policy-sources.json` | Federal Register citations for every policy rule used or listed as not modeled |
| `fixtures/persona.fixture.json` | Persona (no private data) |
| `fixtures/scenarios.2026-10-21.json` | Four posting × worksite scenarios captured 2026-10-21 |
| `fixtures/rule-check.json` | Gate R record |
| `out/` | The committed sample run: `run-log.json` (agent) and `report.md` (person) |

## Commands (from the repo root)

```bash
bash scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/fetch-oflc.sh 2026-27   # only to rebuild the extract
python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py extract
python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py run --run-date 2026-10-21 --replay   # --replay on any day after 2026-10-21
python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/test_wage_level.py
```

`run` and the tests need no network and no fetch. They read the committed extract and
the national OEWS, compact BLS and 80 Days files that ship with the repo. Python 3.10+.

Exit codes: `0` = report and log written; `2` = a run-level gate or input check failed and
nothing was written.

Spec: `recipes/cases/2026fa/AdityaHasija37-msis-pm-wage-level.md`.
