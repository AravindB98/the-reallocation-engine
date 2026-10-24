# DOL OFLC prevailing-wage levels (compact extract)

## Executive summary

**What this is.** The US Department of Labor publishes four official wage levels for every occupation in every metro area. An employer sponsoring an H-1B must pay at least Level I, and since February 2026 the level an offer reaches decides how many times its registration is entered in the H-1B lottery (Level I once, Level IV four times). This folder holds a small slice of that table: every metro and nonmetro area with a county in Massachusetts or New Hampshire, for computer/math (15-) and engineering (17-) occupations.

**Why it is here.** The repository had sponsorship history and national wage data, but not the table the government actually uses to place an H-1B wage. Without it, nobody can say whether a Boston offer of $135,000 is worth one lottery entry or two.

**What it shows.** For software developers in the Boston metro (wage year July 2026 – June 2027), the four lines are $54.94, $66.46, $77.98 and $89.50 an hour: $114,275, $138,237, $162,198 and $186,160 a year at 2,080 hours.

## Provenance

| Field | Value |
|---|---|
| Origin | DOL Office of Foreign Labor Certification, Foreign Labor Application Gateway (FLAG) — `https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2026-27.zip` |
| Wage year | 2026-27 (effective 2026-07-01 to 2027-06-30; based on BLS May 2025 OEWS, per the zip's technical release notes) |
| Fetched | 2026-10-18 by `scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-oflc.sh` |
| zip sha256 | `edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f` (same hash from an independent scratch download the same morning) |
| Source file used | `ALC_Export.csv` (All Industries; **not** the ACWIA higher-education table `EDC_Export.csv`), sha256 `54115f7b…`; `Geography.csv` for area names/states |
| Extract | `compact/alc-2026-27-ma-nh-soc15-17.csv` — 684 of 449,440 rows, 12 areas × 57 SOC codes, made by `extract-oflc.mjs`; `*.provenance.json` beside it records the filter and hashes |
| Values | hourly, copied verbatim; annual figures are computed by the mode (× 2080), never stored |
| Raw files | `raw/` — gitignored (12.6 MB zip, 29 MB CSV); re-create with `fetch-oflc.sh` |

## Columns

`area` (OFLC/OEWS area code) · `area_name` · `soc` (2018 SOC) · `geo_lvl` · `level1_hourly` … `level4_hourly` · `average_hourly` · `label`

## What this table does not say

- `geo_lvl` is not defined in the release notes. Observed here: rows with `geo_lvl` 4 carry identical values in Boston and Worcester (e.g. 17-2021), which is consistent with a national fallback — an inference, not a documented fact. The mode flags any row with `geo_lvl` ≠ 1 for a person to check.
- It is the wage-level table, not an employer's actual filing. What a specific company registered or filed for a specific worker is in DOL's LCA disclosure data, which this repository does not have.
- Cap-exempt employers (universities and affiliated nonprofits) use the ACWIA table and are not in the lottery at all.
