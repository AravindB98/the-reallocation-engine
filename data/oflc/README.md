# OFLC Prevailing Wages — Software Developers, Wage Year 2026–27

## Executive summary

**What this is.** A small, checkable copy of the U.S. Department of Labor's official H-1B
prevailing wages for Software Developers, limited to the 20 metro areas one job seeker
targets (40 cities, from the Bay Area and Seattle to Austin, Atlanta and Huntsville).

**Why read it.** An H-1B employer must pay at least the prevailing wage for the job's
location and experience level. A salary that looks generous nationally can still fall
below that floor in a high-wage area. This folder is the evidence any salary comparison
in this repository stands on, so it records exactly where the numbers came from and what
they cannot tell you.

**What it found.** All 40 cities resolve to 20 wage areas, and every area has an official
wage at all four experience levels. The floors differ enormously by place: the entry-level
wage in San Jose ($73.46/hour) is higher than the third-level wage in Huntsville
($61.09/hour). Three cities — Raleigh, Durham and Huntsville — straddle two wage areas, so
a posting there must give its exact office address before any comparison is made.

---

## Files

| File | What | Who produced it | Label |
|---|---|---|---|
| `city-county-targets.csv` | 40 target cities → county or counties | Hand-typed lookup, reviewed by the job seeker | **your-input** |
| `alc-15-1252-wy2026-27.csv` | 20 wage areas × Level 1–4 hourly wages, SOC 15-1252 | `scripts/oflc/extract-prevailing-wages.py` | **verified** (copied verbatim from DOL) |
| `city-area-map-wy2026-27.csv` | Each city's wage area(s); `ok` or `split-needs-worksite` | same script | **verified** county→area, built on the your-input city→county table |
| `oflc-extract-audit.md` | Row counts, SHA-256 of every input and output, splits, wage table | same script | audit (reports, does not say pass) |

## Provenance

| | |
|---|---|
| Publisher | U.S. Department of Labor, Office of Foreign Labor Certification (OFLC) |
| Source page | Foreign Labor Certification Data Center — wage data downloads, `https://flag.dol.gov/wage-data/wage-data-downloads` |
| Download | Folder `OFLC_Wages_2026-27` (files `ALC_Export.csv`, `Geography.csv`, `EDC_Export.csv`, crosswalks, technical release notes) |
| Publisher file dates | 2026-06-15 to 2026-07-01 |
| Wage year | July 1, 2026 – June 30, 2027 |
| Downloaded | 2026-10-21, by hand, by `chethangowda-git` |
| Network | No script fetched anything. The raw download (~50 MB) is **not committed**; only the extract is. |
| Fingerprint | SHA-256 of `ALC_Export.csv` and `Geography.csv` is recorded in `oflc-extract-audit.md`. Re-download and compare to confirm. |

## Regenerate

```bash
python3 -I scripts/oflc/extract-prevailing-wages.py --src ~/Downloads/OFLC_Wages_2026-27
```

Stdlib only — no virtual environment, no network. Exits `2` (writing nothing) if a source
file or column is missing, a county in the city table is not in DOL's geography file, or a
target area has no wage row.

## Assumptions and what this data cannot verify

- **Private employer (ALC table), not ACWIA (EDC table).** Universities, affiliated
  nonprofits and government research organizations use the lower EDC wages. The mode
  assumes a private employer; `EDC_Export.csv` is not extracted.
- **Hourly only.** Converting to annual (×2,080 hours) is a convention applied by the gate
  script, not by this data. `[verify]` against an OFLC source before relying on it.
- **`GeoLvl` meaning is unconfirmed.** It is `1` for all 20 target areas (500 of 530 areas
  nationally for 15-1252). The technical release notes that likely define it were not read.
- **The city → county table is a judgment.** The script verifies each county exists in
  DOL's file; it does not verify that a city lies in that county.
- **Which experience level applies is the employer's call** on the actual filing. This data
  gives all four levels; it cannot tell you which one an employer will file at.
- **The wage year rolls over on July 1, 2027.** An H-1B application filed after that date is
  measured against a newer table this folder does not contain.
- **SOC 15-1252 only.** A role an employer classifies under another code (e.g. 15-1253 QA,
  15-2051 Data Scientists) has a different floor.
