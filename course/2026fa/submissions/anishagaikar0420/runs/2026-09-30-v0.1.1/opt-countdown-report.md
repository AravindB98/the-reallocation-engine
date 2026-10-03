# OPT-window countdown — 2026-09-30

## Executive summary

This report checks 10 analyst job postings against two things a graduating international student cannot easily see: whether the job could start inside her OPT window (after OPT begins, before the 90-day unemployment limit runs out), and whether the company has a record of H-1B sponsorship. It recommends applying to 1, looking closer at 3, and skipping 4; 2 could not be judged because a fact was missing, and those are listed with what to check by hand rather than guessed. It is a sample run: whether each posting is still open was not checked online, and the sponsorship counts are company-wide, not specific to analyst roles.

## Run record

*Recipe `anishagaikar0420-msis-bi-analyst-opt-countdown` v0.1.1 · mode **RUNNABLE-SAMPLE** · no AI model was called; every value below is **record** (from a repo file) or **your-input** (a date, rating or rule you supplied).*

## Your window

| | Date | Label |
|---|---|---|
| Program end | 2027-05-15 | your-input (check your I-20) |
| OPT start | 2027-06-01 | your-input (the date you request on the I-765) |
| 90-day unemployment deadline | 2027-08-30 | your-input (derived; confirm the 90-day figure with your DSO) |

**244 days until OPT starts.** A posting is only worth tailoring if the job can start between 2027-06-01 and 2027-08-30.

## Result: 10 roles → Apply 1 · Consider 3 · Skip 4 · blocked 2

Skip rate among scored roles: 50%. Blocked roles were **not** scored — a missing fact is not a zero.

| Role | Decision | Composite | Gates (liveness · timeline) | Sponsorship (record) | Next action |
|---|---|---|---|---|---|
| Gusto — Business Intelligence Analyst, New Grad 2027 | **Apply** | 0.525 | liveness active (1) · timeline open (1) — 77 days of slack before the deadline | Proven: 218 approvals / 4 denials | [2h apply] Tailor this application (research is done — spend the time on the résumé/cover letter). |
| Figma — Data Analyst, Product (University Grad) | **Consider** | 0.450 | liveness active (1) · timeline open (1) — 70 days of slack before the deadline | Likely: 188 approvals / 2 denials | [3h network] Find one alum or analyst at this company before applying; ask about their sponsorship and start dates. |
| Sigma Computing, Inc. — Analytics Analyst (2027 start) | **Consider** | 0.360 | liveness active (1) · timeline open (1) — 84 days of slack before the deadline | Likely: 136 approvals / 0 denials | [3h network] Find one alum or analyst at this company before applying; ask about their sponsorship and start dates. |
| VIRTUSA CORP — Associate Business Analyst | **Consider** | 0.247 | liveness active (1) · timeline soft (0.5) — only 14 days of slack before the deadline (< 30) | Proven: 3212 approvals / 88 denials | [3h network] Find one alum or analyst at this company before applying; ask about their sponsorship and start dates. |
| Haus Analytics — BI Analyst | **Skip** | 0.180 | liveness active (1) · timeline open (1) — 76 days of slack before the deadline | None: no approvals on record | [skip] Skip. The time goes back to networking and your credibility project. |
| Remitly — Marketing Analytics Analyst (start ASAP) | **Skip** | 0.000 | liveness active (1) · timeline closed (0) — role starts ASAP, before OPT start 2027-06-01 — cannot legally start | Proven: 344 approvals / 4 denials | [3h network] Skip this posting, but network now: a sponsor whose timing is wrong today may open a new-grad role in your window. |
| Site Technologies Inc — Business Analyst | **Skip** | 0.000 | liveness active (1) · timeline closed (0) — earliest start 2027-10-04 is 35 days after the unemployment deadline 2027-08-30 | Proven: 148 approvals / 2 denials | [3h network] Skip this posting, but network now: a sponsor whose timing is wrong today may open a new-grad role in your window. |
| Copart — Product Analyst | **Skip** | 0.000 | liveness expired (0) · timeline open (1) — 77 days of slack before the deadline | Proven: 132 approvals / 0 denials | [skip] Skip. The time goes back to networking and your credibility project. |
| Pinterest — Data Analyst, University Grad | ⛔ blocked | — | — | Proven: 1364 approvals / 16 denials | **liveness-unchecked** → run: npm run ats:liveness -- https://www.pinterestcareers.com/jobs/EXAMPLE-0009 |
| Northwind Insights — Junior BI Analyst | ⛔ blocked | — | — | — | **company-not-found** → No row for "NORTHWIND INSIGHTS" in the 80-Days CSV. Check the DOL LCA disclosure data by hand before deciding; do not treat this as "never sponsors". |

