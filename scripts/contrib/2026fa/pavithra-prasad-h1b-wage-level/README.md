---
owner: Pavithra-Prasad
term: 2026fa
component: h1b-wage-level-odds
status: RUNNABLE-LIVE
promoted_to: null
---

# H-1B wage-level odds for new-grad software engineers

## Executive summary

**What this is.** A small program for an international student who will graduate, work on OPT, and need an H-1B. For each software engineer job posting it works out which H-1B wage level the posted pay would reach in each listed city, and so how many times the registration would be entered in the H-1B lottery: once at Level I, twice at Level II, three times at Level III, four times at Level IV. It also says how much more base pay would reach the next level.

**Why read it.** Since February 2026 the H-1B lottery has been weighted by wage level, and the level depends on the city as well as the salary. The same offer can carry twice the entries in one city as in another, and a posting's pay range does not show this. The program also refuses to answer when the city, the pay range or the data cannot support an answer, and says why.

**What it found.** On 13 live postings fetched on 19 October 2026, 9 gave a checked level, 1 was held by a person at the job-code gate, and 3 were refused (no pay range, two ranges with no city attached, a "Bay Area" location). The same $166,000 base is Level III in New York but Level II in Bellevue and Menlo Park, and the published minimum of a real 2027 new-grad posting is below the San Francisco Level I wage.

---

## Run it

From the **repo root**:

```bash
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/test_wage_level.py
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --sample
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --audit
```

`--sample` uses constructed postings in `fixtures/` and needs no network; it writes `out/sample/` (gitignored). A live run is two steps: fetch, then check.

```bash
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fetch_postings.py --discover pinterest stripe
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fetch_postings.py --out <postings.json> --jobs "pinterest:7838591:Pinterest"
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --persona <persona.json> --postings <postings.json> --gate-log <gates.json> --out-dir <dir>
```

Outputs go only inside this folder or `assignments/submissions/pavithra-prasad/`; anywhere else halts.

| File | Reader | What |
|---|---|---|
| `report.md` | the person | levels by posting and city, refusals, next steps, what was not verified, gate status |
| `run-log.json` | the agent | every value with its label (record, computed, your-input, model-judgment), gates, stops |

## Files

| File | What |
|---|---|
| `wage_level.py` | the mode: gates, worksite to OFLC area, pay range to wage level, refusals, report and log |
| `fetch_postings.py` | the ingest step: the only script here that reads postings from the network |
| `build_extract.py` | rebuilds `data/` from DOL's `OFLC_Wages_2026-27.zip` and refuses any other file |
| `test_wage_level.py` | 37 offline tests |
| `data/oflc-alc-2026-27-extract.csv` | OFLC 2026-27 wage levels (hourly) for SOC 15-1252 and 15-1253 in five metro areas |
| `data/oflc-geography-extract.csv` | the counties OFLC places in those five areas |
| `data/worksites.csv` | 47 cities and their counties, each checked against the geography file at load |
| `data/extract-manifest.json` | SHA-256 of the source zip, its members and the extract files |
| `data/oflc-extract-audit.md` | the audit of the extract: counts, checks, thresholds by city |
| `fixtures/` | a fictional persona and constructed sample postings, liveness answers and gate decisions |

## Data provenance

- Source: U.S. Department of Labor, Office of Foreign Labor Certification, `https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2026-27.zip`, posted 1 July 2026, downloaded 19 October 2026, SHA-256 `edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f`. The zip is not committed.
- Rule: *Weighted Selection Process for Registrants and Petitioners Seeking To File Cap-Subject H-1B Petitions*, 90 FR 60864, 29 December 2025, effective 27 February 2026.
- Sponsorship context: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (repo data).
- Liveness: `scripts/ats/check-liveness.mjs` (repo script).

## Credit

The company-name match, the liveness handling and the labelled-value format are adapted from my Recipe Design prototype, `scripts/contrib/2026fa/pavithra-prasad-newgrad-swe-sponsor-check` (PR #33). Written with help from Claude Code; see the submission's SOURCES.
