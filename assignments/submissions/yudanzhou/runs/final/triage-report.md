# IS funded-sponsor triage: run report

## Executive summary

This report checks 17 job postings for a fictional Information Systems master's student who prefers funded companies and needs H-1B sponsorship. Of the funded companies in the shipped data, only **1,532 of 27,874** have any H-1B approval on record, and only **131** of those raised money in the last 24 months. Result: **0** posting(s) worth an application today, **0** company(ies) for the networking list (no record, which is not a no), and the rest are skipped or blocked on a check a human must do. Every number is labeled: `record` came from a data file; `your-input` is my own assumption or rule.

*Context only: no posting in this run reached the sponsorship lookup, so the dataset counts above informed none of the 17 decisions below.*

## Run record

- Run date (`--today`): 2026-10-20
- Persona: `is-ms-2027-da-focus` (fictional; your-input)
- Visa-timeline gate: factor **1.0** [your-input]. OPT start 2027-06-01, window ends 2027-08-30, earliest start 2027-06-01 (window open)

## Which of my role families do funded sponsors actually sponsor? [record]

| Role family | Funded companies with H-1B approvals whose top sponsored titles include it | Examples |
|---|---|---|
| data_analyst | 38 | ACE-UP INC, AFFINITY SOLUTIONS INC, ALLAKOS INC |
| business_analyst | 31 | ABACUS INSIGHTS INC, APEX TECHNOLOGY INC, ASTRUMU INC |
| it_consultant | 21 | ACQUIA INC, APTTUS CORP, CELIGO INC |
| product_analyst | 4 | COPART INC, PROVE IDENTITY INC, REVEL TRANSIT INC |

*Caveat: top_job_titles_sponsored lists only a company's top titles, so a missing family is 'not in top titles', not 'never sponsored'.*

*This table is background from the dataset, not an output of this run's decisions.*

## Per-posting decision

| Posting | Company | Family | Status | Sponsorship evidence [record] | Funding [record] | Recommendation | Next action |
|---|---|---|---|---|---|---|---|
| r01 Manager II, Engineering- Analytics Engineering, Core Data Science | PINTEREST INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r02 Sales Finance Analyst II | PINTEREST INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r03 Software Engineer II, Data Analytics & Engineering | PINTEREST INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r04 Staff Software, Engineering – Analytics Engineering, Core Data Science | PINTEREST INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r05 Senior Compliance Manager, Analytics & Program Effectiveness | MOLOCO INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r06 Senior Data Scientist, Growth Analytics | MOLOCO INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r07 Senior Marketing Insights Analyst | MOLOCO INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r08 Business Applications Analyst III | ZOOMINFO TECHNOLOGIES INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r09 Customer Solutions Analyst II | ZOOMINFO TECHNOLOGIES INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r10 GTM Technical Solutions Analyst II | ZOOMINFO TECHNOLOGIES INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r11 Principal Data Scientist - Product Analytics | ZOOMINFO TECHNOLOGIES INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r12 Senior Analytics Engineer | ZOOMINFO TECHNOLOGIES INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r13 Senior Business Intelligence Analyst – Product Analytics | ZOOMINFO TECHNOLOGIES INC | data_analyst | location-unclear | — | — | held out | Human: confirm the role can be done from the US before applying. **Gate decision:** reject by yudanzhou 2026-10-20 — Location 'Remote' names no country; not cleared without evidence the role can be done from the US. |
| r14 Senior Data Analyst | ZOOMINFO TECHNOLOGIES INC | data_analyst | non-us-location | — | — | held out | Skip: OPT work must be in the US; this posting is outside it. |
| r15 BI Analyst III | CREDIBLE LABS INC | data_analyst | seniority-check | — | — | held out | Human: read the posting's years-of-experience line; this persona is a new graduate. **Gate decision:** reject by yudanzhou 2026-10-20 — Credible 'BI Analyst III' requires '3+ years of work experience as a data analyst'; the persona is a new graduate. |
| r16 Performance Marketing Analyst | WATERSHED TECHNOLOGY INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
| r17 Senior Director, Capacity Planning, Workforce Operations & Analytics | OMADA HEALTH INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |

## What this run did not verify

- Liveness came from the repo's `ats:liveness` checker (`record`), which can misread JavaScript-rendered career pages; postings it calls expired while the board API listed them are held as `liveness-conflict` (no row hit this in this run).
- Whether a company hires **OPT** graduates: the data only has H-1B approvals.
- Whether the employer is in **E-Verify** (required for STEM OPT): not in any shipped file.
- The sponsorship probability `p`: it is my mapping from approval counts (config.json), not a measured probability.
- Funding recency beyond 2025-09: the CSV's latest funding date is 2025-09-26; Form D lookups cover the shipped 50-company samples only.

*No row was scored in this run, so `role-scores.md` in this folder is an empty table (the shared scorer prints `skip NaN%` when it receives zero roles; recorded, not changed here).*
