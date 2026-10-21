# AI/ML cognitive-floor run: dec2026-completion-jan2027-start-aiml

## Executive summary

This report checks 12 AI/ML and data job postings against two hard gates (is the posting still open, and does the work-start timeline hold) and then asks whether the occupation behind each role clears a reasoning-and-judgment floor drawn from federal occupational data. Read it to see which postings are worth effort and which conclusions the data cannot support. Result by count: clears the floor 7; below the floor 0; depends on how the employer classifies the job 0; on hold for missing evidence 4; skipped at a gate 1; stopped 0.

## Run record

- Run at: 2026-10-21T19:32:31.191Z (as-of date 2026-10-21) · mode: live
- Command: `node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir assignments/submissions/deepakkts/run`
- Source: `data/bls/compact/soc_occupation_compact.csv` · 1016 rows · sha256 `bac5acf77ca2d25268c75b3706084f7f67bcc0c6e3cc68cd03e0ebd2598343d1`
- Source: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` · 30369 rows · sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`
- Floor: percentile 75 [model-judgment] → cutoff 3.749 (rank 671 of 894 scored occupations) [record-derived]
- Timeline gate: **open** · all three month checks hold
  - program_completion_month: 2026-12 [your-input]
  - target_start_month: 2027-01 [your-input]
  - ead_expected_month: 2027-01 [model-judgment]
  - latest_opt_start_month: 2027-02 [model-judgment]
- Needs sponsorship: true [your-input]. Sponsorship history is reported as a record and is not a vote or a gate here.

## Per-role results

| Role | Liveness gate [record] | SOC candidates [model-judgment] → score [record] | Sponsorship history [record] | Disposition |
|---|---|---|---|---|
| PathAI: Machine Learning Engineer II (Applied Research & Model Development) (job 8696752002) | open (api_listed, HTTP 200) | 15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor<br>15-1252.00 Software Developers: 3.834 → clears_floor | PATHAI INC: 78 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Discord: Data Scientist - Client Platform (job 8840756002) | open (api_listed, HTTP 200) | 15-2051.00 Data Scientists: no score → missing_ratings | DISCORD INC: 122 approvals, 0 denials [suffix-normalized] | **HOLD_MISSING_EVIDENCE** |
| Figma: AI Applied Scientist (job 5707966004) | open (api_listed, HTTP 200) | 15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor (O*NET sample title hit: Applied Scientist) | FIGMA INC: 188 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Figma: Data Scientist (job 5552580004) | open (api_listed, HTTP 200) | 15-2051.00 Data Scientists: no score → missing_ratings | FIGMA INC: 188 approvals, 2 denials [suffix-normalized] | **HOLD_MISSING_EVIDENCE** |
| Figma: Software Engineer - Machine Learning (job 5551532004) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | FIGMA INC: 188 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Moloco: Data Scientist II, Product - Moloco Commerce Media (job 7985823003) | open (api_listed, HTTP 200) | 15-2051.00 Data Scientists: no score → missing_ratings<br>15-2041.00 Statisticians: 3.958 → clears_floor | MOLOCO INC: 200 approvals, 2 denials [suffix-normalized] | **HOLD_MISSING_EVIDENCE** |
| Moloco: Expression of Interest: Machine Learning Engineer (job 7655058003) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | MOLOCO INC: 200 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Reddit: Machine Learning Engineer (job 7131932) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | REDDIT INC: 408 approvals, 12 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Airbnb: Machine Learning Engineer, Assistance Engineering (job 7826337) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | AIRBNB INC: 1000 approvals, 10 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Airbnb: Machine Learning Engineer, Relevance and Personalization (job 7708224) | closed (http_gone, HTTP 404) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | AIRBNB INC: 1000 approvals, 10 denials [suffix-normalized] | **SKIP_GATED_LIVENESS** |
| AppLovin: Measurement Data Scientist (job 4705264006) | open (api_listed, HTTP 200) | 15-2051.00 Data Scientists: no score → missing_ratings<br>15-2041.00 Statisticians: 3.958 → clears_floor | APPLOVIN CORP: 130 approvals, 2 denials [suffix-normalized] | **HOLD_MISSING_EVIDENCE** |
| AppLovin: Software Engineer, Machine Learning (job 4712559006) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | APPLOVIN CORP: 130 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |

## Why each disposition

- **pathai-mle-ii** · CLEARS_FLOOR: every candidate SOC scores at or above the cutoff
- **discord-ds-client-platform** · HOLD_MISSING_EVIDENCE: 15-2051.00 Data Scientists: cognitive_pivot_score is blank and 0/9 rating fields are filled. Missing evidence, not a zero.
- **figma-ai-applied-scientist** · CLEARS_FLOOR: every candidate SOC scores at or above the cutoff
- **figma-data-scientist** · HOLD_MISSING_EVIDENCE: 15-2051.00 Data Scientists: cognitive_pivot_score is blank and 0/9 rating fields are filled. Missing evidence, not a zero.
- **figma-swe-ml** · CLEARS_FLOOR: every candidate SOC scores at or above the cutoff
- **moloco-ds-ii-product** · HOLD_MISSING_EVIDENCE: 15-2051.00 Data Scientists: cognitive_pivot_score is blank and 0/9 rating fields are filled. Missing evidence, not a zero.
- **moloco-mle-expression-of-interest** · CLEARS_FLOOR: every candidate SOC scores at or above the cutoff
- **reddit-mle** · CLEARS_FLOOR: every candidate SOC scores at or above the cutoff
- **airbnb-mle-assistance** · CLEARS_FLOOR: every candidate SOC scores at or above the cutoff
- **airbnb-mle-relevance-2026-09-16** · SKIP_GATED_LIVENESS: HTTP 404 from the board API: the posting is gone
- **applovin-measurement-ds** · HOLD_MISSING_EVIDENCE: 15-2051.00 Data Scientists: cognitive_pivot_score is blank and 0/9 rating fields are filled. Missing evidence, not a zero.
- **applovin-swe-ml** · CLEARS_FLOOR: every candidate SOC scores at or above the cutoff

## Stop conditions that fired

- none

## Labels

- record: read from a file in this checkout or from the employer's board API during this run.
- model-judgment: chosen by the assistant that configured the scenario; not a record; needs a human decision.
- your-input: supplied by the person running the mode.
