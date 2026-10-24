---
owner: varnikamujumdar
term: 2026fa
component: cap-exempt-triage
status: DRAFT
promoted_to: null
---

# cap-exempt-triage

## Executive summary

This is a small command-line tool for a graduate on OPT who was not picked in the H-1B lottery and wants employers that can sponsor without it: universities, their affiliated nonprofits, and nonprofit research institutes.
- It checks the person's visa clock and whether each posting is still open.
- It shows the evidence for and against each employer's claim.
- It never declares an employer cap-exempt, because no data in this repository can establish that.

Read this file to run it and its tests. The recipe and human card in `recipes/cases/2026fa/` explain the reasoning.

## Files

| File | What it is |
|---|---|
| `cap_exempt_triage.py` | `audit` (dataset coverage) and `triage` (gates, federal-record lookups, evidence) subcommands. Python 3.9+, stdlib + PyYAML |
| `ingest.py` | **the only network code here**: downloads IPEDS HD2024 and the USCIS H-1B Employer Data Hub FY2023, writes `data/extracts/`, audits and `data/PROVENANCE.md` |
| `data/extracts/ipeds_hd2024.csv`, `uscis_h1b_hub_fy2023.csv` | committed extracts (IPEDS: all 6,072 rows, 10 columns; USCIS: unfiltered) |
| `data/extracts/*-audit.md`, `data/PROVENANCE.md` | rows in/out, counts, URLs, download date, SHA-256 |
| `data/raw/` | raw downloads; ignored by this folder's `.gitignore` |
| `test_cap_exempt_triage.py` | 47 offline tests, network-free (fixture extracts `mini_ipeds.csv`, `mini_uscis.csv`); pass on Python 3.9.6 and 3.12.14 |
| `fixtures/priya-lottery-ext.json` | **fictional** extension of `search/examples/priya-nair/profile.yml`: lottery not selected, employed on OPT, timeline assumptions |
| `fixtures/targets.sample.json`, `mini_80days.csv`, `liveness.sample.txt`, `liveness.recheck.txt` | invented test inputs (example.org URLs, "Example *" employers, plus 3 real public 80 Days rows) |
| `fixtures/breaks/*` | break inputs: slow hiring, unemployed, lottery selected, text assumption, bad CSV header |
| `checks/recount.py`, `checks/b4_regression.py`, `checks/fh_probe.mjs` | independent re-checks used in the worked run (§8, §11); run from the repository root |
| `fixtures/BROKEN-liveness-default-active.py` | mutant reproducing the "unchecked liveness = open" defect; the suite must catch it |

## Run

```bash
# tests (from the repository root)
python3 -m unittest discover -s scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage -v

# coverage audit on the real 80 Days dataset
python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py audit --json

# the 2026-10-21 worked run, regenerated from committed inputs
bash course/2026fa/submissions/varnikamujumdar/mode-cap-exempt/runs/2026-10-21/reproduce.sh
```

To rebuild the extracts (network):

```bash
python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/ingest.py all
```

## Reuse, not re-implementation

- Employer-name matching imports `normalize_company_name` from `scripts/sec/entity-resolution.py`.
- Liveness is never computed here. The tool reads the saved output of `npm run ats:liveness` (`scripts/ats/check-liveness.mjs`). Repeat `--liveness` to supply re-checks; a later file supersedes an earlier one for the same URL.
- One local interpretation: an `expired` whose reason is the checker's page-length rule ("insufficient content") is treated as **uncertain → HELD**, not SKIP. Iframe-based boards (iCIMS) trip that rule on live postings; see the worked run.