## Per-role evidence, labeled

### gusto-bi-newgrad — Gusto

| Value | Label | Source |
|---|---|---|
| Company match: ok → "GUSTO INC" | record | 80-Days CSV |
| H-1B approvals 218, denials 4, rate 98.2% | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: Software Engineer; Senior Analyst, Marketing Insights & Analytics; Software Engineer Manager; Business Intelligence Engineer; Head of Product Management, Tax Credits | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: Senior Analyst, Marketing Insights & Analytics | your-input rule | keyword list in profile |
| Tier **Proven** → p = 0.9 | your-input rule on record counts | profile.rules |
| Latest funding: Series D+, $114,274,414, 2021-07-15 (62 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-2051.01 Business Intelligence Analysts: national median $112,590, cognitive pivot 3.903 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |
| Liveness: active on 2026-09-29 | your-input | sample fixture - not checked against the live web |
| Posting start 2027-06-14; hiring lag 60 days; earliest work 2027-06-14; slack 77 days → factor 1 | your-input | profile + roles file |
| Fit 0.7 | your-input | your own rating in the roles file |
| Scorer: (0.9·0.35 + 0.7·0.3) × 1 × 1 = 0.525 → Apply | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |

### figma-data-analyst — Figma

| Value | Label | Source |
|---|---|---|
| Company match: ok → "FIGMA INC" | record | 80-Days CSV |
| H-1B approvals 188, denials 2, rate 98.9% | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: Software Engineer; Account Manager, Enterprise; Software Engineer - Infrastructure; Motion Designer, Brand Studio; Data Scientist, Product Analytics | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: none | your-input rule | keyword list in profile |
| Tier **Likely** → p = 0.6 | your-input rule on record counts | profile.rules |
| Latest funding: Series D+, $415,749,740, 2024-05-15 (28 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-2051.01 Business Intelligence Analysts: national median $112,590, cognitive pivot 3.903 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |
| Liveness: active on 2026-09-28 | your-input | sample fixture - not checked against the live web |
| Posting start 2027-06-21; hiring lag 45 days; earliest work 2027-06-21; slack 70 days → factor 1 | your-input | profile + roles file |
| Fit 0.8 | your-input | your own rating in the roles file |
| Scorer: (0.6·0.35 + 0.8·0.3) × 1 × 1 = 0.450 → Consider | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |

### sigma-analytics-analyst — Sigma Computing, Inc.

| Value | Label | Source |
|---|---|---|
| Company match: ok → "SIGMA COMPUTING INC" | record | 80-Days CSV |
| H-1B approvals 136, denials 0, rate 100.0% | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: Software Engineer; Senior Analytics Engineer; Engineering Manager; Field and Partner Marketing Manager | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: none | your-input rule | keyword list in profile |
| Tier **Likely** → p = 0.6 | your-input rule on record counts | profile.rules |
| Latest funding: Series D+, $273,999,679, 2024-04-05 (29 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-2059: **missing (no-occupation-row)** — no wage shown, none invented | record | BLS/O*NET compact |
| Liveness: active on 2026-09-29 | your-input | sample fixture - not checked against the live web |
| Posting start 2027-06-07; hiring lag 45 days; earliest work 2027-06-07; slack 84 days → factor 1 | your-input | profile + roles file |
| Fit 0.5 | your-input | your own rating in the roles file |
| Scorer: (0.6·0.35 + 0.5·0.3) × 1 × 1 = 0.360 → Consider | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |

### virtusa-ba-late-start — VIRTUSA CORP

| Value | Label | Source |
|---|---|---|
| Company match: ok → "VIRTUSA CORP" | record | 80-Days CSV |
| H-1B approvals 3212, denials 88, rate 97.3% | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: JUNIOR COMPUTER SYSTEMS ENGINEER 1; IT PROJECT MANAGER 3; JAVA ENGINEER 2; BUSINESS ANALYST 3; .NET ENGINEER 2 | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: BUSINESS ANALYST 3 | your-input rule | keyword list in profile |
| Tier **Proven** → p = 0.9 | your-input rule on record counts | profile.rules |
| Latest funding: Series D+, $108,000,000, 2017-05-03 (112 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-1211 Computer Systems Analysts: national median $103,790, cognitive pivot 4.024 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |
| Liveness: active on 2026-09-29 | your-input | sample fixture - not checked against the live web |
| Posting start 2027-08-16; hiring lag 45 days; earliest work 2027-08-16; slack 14 days → factor 0.5 | your-input | profile + roles file |
| Fit 0.6 | your-input | your own rating in the roles file |
| Scorer: (0.9·0.35 + 0.6·0.3) × 1 × 0.5 = 0.247 → Consider | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |

### haus-analytics-bi — Haus Analytics

| Value | Label | Source |
|---|---|---|
| Company match: ok → "HAUS ANALYTICS INC" | record | 80-Days CSV |
| H-1B approvals —, denials —, rate — | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: — | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: none | your-input rule | keyword list in profile |
| Tier **None** → p = 0 | your-input rule on record counts | profile.rules |
| ⚠ No approvals on record in this CSV. Absence of a record is not a record of absence — the SEC↔DOL join does not prove entity resolution. | — | — |
| Latest funding: Series B, $20,000,000, 2025-04-07 (17 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-2051.01 Business Intelligence Analysts: national median $112,590, cognitive pivot 3.903 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |
| Liveness: active on 2026-09-29 | your-input | sample fixture - not checked against the live web |
| Posting start 2027-06-15; hiring lag 45 days; earliest work 2027-06-15; slack 76 days → factor 1 | your-input | profile + roles file |
| Fit 0.6 | your-input | your own rating in the roles file |
| Scorer: (0·0.35 + 0.6·0.3) × 1 × 1 = 0.180 → Skip | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |

### remitly-analytics-asap — Remitly

| Value | Label | Source |
|---|---|---|
| Company match: ok → "REMITLY INC" | record | 80-Days CSV |
| H-1B approvals 344, denials 4, rate 98.9% | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: SENIOR ANALYST, MARKETING ANALYTICS; Senior Software Development Engineer; Software Engineer; Senior IT Auditor; Product Designer II; Senior Software Engineer | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: SENIOR ANALYST, MARKETING ANALYTICS | your-input rule | keyword list in profile |
| Tier **Proven** → p = 0.9 | your-input rule on record counts | profile.rules |
| Latest funding: Series C, $114,999,998, 2017-11-10 (106 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-2051.01 Business Intelligence Analysts: national median $112,590, cognitive pivot 3.903 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |
| Liveness: active on 2026-09-30 | your-input | sample fixture - not checked against the live web |
| Posting start asap; hiring lag 30 days; earliest work 2027-06-01; slack 90 days → factor 0 | your-input | profile + roles file |
| Fit 0.75 | your-input | your own rating in the roles file |
| Scorer: (0.9·0.35 + 0.75·0.3) × 1 × 0 = 0.000 → Skip | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |

### site-tech-ba-october — Site Technologies Inc

| Value | Label | Source |
|---|---|---|
| Company match: ok → "SITE TECHNOLOGIES INC" | record | 80-Days CSV |
| H-1B approvals 148, denials 2, rate 98.7% | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: Business Analyst; Product Owner; Oracle Consultant; Software Engineer; Full Stack Developer | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: Business Analyst | your-input rule | keyword list in profile |
| Tier **Proven** → p = 0.9 | your-input rule on record counts | profile.rules |
| Latest funding: Series A, $9,999,992, 2023-07-14 (38 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 13-1111 Management Analysts: national median $101,190, cognitive pivot 4.013 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |
| Liveness: active on 2026-09-29 | your-input | sample fixture - not checked against the live web |
| Posting start 2027-10-04; hiring lag 45 days; earliest work 2027-10-04; slack -35 days → factor 0 | your-input | profile + roles file |
| Fit 0.65 | your-input | your own rating in the roles file |
| Scorer: (0.9·0.35 + 0.65·0.3) × 1 × 0 = 0.000 → Skip | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |

### copart-product-analyst-ghost — Copart

| Value | Label | Source |
|---|---|---|
| Company match: ok → "COPART INC" | record | 80-Days CSV |
| H-1B approvals 132, denials 0, rate 100.0% | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: Software Engineer; Product Analyst; Sr. Product Analyst – Technology Product; Business Intelligence Developer; IT Manager | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: Product Analyst; Sr. Product Analyst – Technology Product | your-input rule | keyword list in profile |
| Tier **Proven** → p = 0.9 | your-input rule on record counts | profile.rules |
| Latest funding: Series D+, $108,000,000, 2023-10-06 (35 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-2051.01 Business Intelligence Analysts: national median $112,590, cognitive pivot 3.903 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |
| Liveness: expired on 2026-09-29 | your-input | sample fixture - not checked against the live web |
| Posting start 2027-06-14; hiring lag 45 days; earliest work 2027-06-14; slack 77 days → factor 1 | your-input | profile + roles file |
| Fit 0.8 | your-input | your own rating in the roles file |
| Scorer: (0.9·0.35 + 0.8·0.3) × 0 × 1 = 0.000 → Skip | script output (arithmetic over the labels above) | scripts/score/role-scorer.mjs |

### pinterest-data-analyst-unchecked — Pinterest

| Value | Label | Source |
|---|---|---|
| Company match: ok → "PINTEREST INC" | record | 80-Days CSV |
| H-1B approvals 1364, denials 16, rate 98.8% | record | 80-Days CSV (company-wide, all roles) |
| Sampled sponsored titles: Software Engineer; Software Engineer II; Software Engineer I; Senior Software Engineer; Senior Data Analyst | record | 80-Days CSV (≤ 5 titles) |
| Analyst titles matched: Senior Data Analyst | your-input rule | keyword list in profile |
| Tier **Proven** → p = 0.9 | your-input rule on record counts | profile.rules |
| Latest funding: Series D+, $150,000,667, 2017-06-02 (111 months ago) | record | 80-Days CSV (context only — the scorer has no funding vote) |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-2051.01 Business Intelligence Analysts: national median $112,590, cognitive pivot 3.903 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |
| Liveness: **liveness-unchecked** | — | not checked |

### northwind-bi-not-in-csv — Northwind Insights

| Value | Label | Source |
|---|---|---|
| Company match: company-not-found (tried "NORTHWIND INSIGHTS") | record | 80-Days CSV |
| Form D sample match: no (samples only — proves nothing) | record | data/sec/form-d/processed/sample |
| SOC 15-2051.01 Business Intelligence Analysts: national median $112,590, cognitive pivot 3.903 | record | BLS/O*NET compact (context only — role_quality weight is 0.0 in the scorer) |

## What this run did NOT verify

- Liveness in this run was **not checked against the live web** — it is your-input from the roles file. Run `npm run ats:liveness` and pass `--liveness-log` before trusting any Apply.
- H-1B counts are **company-wide**, not for analyst roles; the title list is a ≤5-title sample.
- Every approval and denial count in the matched rows is an even number (8 of 8 matched companies that have approval counts). A possible upstream double-count — cause not confirmed. Tiers use a threshold, so a 2× error could move a company across it.
- OPT/unemployment figures are the student's stated assumptions, not read from a regulation. Confirm with a DSO.
- Posting start dates and hiring lags are your-input. A recruiter can change either.
- Role quality and funding are shown as context only; they do not change any decision (role_quality weight 0.0; no funding term in the scorer).
- A blocked company is **not** a non-sponsor. It is an open question for you to research.

*You decide at every gate. This report hands the decision back to you.*
