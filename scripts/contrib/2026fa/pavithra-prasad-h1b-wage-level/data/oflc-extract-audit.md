# OFLC extract audit: SOC 15-1252 wage levels, 2026-27

## Executive summary

**What this is.** A check of the small wage table this mode uses, taken from the Department of Labor's 2026-27 prevailing wage data.

**Why read it.** Every wage level the mode reports comes from this table, so if the table is wrong, every answer is wrong.

**What it found.** The files match their recorded fingerprints, every row passes the Level II and III arithmetic check, every city in the city table maps to a county that the Labor Department places in one of the five areas, and all five areas have wages estimated for the area itself. The table below shows how far the thresholds differ between cities.

## Thresholds, annual (hourly x 2080)

| Area | Geo level | Level I | Level II | Level III | Level IV |
|---|---|---|---|---|---|
| 14460 Boston-Cambridge-Newton, MA-NH | 1 | $114,275 | $138,237 | $162,198 | $186,160 |
| 35620 New York-Newark-Jersey City, NY-NJ | 1 | $109,845 | $137,717 | $165,589 | $193,461 |
| 41860 San Francisco-Oakland-Fremont, CA | 1 | $137,093 | $165,131 | $193,149 | $221,187 |
| 41940 San Jose-Sunnyvale-Santa Clara, CA | 1 | $152,797 | $187,075 | $221,374 | $255,653 |
| 42660 Seattle-Tacoma-Bellevue, WA | 1 | $111,613 | $143,104 | $174,595 | $206,086 |

## The same base pay in each area

| Base pay | Boston-Cambridge-Newton | New York-Newark-Jersey City | San Francisco-Oakland-Fremont | San Jose-Sunnyvale-Santa Clara | Seattle-Tacoma-Bellevue |
|---|---|---|---|---|---|
| $110,000 | below Level I | Level I | below Level I | below Level I | below Level I |
| $120,000 | Level I | Level I | below Level I | below Level I | Level I |
| $130,000 | Level I | Level I | below Level I | below Level I | Level I |
| $140,000 | Level II | Level II | Level I | below Level I | Level I |
| $150,000 | Level II | Level II | Level I | below Level I | Level II |
| $160,000 | Level II | Level II | Level I | Level I | Level II |
| $175,000 | Level III | Level III | Level II | Level I | Level III |

## Records in, records out

- Source: https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2026-27.zip
- Source zip SHA-256: `edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f`
- ALC_Export.csv: 449440 rows in, 10 kept (SOC 15-1252 and 15-1253 in areas 14460, 35620, 41860, 41940, 42660)
- Geography.csv: 3275 rows in, 39 kept
- City table: 47 cities, all mapped (a city whose county is not in the extract halts the run)
- Wage year: 2026-07-01 to 2027-06-30

## How the employer's SOC choice moves the level (illustration)

The same pay against SOC 15-1253 (Software Quality Assurance Analysts and Testers) instead of 15-1252:

| Area | 15-1252 Level I | 15-1253 Level I |
|---|---|---|
| Boston-Cambridge-Newton | $114,275 | $72,280 |
| New York-Newark-Jersey City | $109,845 | $84,323 |
| San Francisco-Oakland-Fremont | $137,093 | $80,579 |
| San Jose-Sunnyvale-Santa Clara | $152,797 | $98,322 |
| Seattle-Tacoma-Bellevue | $111,613 | $81,598 |
