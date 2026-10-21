# Design-title audit — what the sponsorship file says about design-lane jobs

## Executive summary

**What this is.** A count, over the whole visa-sponsorship company file, of how design and front-end job titles appear, plus a check of the government occupation rows this mode reads. **Why read it.** It shows how misleading a simple "design" keyword search is, and how rarely junior design roles appear among sponsored titles. **What it found.** Of the 119 sponsored job titles that contain the word "design", 65 are not software-interface design at all (hardware, mechanical, chip, architecture, graphic, management or unclassifiable titles). 26 employers nationally list a junior-or-mid-level UX/product-design title with at least three approvals; in MA the number is 0. The occupation code most UX jobs belong to has no AI-resilience score in the shipped data.

## Findings

| Measure | Count |
|---|---:|
| Company rows in the file | 30369 |
| …with an H-1B approvals value | 1557 |
| Sponsored titles containing "design" (naive filter) | 119 (at 110 companies) |
| …of which out of a design-engineer lane | 65 |
| &nbsp;&nbsp;"design" titles classified ux-design | 54 |
| &nbsp;&nbsp;"design" titles classified hardware-design | 29 |
| &nbsp;&nbsp;"design" titles classified ambiguous-design | 16 |
| &nbsp;&nbsp;"design" titles classified management | 9 |
| &nbsp;&nbsp;"design" titles classified graphic-brand | 8 |
| &nbsp;&nbsp;"design" titles classified architecture | 2 |
| &nbsp;&nbsp;"design" titles classified industrial-design | 1 |
| Sponsors listing a ux-design title | 52 (at level 31, ≥3 approvals 26; senior-only 21) |
| …in MA: at level with ≥3 approvals | 0 |
| …in MA: at level, thin record (<3) | 1 — RATEGRAVITY INC (2) |
| …in MA: senior-only | 2 — BRIGHTCOVE INC (36); MODO LABS INC (4) |
| Sponsors listing a hybrid-design-engineering title | 3 (at level 1, ≥3 approvals 1; senior-only 2) |
| …in MA: at level with ≥3 approvals | 0 |
| …in MA: at level, thin record (<3) | 0 |
| …in MA: senior-only | 1 — DATABENTO INC (6) |
| Sponsors listing a ui-engineering title | 19 (at level 14, ≥3 approvals 10; senior-only 5) |
| …in MA: at level with ≥3 approvals | 0 |
| …in MA: at level, thin record (<3) | 1 — MYTIDE THERAPEUTICS INC (2) |
| …in MA: senior-only | 0 |
| BLS/O*NET rows with a blank Cognitive Pivot score | 122 of 1016 |

## Occupation rows this mode reads

| O*NET-SOC | Title | National median | Cognitive Pivot |
|---|---|---:|---:|
| 15-1252.00 | Software Developers | $133,080 | 3.834 |
| 15-1254.00 | Web Developers | $90,930 | 3.584 |
| 15-1255.00 | Web and Digital Interface Designers | $98,090 | **blank** |
| 15-1255.01 | Video Game Designers | $98,090 | 3.792 |
| 27-1021.00 | Commercial and Industrial Designers | $79,450 | 3.96 |
| 27-1024.00 | Graphic Designers | $61,300 | 3.264 |

Alternate-title samples shared by 15-1254.00 and 15-1255.00 (the shipped 8-title samples only): Computer Graphic Artist; Computer Graphic Designer; Front End Developer.

## Run record

- Inputs: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 rows), `data/bls/compact/soc_occupation_compact.csv` (1016 rows); state = MA
- Command: `node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/title-audit.mjs --state MA`
- Caveat: Counts are over the truncated top_job_titles_sponsored lists, not over all petitions. Family assignment is by fixed title rules (lib.mjs) and has known misclassifications listed in the recipe.
