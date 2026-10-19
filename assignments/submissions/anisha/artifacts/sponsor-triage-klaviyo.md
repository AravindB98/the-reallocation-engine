## Executive summary

This report checks whether **Klaviyo Inc** is worth an application using only the committed sponsorship dataset. It found a record (154.0 approvals, last funding Series C on 2022-07-26). 1 gate(s) raised a flag that a human must read before acting. It deliberately gives no score.

## Gates

| Gate | Status | Detail |
|---|---|---|
| G1 snapshot-age | flag | newest funding date in data is 2025-09-26; 388 days before 2026-10-19. 'Recent' here means recent as of the snapshot, not today. |
| G2 company-match | pass | matched CSV line 14495: KLAVIYO INC |
| G3 sponsor-record | pass | 154 approvals on record |
| G4 role-family | pass | 1 sponsored title(s) match role keywords; 1 not senior-flagged |
| G5 timeline | pass | 590 days to opt_end (arithmetic only; no rule about cap-gap/STEM OPT is checked) |

## Record (source: CSV line 14495)

| Field | Value |
|---|---|
| csv_line | 14495 |
| company_name | KLAVIYO INC |
| state | MA |
| latest_funding_stage | Series C |
| latest_funding_date | 2022-07-26 |
| latest_funding_amount | 99999983.0 |
| total_approvals | 154.0 |
| total_denials | 4.0 |
| approval_rate | 97.46835443037976 |
| median_salary_offered_all_sponsored_titles | 126000.0 |
| top_job_titles_sponsored | ['Business Intelligence Engineer', 'Software Engineer II', 'Engineering Manager Data Exchange', 'Engineering Manager II- SMS', 'Senior Software Engineer'] |
| role_family_matched_titles | ['Business Intelligence Engineer'] |
| role_family_non_senior_titles | ['Business Intelligence Engineer'] |

## Run record

- run_date: 2026-10-19
- csv: data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv (30369 rows)
