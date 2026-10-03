# IS funded-sponsor triage: run report

## Executive summary

This report checks 9 job postings for a fictional Information Systems master's student who prefers funded companies and needs H-1B sponsorship. Of the funded companies in the shipped data, only **1,532 of 27,874** have any H-1B approval on record, and only **131** of those raised money in the last 24 months. Result: **4** posting(s) worth an application today, **2** company(ies) for the networking list (no record, which is not a no), and the rest are skipped or blocked on a check a human must do. Every number is labeled: `record` came from a data file; `your-input` is my own assumption or rule.

## Run record

- Run date (`--today`): 2026-10-02
- Persona: `is-ms-2027-funded-undecided` (fictional; your-input)
- Visa-timeline gate: factor **1.0** [your-input]. OPT start 2027-06-01, window ends 2027-08-30, earliest start 2027-06-01 (window open)

## Which of my role families do funded sponsors actually sponsor? [record]

| Role family | Funded companies with H-1B approvals whose top sponsored titles include it | Examples |
|---|---|---|
| data_analyst | 38 | ACE-UP INC, AFFINITY SOLUTIONS INC, ALLAKOS INC |
| business_analyst | 31 | ABACUS INSIGHTS INC, APEX TECHNOLOGY INC, ASTRUMU INC |
| it_consultant | 21 | ACQUIA INC, APTTUS CORP, CELIGO INC |
| product_analyst | 4 | COPART INC, PROVE IDENTITY INC, REVEL TRANSIT INC |

*Caveat: top_job_titles_sponsored lists only a company's top titles, so a missing family is 'not in top titles', not 'never sponsored'.*

## Per-posting decision

| Posting | Company | Family | Status | Sponsorship evidence [record] | Funding [record] | Recommendation | Next action |
|---|---|---|---|---|---|---|---|
| p1 Business Analyst | SITE TECHNOLOGIES INC | business_analyst | scored | approvals 148, denials 2; family titles: Business Analyst | Series A 2023-07-14 (stale) | **Apply** (0.555) | Tailor an application (2-hour apply block). |
| p2 Data Analyst II | MOLOCO INC | data_analyst | scored | approvals 200, denials 2; family titles: Data Analyst II | Series D+ 2021-08-09 (stale) | **Apply** (0.525) | Tailor an application (2-hour apply block). |
| p3 Product Analyst | COPART INC | product_analyst | scored | approvals 132, denials 0; family titles: Product Analyst, Sr. Product Analyst – Technology Product | Series D+ 2023-10-06 (stale) | **Apply** (0.495) | Tailor an application (2-hour apply block). |
| p4 Consultant - Analytics | TREDENCE INC | it_consultant | scored | approvals 564, denials 16; family titles: Consultant - Analytics, Consultant, Consultant | Series D+ 2022-12-22 (stale) | **Skip** (0.000) | Skip. Spend no apply-time here. |
| p5 Data Analyst | ALPHONSO INC | data_analyst | liveness-unchecked | approvals 130, denials 6; family titles: Senior Business and Data Analyst | Series A 2017-04-27 (stale) | held out | Run `npm run ats:liveness -- <url>`, record the result, re-run. |
| p6 Business Analyst | 123 SEE INC | business_analyst | no-h1b-record | approvals blank (no record) | Series B 2025-07-01 | held out | Networking list (3-hour block): ask a contact whether they hire OPT grads / sponsor. No record is not a no. |
| p7 Data Analyst | Example Fictional Analytics Co | data_analyst | no-company-row | — | — | held out | Networking list: company not in the CSV at all, so no evidence either way. |
| p8 Technology Consultant | DELOITTE CONSULTING LLP | it_consultant | scored | approvals 8810, denials 222; family titles: Senior Consultant, Consultant, Senior Consultant, Consultant | Series C 2022-01-07 (stale) | **Apply** (0.495) | Tailor an application (2-hour apply block). |
| p9 Data Engineer | PROVE IDENTITY INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |

## What this run did not verify

- Whether any posting is real or live: demo postings and liveness values are `your-input`.
- Whether a company hires **OPT** graduates: the data only has H-1B approvals.
- Whether the employer is in **E-Verify** (required for STEM OPT): not in any shipped file.
- The sponsorship probability `p`: it is my mapping from approval counts (config.json), not a measured probability.
- Funding recency beyond 2025-09: the CSV's latest funding date is 2025-09-26; Form D lookups cover the shipped 50-company samples only.

*Scored rows come from `scripts/score/role-scorer.mjs`; see `role-scores.md` in this folder for the term-by-term audit.*
