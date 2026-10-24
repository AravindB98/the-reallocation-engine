# IPEDS HD2024 extract — audit

## Executive summary

This audit describes the federal list of U.S. colleges and universities that the triage tool now reads to check whether an employer is a listed institution and whether it is public, nonprofit or for-profit. Every one of the 6,072 institutions in the source file was kept; only columns were dropped. 2,257 are private for-profit, which matters because for-profit colleges do not meet the higher-education definition that cap exemption relies on. This audit reports counts; it does not say pass or fail.

## Run record

- Source: https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip (file `HD2024.csv` inside the zip) · downloaded 2026-10-21
- Raw SHA-256: `d98425c123d7c0e872aec6e83960dfb501884818bf17385c340790f3d1f28345`
- Extract: `extracts/ipeds_hd2024.csv` · columns UNITID, INSTNM, IALIAS, CITY, STABBR, EIN, CONTROL, SECTOR, CYACTIVE, CLOSEDAT

## Counts

| Measure | Count |
|---|---:|
| Rows in source | 6,072 |
| Rows in extract | 6,072 |
| CONTROL 1 public | 1,980 |
| CONTROL 2 private nonprofit | 1,813 |
| CONTROL 3 private for-profit | 2,257 |
| CONTROL other / not reported | 22 |
| Active in current year (CYACTIVE = 1) | 5,994 |
| No usable EIN | 78 |

## What this extract cannot say

- Being listed in IPEDS is not the same as meeting HEA §101(a) (accreditation and other conditions apply). A match is a supporting record, not proof.
- Nothing about affiliated nonprofits or research organizations — only institutions themselves.
