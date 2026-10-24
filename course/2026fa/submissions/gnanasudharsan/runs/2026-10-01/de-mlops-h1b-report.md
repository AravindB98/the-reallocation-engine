# Data Engineering / MLOps H-1B triage — run report

## Executive summary

**What this is:** a check of 12 data-engineering and MLOps job postings against the H-1B sponsorship records, saved posting-liveness results, and visa-timeline assumptions this student entered. Each posting either got a score from the engine's scorer, or was put on hold because the evidence was missing.

**Why read it:** it tells you which applications are worth tailoring this week, which companies to network into instead, and which postings to drop — and, for every number, whether it came from a record, a rule this tool applied, or your own input.

**What it found:** 2 to apply, 4 to consider, 0 to skip, and 6 on hold for missing evidence. A hold is not a "no": it means the data here cannot say, and a person has to find out. More than half the postings were not recommended, which is what a healthy run looks like.

## Run record

- Run date: 2026-10-01 · Recipe: `recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md` v0.1.0 · Script: `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs`
- Scorer: `scripts/score/role-scorer.mjs` — `✓ scored 6 roles → Apply 2 · Consider 4 · Skip 0 (skip 0%)`
- Input persona: `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json` (sha256 `e8393e9952b9…`)
- Input postings: `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json` (sha256 `aba1c6640d30…`)
- Input liveness: `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt` (sha256 `ddf631a8c44f…`)
- Input csv: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2addf4…`)
- Input bls: `data/bls/compact/soc_occupation_compact.csv` (sha256 `bac5acf77ca2…`)
- G0 profile [your-input]: program end 2026-12-12; assumed EAD start 2027-02-01; assumed OPT end 2028-01-31; assumed authorization end 2030-01-31 (OPT end + 24-month STEM extension (assumed eligible)). Scorer reports profile needs sponsorship: true [record].

## Scored roles

| Role | Rec | Composite | Sponsorship [record] | Fit [your-input] | Liveness [record] | Timeline [your-input] | Next action |
|---|---|---|---|---|---|---|---|
| Roku — Senior Data Engineer | **Apply** | 0.525 | Proven (p 0.9; 654 approvals, 4 denials; family titles: Senior Data Engineer) | 0.7 | active → 1 | 1 (start 2027-02-01; seasons 2027, 2028, 2029) | tailor this application (2 research-and-apply hours) |
| Twilio — Machine Learning Engineer | **Apply** | 0.525 | Proven (p 0.9; 802 approvals, 20 denials; family titles: Machine Learning Engineer (L2)) | 0.7 | active → 1 | 1 (start 2027-02-01; seasons 2027, 2028, 2029) | tailor this application (2 research-and-apply hours) |
| Roku — Senior Machine Learning Engineer | **Consider** | 0.420 | Likely (p 0.6; 654 approvals, 4 denials; family titles: none) | 0.7 | active → 1 | 1 (start 2027-02-01; seasons 2027, 2028, 2029) | one soft spot — confirm it (ask a contact) before tailoring |
| Databricks — Senior Applied ML Engineer - ML4Sys | **Consider** | 0.420 | Likely (p 0.6; 1640 approvals, 8 denials; family titles: none) | 0.7 | active → 1 | 1 (start 2027-02-01; seasons 2027, 2028, 2029) | one soft spot — confirm it (ask a contact) before tailoring |
| Databricks — Specialist Solutions Architect - Data Engineering & Warehousing | **Consider** | 0.420 | Likely (p 0.6; 1640 approvals, 8 denials; family titles: none) | 0.7 | active → 1 | 1 (start 2027-02-01; seasons 2027, 2028, 2029) | one soft spot — confirm it (ask a contact) before tailoring |
| Robinhood — Senior Software Engineer, Data Engineering | **Consider** | 0.420 | Likely (p 0.6; 824 approvals, 24 denials; family titles: none) | 0.7 | active → 1 | 1 (start 2027-02-01; seasons 2027, 2028, 2029) | one soft spot — confirm it (ask a contact) before tailoring |

Scorer reason per row is in `role-scores.md` beside this report (the scorer's own audit trace).

## On hold — not scored, nothing filled in

| Role | Hold reason | Detail | Next action |
|---|---|---|---|
| Roblox — Senior Data Engineer, Economy | `liveness-unconfirmed` | saved liveness output says "uncertain" for https://careers.roblox.com/jobs/8172297?gh_jid=8172297 | human: open the posting; re-run ats:liveness and save the output |
| Roblox — Senior Hardware Engineer - GPU & AI Infrastructure | `liveness-unconfirmed` | saved liveness output says "uncertain" for https://careers.roblox.com/jobs/7463674?gh_jid=7463674 | human: open the posting; re-run ats:liveness and save the output |
| Instacart — Senior Machine Learning Engineer, Digital Twin Platform | `liveness-unconfirmed` | saved liveness output says "uncertain" for https://instacart.careers/job/?gh_jid=8143145 | human: open the posting; re-run ats:liveness and save the output |
| Upstart — Senior Software Engineer - Machine Learning Platform | `not-in-dataset` | no row whose normalized name is "upstart" (exact match only) | network in: ask an employee whether the team sponsors (no record here either way) |
| Roblox — Senior Growth Data Engineer | `liveness-unconfirmed` | saved liveness output says "uncertain" for https://careers.roblox.com/jobs/8055450?gh_jid=8055450 | human: open the posting; re-run ats:liveness and save the output |
| Databricks — Data Engineer (fabricated job id — deliberate break) | `liveness-unconfirmed` | saved liveness output says "uncertain" for https://job-boards.greenhouse.io/databricks/jobs/9999999999 | human: open the posting; re-run ats:liveness and save the output |

## Context — shown, not scored

The scorer has no funding term, and its role-quality weight is 0.0. The values below are records, shown so a person can judge them. They changed no decision above. Recent funding is **not** evidence of sponsorship.

| Company | CSV row | Latest funding date [record] | In Form D sample? [record] |
|---|---|---|---|
| Roku | ROKU INC | 2015-11-09 | not in the 50-per-quarter sample |
| Roblox | ROBLOX CORP | 2022-04-01 | not in the 50-per-quarter sample |
| Databricks | DATABRICKS INC | 2025-09-08 | 2025Q4_d filed 31-DEC-2025; 2025Q4_d filed 31-DEC-2025 |
| Instacart | MAPLEBEAR INC | 2021-10-15 | not in the 50-per-quarter sample |
| Robinhood | ROBINHOOD MARKETS INC | 2020-08-13 | not in the 50-per-quarter sample |
| Upstart | — (no unique row) | — | not in the 50-per-quarter sample |
| Twilio | TWILIO INC | 2021-07-14 | not in the 50-per-quarter sample |

| Family | SOC row (mapping is model-judgment) | OEWS year | Annual median wage [record] |
|---|---|---|---|
| data-engineering | 15-1243.00 Database Architects | 2024 | 135980.0 |
| data-engineering | 15-1243.01 Data Warehousing Specialists | 2024 | 135980.0 |
| mlops | 15-1252.00 Software Developers | 2024 | 133080.0 |
| mlops | 15-2051.00 Data Scientists | 2024 | 112590.0 |

## Verified vs. inferred

- **record:** H-1B approval/denial counts and sponsored titles (80 Days CSV); posting liveness status (saved `ats:liveness` output); funding dates and Form D sample hits; BLS wage rows; the scorer's `profile_needs_sponsorship` flag.
- **model-judgment:** the title→family keyword lists (`data engineer|analytics engineer|data platform|data infrastructure|data warehous|etl developer|big data` · `mlops|ml ops|machine learning engineer|ml engineer|machine learning platform|ml platform|ml infrastructure|machine learning infrastructure|ai infrastructure|ai platform`); the sponsorship tier rule; the tier→p values; the family→SOC mapping.
- **your-input:** program end and EAD start dates; STEM-extension eligibility; each posting's fit rating and start date; the one-registration-window-per-March assumption and the `min(1, seasons/3)` timeline rule.
- **cannot verify here:** whether a company will sponsor *this* role now; E-Verify enrollment; any company absent from the CSV; Form D filings outside the 50-company samples; which SOC code an employer will file under.

_The human decides. This report is a list, not an application._
