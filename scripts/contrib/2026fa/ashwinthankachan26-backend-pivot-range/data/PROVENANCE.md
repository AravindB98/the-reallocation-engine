# O*NET extract — provenance

## Executive summary

These two small files are the parts of the U.S. Department of Labor's O*NET occupation database that this mode reads: the nine thinking-skill ratings behind each computer occupation's cognitive pivot score, and the list of job titles O*NET files under each occupation. They were cut from the official O*NET 30.2 release, which was first checked byte for byte against the fingerprints the repository already records for the files its own BLS/O*NET table was built from.

## Source

- URL: https://www.onetcenter.org/dl_files/database/db_30_2_text.zip
- Fetched: 2026-10-20T14:52:55Z
- Zip SHA-256: `b5479271931796b838f7173dc0f673a9ec961b7833ac87168fd11e92e7453741`
- Files checked against `data/bls/BLS-audit.md` (all match):
  - `Occupation Data.txt` `63e6029d3d30ff5c7cf39b5304a733b77a409e01c65ae7095fe92f6d18d74a66`
  - `Abilities.txt` `822f866b0f441376edc8a282bf0f77c8c3f687c456dcd607b12de86fccba8e71`
  - `Skills.txt` `d6832c9c195742524a9e48598d962140aaa499c2f78046d4be3af0b69f2686be`
  - `Alternate Titles.txt` `909a8bf1c7c36931398090faeb4fb14ae58e156c960596f6031ee1eabca758f4`
  - `Job Zones.txt` `004acd60c0a96fb69be615f889d02a79036ebd025e5265a36945741b92807989`
- `Sample of Reported Titles.txt` (not pinned in the audit) SHA-256: `e567b5d5b5156b30495dcb775a4dc2c6a5a18edfc631afbd1398ac47e74a049b`

## Outputs

- `onet_elements_15.csv`: 279 rows, 31 occupations with prefix 15-, Level (LV) scale only, SHA-256 `5e2de2643bd8ff4568fd7f0a02adf68e23d1d015d3b50bce2f6be2c8a68c78eb`
- `onet_titles.csv`: 2801 of 70499 (occupation, title, source) rows from Alternate Titles (alternate + short), Sample of Reported Titles, and Occupation Data — every title string that names at least one in-scope occupation, kept with all of its occupations so out-of-scope collisions are still visible. SHA-256 `7487f3ad618cdd4e9429688cbb266d52f4b53137a21cff5e5a03e85efd9af331`
- Regenerate: `python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/ingest_onet.py --download --cache-dir <folder outside the repo>`

## Licence

This extract includes information from the O*NET 30.2 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA. The extract was modified (filtered to the columns and occupations this mode reads); USDOL/ETA has not approved, endorsed, or tested these modifications.
