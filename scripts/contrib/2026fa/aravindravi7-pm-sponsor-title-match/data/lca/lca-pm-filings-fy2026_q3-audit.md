# LCA PM-family filings extract — audit (LCA_Disclosure_Data_FY2026_Q3.xlsx)

## Executive summary

This audit describes one public Department of Labor file of labor condition applications (the filing an employer makes before an H-1B petition) and the small extract taken from it. Of 437,496 applications in the file, 10,936 are H-1B applications for product- or program-manager-type titles and were kept, without any contact details. A certified application is **not** a visa approval, so this extract shows which employers *filed* for these titles, not who was hired.

## Provenance

- Source page: https://www.dol.gov/agencies/eta/foreign-labor/performance
- File: `LCA_Disclosure_Data_FY2026_Q3.xlsx` · 251,850,891 bytes · sha256 `f8ca8448a528671f784d3692923775a13741c99caec2816b2fe30c8885bd28b3` (verified against pin)
- Downloaded by: Aravind Ravi on 2026-10-21 (browser; dol.gov refuses scripted downloads)
- Ingested: 2026-10-21T15:20:19Z by `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/ingest_lca.py`
- Extract: `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/data/lca/lca-pm-filings-fy2026_q3.csv` · 2,686,443 bytes
- FEIN check on the 210 multi-suffix employers: 131 share one EMPLOYER_FEIN (resolved as one employer by record) · 79 have different FEINs · 0 lack a FEIN for some suffix form (these still HOLD)
- Employer index: `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/data/lca/lca-employer-index-fy2026_q3.csv` · 2,721,469 bytes · 53,193 H-1B employers (normalized), 2,736 with PM-family rows, 210 filed under more than one legal suffix (these HOLD in triage)
- Re-pinned with --repin-extract (EMPLOYER_FEIN column added to the extract and index at the student's request (2026-10-21), so legal-suffix name variants can be resolved by record): superseded `lca-pm-filings-fy2026_q3.csv` sha256 `0dce577bc57dca3740e31c33ce794e6cdfc919e9f581fb9c0fc6358becf747d7`, `lca-employer-index-fy2026_q3.csv` sha256 `047c8dd7e47f8ecafd114950ace6a2f59a9e60c141a708c38d3d935c503e7685`

## Counts

| Measure | Count |
|---|---|
| Filing rows in the file | 437,496 |
| Empty spreadsheet rows (skipped; not filings) | 595,239 |
| Rows kept (H-1B, PM-family prefilter) | 10,936 |
| Rejected: not-h1b | 10,544 |
| Rejected: not-pm-family-title | 416,016 |

Recovered by the Mgr/Mgmt abbreviation fix (kept now, missed by the first-run prefilter): **409** rows.

### Shortlist employers: PM rows only under abbreviated titles?

Prefilter-level counts (the triage classifier decides product vs program). "Only abbreviated" means the employer would have looked like a confirmed absence before the fix.

| Employer (watched as) | Kept rows | Of which only Mgr/Mgmt forms | PM rows only under abbreviated titles? | Names as filed |
|---|---|---|---|---|
| Stripe | 19 | 0 | no | Stripe, Inc.; Stripe, LLC |
| Datadog | 7 | 0 | no | Datadog, Inc. |
| MongoDB | 7 | 0 | no | MONGODB, INC. |
| Databricks | 13 | 0 | no | Databricks, Inc. |
| Robinhood | 0 | 0 | no kept rows (exact-name match) | — |
| Robinhood Markets | 15 | 0 | no | ROBINHOOD MARKETS, INC; Robinhood Markets, Inc. |
| Figma | 2 | 0 | no | Figma, Inc. |
| Reddit | 3 | 0 | no | Reddit, Inc. |
| Asana | 2 | 0 | no | Asana, Inc. |
| Anthropic | 0 | 0 | no kept rows (exact-name match) | — |
| Ramp | 0 | 0 | no kept rows (exact-name match) | — |
| Ramp Business | 1 | 0 | no | Ramp Business Corporation |
| Notion | 0 | 0 | no kept rows (exact-name match) | — |
| Notion Labs | 0 | 0 | no kept rows (exact-name match) | — |

### Visa class (all rows)

| Visa class | Rows |
|---|---|
| H-1B | 426,952 |
| E-3 Australian | 7,671 |
| H-1B1 Chile | 1,654 |
| H-1B1 Singapore | 1,219 |

### Case status — every observed string (all rows, exactly as written in the file)

Compared with whitespace around the hyphen ignored against "Certified", "Certified - Withdrawn", "Withdrawn", "Denied".

| Status string as filed | Rows | Recognized as |
|---|---|---|
| `Certified` | 401,412 | Certified |
| `Certified - Withdrawn` | 26,303 | Certified - Withdrawn |
| `Withdrawn` | 7,224 | Withdrawn |
| `Denied` | 2,557 | Denied |

Unrecognized status rows: **0**.

### Case status (kept rows)

| Status | Rows |
|---|---|
| Certified | 10,245 |
| Certified - Withdrawn | 531 |
| Withdrawn | 126 |
| Denied | 34 |

Decision dates in the kept rows: 2025-10-01 to 2026-06-30.

### Top employers in the extract

| Employer (as filed) | Kept rows |
|---|---|
| Amazon.com Services LLC | 1,413 |
| Google LLC | 508 |
| Microsoft Corporation | 484 |
| TT Commerce & Global Services LLC | 250 |
| Tesla, Inc. | 204 |
| Meta Platforms, Inc | 198 |
| WAL-MART ASSOCIATES, INC. | 182 |
| Amazon Web Services, Inc. | 136 |
| PayPal, Inc. | 125 |
| HCL AMERICA INC | 103 |
| Adobe Inc. | 100 |
| NVIDIA Corporation | 99 |
| Cisco Systems, Inc. | 92 |
| Intuit Inc. | 91 |
| Amazon Development Center U.S., Inc. | 87 |

## Layout PDF checked against the real header row

Checked on 2026-10-21 by the AI agent (it read LCA_Record_Layout_FY2026_Q3.pdf, pages 1–4, and compared its 98 field names with the file's header row); reviewed and confirmed by Aravind Ravi the same day. All 26 columns this ingest reads appear in both.

- Header: the PDF lists `H-1B_DEPENDENT`; the file's column is `H_1B_DEPENDENT`. Not read by this ingest; no effect.
- CASE_STATUS spelling: the PDF says "Certified-Withdrawn"; the file says "Certified - Withdrawn". Statuses are compared with whitespace around the hyphen ignored.

## Columns written

`CASE_NUMBER`, `CASE_STATUS`, `DECISION_DATE`, `VISA_CLASS`, `JOB_TITLE`, `SOC_CODE`, `SOC_TITLE`, `FULL_TIME_POSITION`, `BEGIN_DATE`, `EMPLOYER_NAME`, `EMPLOYER_FEIN`, `TOTAL_WORKER_POSITIONS`, `NEW_EMPLOYMENT`, `CONTINUED_EMPLOYMENT`, `CHANGE_PREVIOUS_EMPLOYMENT`, `NEW_CONCURRENT_EMPLOYMENT`, `CHANGE_EMPLOYER`, `AMENDED_PETITION`, `WORKSITE_CITY`, `WORKSITE_STATE`, `WAGE_RATE_OF_PAY_FROM`, `WAGE_RATE_OF_PAY_TO`, `WAGE_UNIT_OF_PAY`, `PREVAILING_WAGE`, `PW_UNIT_OF_PAY`, `PW_WAGE_LEVEL`, `WAGE_FROM_ANNUAL`, `PREVAILING_WAGE_ANNUAL`, `_provenance`

No POC, attorney, agent, preparer, address, phone or email column is ever written; the tests enforce it.

*This audit reports what the ingest found. It does not say pass; a named human reads it and records that in the run log.*
