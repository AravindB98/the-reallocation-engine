# 80 Days coverage audit — cap-exempt employers

## Executive summary

This report checks whether the engine's main company dataset can see the employers that sponsor work visas without the H-1B lottery: universities, their affiliated nonprofits, and nonprofit research institutes. Read it before trusting any sponsorship number for those employers. It found that the dataset holds 30,369 companies, of which 31 have names that sound like a university, hospital or foundation — and 0 of those have any visa approvals on record. 26 of the 31 record a private funding round and 13 carry a for-profit legal form (LLC, LP and similar): a name that sounds like a university or hospital is not evidence of one. A blank approval count means *unknown*, not zero (28,812 of 30,369 rows are blank, so a zero among the 31 says little on its own). The stronger measure: of 3,771 open public and nonprofit institutions in the federal college list (IPEDS), 0 appear in this dataset by exact name, and 0 of the 31 university-sounding names is a listed institution. This audit reports counts; it does not say pass or fail.

## Run record

- Source: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- SHA-256: `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`
- IPEDS extract for the overlap measure: `scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/data/extracts/ipeds_hd2024.csv`
- Name pattern: university | college | institute of technology | school of medicine | research institute/foundation/center | medical center | hospital | foundation

## Counts (script-output from records)

| Measure | Count |
|---|---:|
| Rows in dataset | 30,369 |
| Rows with H-1B approvals > 0 | 1,552 |
| Rows with approvals blank (unknown) | 28,812 |
| Distinct industry labels | 24 |
| Industry labels that mention education / research / nonprofit | 0 |
| Names that sound cap-exempt | 31 |
| … of which approvals > 0 | 0 |
| … of which approvals blank (unknown) | 31 |
| … of which for-profit legal form (LLC/LP/LLP/PBC/L3C) | 13 |
| … of which Inc./Corp. (ambiguous — nonprofits incorporate too) | 11 |
| … of which a Form D funding stage is recorded | 26 |
| … of which match an IPEDS institution exactly | 0 |
| Open public + nonprofit IPEDS institutions | 3,771 |
| … of which appear in this dataset (exact name) | 0 |

## Every name that sounds cap-exempt

| Company (as filed) | Industry | Funding stage | H-1B approvals | Legal form |
|---|---|---|---:|---|
| BRUSH COLLEGE FINANCIAL LLC | Other | Pre-Seed | blank | for-profit-form |
| CHAPMAN UNIVERSITY ENTERPRISES INC | Other | blank | blank | corporate-ambiguous |
| CLEAR CHOICE HOSPITAL LLC | Hospitals and Physicians | Pre-Seed | blank | for-profit-form |
| COHORT 1 A SERIES OF VENTURE UNIVERSITY MASTER LLC | Other | Pre-Seed | blank | for-profit-form |
| COLLEGE CONSORTIUM INC | Other Technology | Pre-Seed | blank | corporate-ambiguous |
| COLLEGE CONTACT INC | Other | Pre-Seed | blank | corporate-ambiguous |
| COLLEGE ENGINE INC | Other Technology | Pre-Seed | blank | corporate-ambiguous |
| COLLEGE GUIDANCE NETWORK INC | Other | Pre-Seed | blank | corporate-ambiguous |
| COLLEGE STATION ER LLC | Hospitals and Physicians | blank | blank | for-profit-form |
| DEMOCRACY EARTH FOUNDATION | Computers | Pre-Seed | blank | no-suffix |
| DIGITAL HOSPITAL INC | Biotechnology | Pre-Seed | blank | corporate-ambiguous |
| EAST EL PASO PHYSICIANS MEDICAL CENTER LLC | Hospitals and Physicians | Seed | blank | for-profit-form |
| FOREST PARK MEDICAL CENTER AT LITTLE ROCK LLC | Hospitals and Physicians | blank | blank | for-profit-form |
| FOUNDATION ALLOY TECHNOLOGY EXPLORATIONS INC | Other Technology | Series B | blank | corporate-ambiguous |
| FOUNDATION DEVICES INC | Other Technology | Seed | blank | corporate-ambiguous |
| FOUNDATION FOR THE STUDY OF CYCLES L3C | Other Technology | Pre-Seed | blank | for-profit-form |
| FOUNDATION LABS INC | Other Technology | Series A | blank | corporate-ambiguous |
| FOUNDATION LLM TECHNOLOGIES INC | Other | Series B | blank | corporate-ambiguous |
| FRISCO MEDICAL CENTER LLP | Hospitals and Physicians | Seed | blank | for-profit-form |
| HEDGEHOG SONIC FOUNDATION | Other Technology | Seed | blank | no-suffix |
| HOSPITAL IQ INC | Other Technology | Series B | blank | corporate-ambiguous |
| SOFIA UNIVERSITY FPC | Other | blank | blank | no-suffix |
| SPLYT CORE FOUNDATION | Other Technology | Pre-Seed | blank | no-suffix |
| TANDEM HOSPITAL PARTNERS LLC | Hospitals and Physicians | Seed | blank | for-profit-form |
| TB COLLEGE STATION PARTNERS LLC | Other Banking and Financial Services | Pre-Seed | blank | for-profit-form |
| UBIQUITY UNIVERSITY | Other | Pre-Seed | blank | no-suffix |
| UNIVERSITY OF ILLINOIS COMMUNITY CREDIT UNION | Other Banking and Financial Services | Series A | blank | no-suffix |
| UNIVERSITY PLACE SPECIAL CARE COMMUNITY LLC | Other Health Care | Pre-Seed | blank | for-profit-form |
| VALOR FOUNDATION | Other Technology | blank | blank | no-suffix |
| VICTORY MEDICAL CENTER CRAIG RANCH LP | Hospitals and Physicians | Pre-Seed | blank | for-profit-form |
| VICTORY SURGICAL HOSPITAL EAST HOUSTON LP | Hospitals and Physicians | Pre-Seed | blank | for-profit-form |

## What this audit cannot say

- Whether any employer is cap-exempt. No file in the repository records that.
- Whether real universities are absent because of how the dataset was built (Form D filers only) or because of name matching. The pattern finds names, not institutions.
