# OFLC Prevailing-Wage Extract Audit

## Executive summary

This is the audit of a small extract of the U.S. Department of Labor's official H-1B prevailing wages for one job code (15-1252) in the places the job seeker targets. Read it to check that the extract matches the government source before any salary is compared against it. It found 41 target cities that resolve to 20 wage areas, every area has a wage row, and 3 cities span more than one wage area, so a posting there needs its exact worksite before any wage can be compared. This audit reports what it found; it does not say pass.

## Run record

- **Generated at:** 2026-10-22T00:50:51.929172+00:00
- **Script:** `scripts/oflc/extract-prevailing-wages.py`
- **Source folder:** `OFLC_Wages_2026-27` (hand-downloaded; not committed)
- **SOC code:** 15-1252 · **Wage year:** 2026-27
- **Wages are hourly**, copied verbatim; no annual conversion is applied here.

## Inputs and outputs

| File | Rows | SHA-256 |
|---|---|---|
| `OFLC_Wages_2026-27/ALC_Export.csv` | 449,440 | `54115f7bf1230b41a609c78d9756d97250f21bb3330ea5645d1c06b38ccd4396` |
| `OFLC_Wages_2026-27/Geography.csv` | 3,275 | `70072d0f1739629ab56bb88fc026b7ec65cf3e0c0899bc478bdf31365c3a3493` |
| `data/oflc/city-county-targets.csv` (your-input) | 41 | `258307b65a585083dfa593a0117645b1f5c1e26c0402b569b31e5e472d94eb41` |
| `data/oflc/alc-15-1252-wy2026-27.csv` | 20 | `6718dbd78136907987cf27a0de38f2a5c74d3520e157f0b16b4160a570fec670` |
| `data/oflc/city-area-map-wy2026-27.csv` | 41 | `63857b7c94f61589bfe5b874a18d1e69315b02949ee05e4a08d74f639ff51258` |
| `data/oflc/county-area-map-wy2026-27.csv` | 44 | `a01258ca0ef5f1cc1c13bcc2a5eb8b9c9cfc41b869e7c3f78faad590d2c1e198` |

## GeoLvl distribution (target areas)

| GeoLvl | Areas |
|---|---|
| 1 | 20 |

## Cities that span more than one wage area

| City | Counties | Areas |
|---|---|---|
| Raleigh, NC | Wake County;Durham County | 20500;39580 |
| Durham, NC | Durham County;Wake County;Orange County | 20500;39580 |
| Huntsville, AL | Madison County;Limestone County;Marshall County | 100002;26620 |

## Target areas

| Area | Name | L1 $/hr | L2 $/hr | L3 $/hr | L4 $/hr |
|---|---|---|---|---|---|
| 100002 | Northeast Alabama nonmetropolitan area | 33.43 | 45.08 | 56.74 | 68.39 |
| 12060 | Atlanta-Sandy Springs-Roswell, GA | 44.19 | 54.70 | 65.22 | 75.73 |
| 12420 | Austin-Round Rock-San Marcos, TX | 46.10 | 57.52 | 68.94 | 80.36 |
| 14460 | Boston-Cambridge-Newton, MA-NH | 54.94 | 66.46 | 77.98 | 89.50 |
| 14500 | Boulder, CO | 54.22 | 67.06 | 79.91 | 92.75 |
| 16980 | Chicago-Naperville-Elgin, IL-IN | 44.61 | 56.29 | 67.98 | 79.66 |
| 19100 | Dallas-Fort Worth-Arlington, TX | 45.77 | 56.20 | 66.63 | 77.06 |
| 19740 | Denver-Aurora-Centennial, CO | 50.30 | 61.01 | 71.72 | 82.43 |
| 20500 | Durham-Chapel Hill, NC | 50.94 | 61.09 | 71.24 | 81.39 |
| 26620 | Huntsville, AL | 39.95 | 50.52 | 61.09 | 71.66 |
| 31080 | Los Angeles-Long Beach-Anaheim, CA | 51.34 | 64.52 | 77.71 | 90.89 |
| 33100 | Miami-Fort Lauderdale-West Palm Beach, FL | 42.68 | 56.06 | 69.45 | 82.83 |
| 35620 | New York-Newark-Jersey City, NY-NJ | 52.81 | 66.21 | 79.61 | 93.01 |
| 38060 | Phoenix-Mesa-Chandler, AZ | 44.29 | 54.67 | 65.05 | 75.43 |
| 39580 | Raleigh-Cary, NC | 42.98 | 54.28 | 65.58 | 76.88 |
| 41740 | San Diego-Chula Vista-Carlsbad, CA | 50.80 | 64.59 | 78.37 | 92.16 |
| 41860 | San Francisco-Oakland-Fremont, CA | 65.91 | 79.39 | 92.86 | 106.34 |
| 41940 | San Jose-Sunnyvale-Santa Clara, CA | 73.46 | 89.94 | 106.43 | 122.91 |
| 42660 | Seattle-Tacoma-Bellevue, WA | 53.66 | 68.80 | 83.94 | 99.08 |
| 47900 | Washington-Arlington-Alexandria, DC-VA-MD-WV | 49.08 | 61.28 | 73.48 | 85.68 |
