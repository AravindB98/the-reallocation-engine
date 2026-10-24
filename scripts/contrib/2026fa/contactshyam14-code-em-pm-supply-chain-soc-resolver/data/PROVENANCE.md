# Trimmed wage data — provenance

## Executive summary

These four small CSV files are cut down from two public government downloads (the U.S. Bureau of Labor Statistics' May 2024 metro wage survey and the Bureau of Economic Analysis' 2024 regional price levels) plus the national wage file already in the repository. They hold only the rows this mode needs: the occupation codes a project-management or supply-chain posting might be filed under, in the five target cities, plus one small New York metro the existing wage recipe uses as its suppression check. Nothing was filled in, averaged or estimated. Blanks and the government's own "not available" and "top-coded" markers are copied exactly as they appear.

## Sources

| File here | Trimmed from | Source URL | Fetched (UTC) | Raw size | Raw SHA-256 |
|---|---|---|---|---|---|
| `metro_oews.csv` | `oesm24ma/MSA_M2024_dl.xlsx` inside `oesm24ma.zip` | https://www.bls.gov/oes/special-requests/oesm24ma.zip | 2026-10-21T19:44:27Z | 40,189,821 bytes (zip) | `7bf915fc47e464983c5b8b8200d63a733ef90275c7af0576b78875e5b04d35d9` |
| `bea_rpp.csv` | `MARPP_MSA_2008_2024.csv` inside `MARPP.zip` (LineCode 1 "RPPs: All items", column 2024) | https://apps.bea.gov/regional/zip/MARPP.zip | 2026-10-21T19:44:41Z | 146,479 bytes (zip) | `5dbf2e6ac2af222cc9abc205586c9b480344d89392752eb689c3ec823a34c83e` |
| `bls_bea_msa_crosswalk.csv` | built from the two files above: exact code equality `AREA == GeoFIPS`, no name matching | — | — | — | — |
| `national_oews_candidates.csv` | `data/bls/oesm24nat/national_M2024_dl.xlsx` (already tracked in the repo, commit `d08afdd`) | — | — | 291,056 bytes | `a9bad3093703e28d7490cedb765b6730f4eaa4b37a7c8f68e866814167761f11` |

The raw zips are kept locally in `data/bls/local-wage/raw/` (excluded from git with `.git/info/exclude`, not `.gitignore`, so no maintained file changed). BEA's file says "Last updated: February 19, 2026-- new statistics for 2024".

## Command (verbatim)

```bash
.venv/Scripts/python.exe -I scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/tools/trim_local_wage.py --msa-zip data/bls/local-wage/raw/oesm24ma/oesm24ma.zip --rpp-zip data/bls/local-wage/raw/marpp/MARPP.zip --national-xlsx data/bls/oesm24nat/national_M2024_dl.xlsx --areas 42660,12420,41860,41940,19100,24020 --socs 13-1082,13-1081,11-3071,11-3061,13-1023,13-1020,15-1299,11-3021,11-1021,13-1111,43-5061,15-1252 --out-dir scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/data
```

Result: `metro_oews` 62 rows, `national_oews_candidates` 12 rows, `bea_rpp` 6 rows, `crosswalk` 6 rows. All 6 requested areas were found in both BLS and BEA.

| Trimmed file | Bytes | SHA-256 |
|---|---|---|
| `metro_oews.csv` | 8,479 | `96131cdba2625d9ba4eeb747f2f301ebc3b3e95a106613cd23a71687bbe1ff05` |
| `national_oews_candidates.csv` | 1,214 | `bcd2e1f412a40b79c2f8d173b09257fc186264ddcc8d099b338268cb17359876` |
| `bea_rpp.csv` | 506 | `dad02195a28e979e36421b67d56e13e3ce27899d82e2846f70e8af664bb6c167` |
| `bls_bea_msa_crosswalk.csv` | 293 | `51db1b7baff75ff8b58b56294e16f6a4b549d92aa7a070694688e3aac5e5693f` |

Areas: 42660 Seattle-Tacoma-Bellevue, WA · 12420 Austin-Round Rock-San Marcos, TX · 41860 San Francisco-Oakland-Fremont, CA · 41940 San Jose-Sunnyvale-Santa Clara, CA · 19100 Dallas-Fort Worth-Arlington, TX · 24020 Glens Falls, NY (the local-wage recipe's own suppression fixture: 15-1252 there is `*`).

## What the data says that matters (record)

- **13-1023 Purchasing Agents has no row** in either the national or the metro May 2024 file. OEWS publishes the broad code **13-1020 Buyers and Purchasing Agents** (it appears twice, as `broad` and as `detailed`, which the field description says means OEWS aggregated it). 13-1020 is kept here for context only and is never substituted for 13-1023.
- OEWS markers, quoted from the field-description rows of `national_M2024_dl.xlsx`: `*` "indicates that a wage estimate is not available"; `**` "indicates that an employment estimate is not available"; `#` "indicates a wage equal to or greater than $115.00 per hour or $239,200 per year".
- In the five target metros, `#` appears in upper percentiles (for example 11-3021 San Jose `A_MEDIAN = #`). The existing `scripts/bls/local-wage-adjustment.py` reports a `#` median as `missing: suppressed-small-sample`, which mislabels a top-coded value as a small-sample suppression. The resolver keeps it missing (correct: no number to use) and notes the mislabel; the script was not modified.
- Glens Falls, NY has no detailed rows for 13-1081, 11-3071, 11-3061 or 15-1299 (absent rows, not suppressed).

## Contract with `scripts/bls/local-wage-adjustment.py`

Columns match what the script reads (`AREA`, `AREA_TITLE`, `OCC_CODE`, `O_GROUP`, `A_MEAN`, `A_MEDIAN`, `A_PCT25`, `A_PCT75` · `GeoFIPS`, `rpp_all_items_2024` · `AREA`, `GeoFIPS`). The script is run unmodified with `--oews`, `--rpp`, `--crosswalk` pointing here and `--national data/bls/compact/soc_occupation_compact.csv`.
