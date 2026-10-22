# USCIS H-1B Employer Data Hub FY2023 — audit

## Executive summary

This audit describes the government's employer-level H-1B petition counts that the triage tool now reads. It is the only public source here that covers universities and research nonprofits, which the engine's startup-funding dataset cannot see. The file has 33,332 employer rows for fiscal year 2023 and was kept whole; 2,042 rows carry the education industry code (61). The data counts petitions; it does not say whether a petition was cap-exempt. This audit reports counts; it does not say pass or fail.

## Run record

- Source: https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2023.csv · downloaded 2026-10-21
- Raw SHA-256: `96f42309393249a7368bd418b2b2c5111b45acc7ccec487a0f024dfa07d71931` (extract is byte-identical to the raw file)
- Extract: `extracts/uscis_h1b_hub_fy2023.csv` · columns Fiscal Year, Employer, Initial Approval, Initial Denial, Continuing Approval, Continuing Denial, NAICS, Tax ID, State, City, ZIP

## Counts

| Measure | Count |
|---|---:|
| Rows in source / extract | 33,332 |
| Rows with blank employer name | 1 |
| Rows with NAICS 61 (educational services) | 2,042 |
| Rows with NAICS 54 (professional, scientific, technical) | 15,400 |
| Rows with NAICS 62 (health care) | 2,773 |
| Sum of initial approvals, NAICS 61 rows | 6,246 |
| Sum of continuing approvals, NAICS 61 rows | 5,368 |

## What this extract cannot say

- Whether any petition was cap-exempt or cap-subject; which occupation it was for; or anything after FY2023.
- NAICS is 2-digit only (61, 54, 62…), so colleges cannot be separated from other education employers, or research labs from consulting firms, by code alone.
- Tax ID is only the last four EIN digits; it narrows a name match but cannot make one.
- One employer can appear under several spellings; the tool matches exact normalized names only.
