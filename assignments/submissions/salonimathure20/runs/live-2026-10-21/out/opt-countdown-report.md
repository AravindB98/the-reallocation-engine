# OPT countdown report — ananya-rao-example — as of 2026-10-21

## Executive summary

This report checks 12 job postings against one question first: can this employer hire you before your clock runs out? You have **35 days** of search time left (a job should start by **2026-11-25**); the tighter limit is your remaining OPT unemployment days, after your safety buffer. Of the 10 postings with complete evidence, 0 are worth applying to now, 1 worth a networking conversation first, and 9 should be skipped (3 of those because the posting has already closed). 1 more says in the posting itself that the role will not sponsor a visa, so it was not scored at all, however good the company's sponsorship history. 1 could not be scored because a fact was missing or too old to trust; those need a person to check before anything else happens. Nothing here is final: you decide every row (see "Your sign-off" at the end).

## Your clock

| Item | Value | Label |
|---|---|---|
| As of | 2026-10-21 | your-input |
| OPT end date | 2027-06-30 (252 days away) | your-input |
| Unemployment days used / allowed / buffer | 45 / 90 / 10 | your-input |
| Search runway | **35 days** (bound by unemployment-clock) | script arithmetic on your-input |
| Professional experience | 1 year (fictional: one 2025 summer data internship plus a 2-month 2026 contract role, rounded up) | your-input |

## Decisions and next actions

| Role | Decision | Why | Next action (3-3-2 block) |
|---|---|---|---|
| Abacus Insights Inc — Forward Deployed Data Engineer (US) | **Consider** (0.2303) | composite 0.230 in the Consider band [0.2, 0.3) | Informational chat with someone on the team before applying · 3 (network) h |
| PathAI Inc — Software Engineer I, Fullstack (Boston, hybrid) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts · 3 (network) h |
| Formlabs Inc — Software Engineer, Business Systems (Somerville, MA) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts · 3 (network) h |
| Cohere Health Inc — Healthcare Analyst II (US) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts · 3 (network) h |
| Formlabs Inc — Data Engineer (Somerville, MA) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts · 3 (network) h |
| Klaviyo Inc — Full Stack Software Engineer - People Systems (Boston) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts · 3 (network) h |
| Klaviyo Inc — Analytics Engineer (Boston) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts · 3 (network) h |
| CarGurus Inc — Performance Marketing Analyst (Boston) | **Blocked** | sponsorship: no-company-row | Resolve before scoring: sponsorship: no-company-row · 2 (research) h |
| EverQuote Inc — Data Scientist (Cambridge, MA) | **Skip** (0) | gated: posting says "not eligible for immigration sponsorship" (company H-1B history does not override the posting) | Posting says it will not sponsor: do not apply here; the employer may still sponsor other roles · 0 h |
| Formlabs Inc — Business Systems Analyst (Somerville, MA) [carried from 2026-10-03] | **Skip** (0) | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Dead or ghost posting: do not apply · 0 h |
| Iterative Health — Clinical Data Specialist (NYC, BOS or Dallas) [carried from 2026-10-03] | **Skip** (0) | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Dead or ghost posting: do not apply · 0 h |
| Klaviyo Inc — Data Analyst (DELIBERATE BREAK: job ID that does not exist) | **Skip** (0) | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Dead or ghost posting: do not apply · 0 h |

Skip rate among scored roles: 90% (a healthy run skips at least half).

## Verified vs. inferred, per role

| Role | Sponsorship history | Fit | Liveness | Timeline | Flags |
|---|---|---|---|---|---|
| PathAI Inc — Software Engineer I, Fullstack (Boston, hybrid) | 0.975 Proven [record: 78 approvals, 97.5%] | 0.75 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.193Z; checker active] | 0 [your-input: lag 45 d, slack -10 d] | — |
| Formlabs Inc — Software Engineer, Business Systems (Somerville, MA) | 0.875 Proven [record: 70 approvals, 87.5%] | 0.7 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.449Z; checker uncertain] | 0 [your-input: lag 45 d, slack -10 d] | checker said "uncertain", Greenhouse API said 200; open 295 days: possible evergreen or ghost requisition |
| Cohere Health Inc — Healthcare Analyst II (US) | 0.981 Proven [record: 104 approvals, 98.11%] | 0.5 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.547Z; checker active] | 0 [your-input: lag 45 d, slack -10 d] | open 154 days: possible evergreen or ghost requisition |
| Formlabs Inc — Data Engineer (Somerville, MA) | 0.875 Proven [record: 70 approvals, 87.5%] | 0.4 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.608Z; checker uncertain] | 0 [your-input: lag 45 d, slack -10 d] | checker said "uncertain", Greenhouse API said 200; posting asks 3+ years; you have 1 |
| Klaviyo Inc — Full Stack Software Engineer - People Systems (Boston) | 0.975 Proven [record: 154 approvals, 97.47%] | 0.3 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.665Z; checker active] | 0 [your-input: lag 60 d, slack -25 d] | open 145 days: possible evergreen or ghost requisition; posting asks 5+ years; you have 1 |
| Klaviyo Inc — Analytics Engineer (Boston) | 0.975 Proven [record: 154 approvals, 97.47%] | 0.3 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.740Z; checker active] | 0 [your-input: lag 60 d, slack -25 d] | posting asks 5+ years; you have 1 |
| EverQuote Inc — Data Scientist (Cambridge, MA) | 1 Proven [record: 56 approvals, 100%] | 0.45 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.799Z; checker uncertain] | 0 [your-input: lag 45 d, slack -10 d] | checker said "uncertain", Greenhouse API said 200 |
| Abacus Insights Inc — Forward Deployed Data Engineer (US) | 1 Proven [record: 22 approvals, 100%] | 0.15 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.859Z; checker active] | 0.583 [your-input: lag 30 d, slack 5 d] | posting asks 7+ years; you have 1 |
| CarGurus Inc — Performance Marketing Analyst (Boston) | missing: no-company-row | 0.4 [model-judgment] | 1 [record: greenhouse-api 200 at 2026-10-21T19:07:04.921Z; checker uncertain] | 0 [your-input: lag 45 d, slack -10 d] | checker said "uncertain", Greenhouse API said 200; open 142 days: possible evergreen or ghost requisition |
| Formlabs Inc — Business Systems Analyst (Somerville, MA) [carried from 2026-10-03] | 0.875 Proven [record: 70 approvals, 87.5%] | 0.65 [model-judgment] | 0 [record: greenhouse-api 404 at 2026-10-21T19:07:04.979Z; checker expired] | 0 [your-input: lag 45 d, slack -10 d] | — |
| Iterative Health — Clinical Data Specialist (NYC, BOS or Dallas) [carried from 2026-10-03] | 0.9 Proven [record: 18 approvals, 100%] | 0.5 [model-judgment] | 0 [record: greenhouse-api 404 at 2026-10-21T19:07:05.119Z; checker expired] | 0.583 [your-input: lag 30 d, slack 5 d] | name alias "ITERATIVE SCOPES INC" asserted by your-input (aliases.json) |
| Klaviyo Inc — Data Analyst (DELIBERATE BREAK: job ID that does not exist) | 0.975 Proven [record: 154 approvals, 97.47%] | 0.8 [model-judgment] | 0 [record: greenhouse-api 404 at 2026-10-21T19:07:05.236Z; checker uncertain] | 0 [your-input: lag 60 d, slack -25 d] | — |

## What the posting itself says

Read from the live posting text by fixed patterns on the check date (record). A missing phrase is not a promise: a posting that says nothing about sponsorship may still refuse it.

| Role | Open since [record] | Says it will not sponsor? [record] | Years asked [record] | Pay printed [record] |
|---|---|---|---|---|
| PathAI Inc — Software Engineer I, Fullstack (Boston, hybrid) | 2026-08-11 (71 d) | no phrase found | none stated | $96,750 - $148,350 |
| Formlabs Inc — Software Engineer, Business Systems (Somerville, MA) | 2025-12-30 (295 d) | no phrase found | 0+ ("0–3 years of professional software engineering experience") | $100,000 - $140,000 |
| Cohere Health Inc — Healthcare Analyst II (US) | 2026-05-20 (154 d) | no phrase found | 2+ ("2+ years of experience") | $85,000 to $92,000 |
| Formlabs Inc — Data Engineer (Somerville, MA) | 2026-10-07 (14 d) | no phrase found | 3+ ("3+ years of professional experience") | $80,000 - $125,000 |
| Klaviyo Inc — Full Stack Software Engineer - People Systems (Boston) | 2026-05-29 (145 d) | no phrase found | 5+ ("5+ years of engineering or data engineering experience") | $140,000 - $210,000 |
| Klaviyo Inc — Analytics Engineer (Boston) | 2026-07-23 (90 d) | no phrase found | 5+ ("5+ years of experience") | $140,000 - $210,000 |
| EverQuote Inc — Data Scientist (Cambridge, MA) | 2026-09-30 (21 d) | **yes**: "not eligible for immigration sponsorship" | 2+ ("2+ years of professional experience") | $129,900-$152,800 |
| Abacus Insights Inc — Forward Deployed Data Engineer (US) | 2026-10-09 (12 d) | no phrase found | 7+ ("7+ years of experience") | — |
| CarGurus Inc — Performance Marketing Analyst (Boston) | 2026-06-01 (142 d) | no phrase found | 2+ ("2+ years of professional experience") | $76,000 - $96,000 |
| Formlabs Inc — Business Systems Analyst (Somerville, MA) [carried from 2026-10-03] | — | not checked | not checked | — |
| Iterative Health — Clinical Data Specialist (NYC, BOS or Dallas) [carried from 2026-10-03] | — | not checked | not checked | — |
| Klaviyo Inc — Data Analyst (DELIBERATE BREAK: job ID that does not exist) | — | not checked | not checked | — |

## Context the score does not use

Role quality carries weight 0 in the shared scorer and funding has no scorer term at all, so these are shown for your judgment only. National medians are not what this employer or your metro pays.

| Role | Occupation (SOC) | National median wage [record, BLS OEWS] | Cognitive pivot score [record] | H-1B median salary offered [record, 80 Days] | Latest funding [record, 80 Days] |
|---|---|---|---|---|---|
| PathAI Inc | Software Developers (15-1252.00) | $133,080 (2024) | 3.834 | $145,600 | 2019-04-09 Series C $60,004,900 |
| Formlabs Inc | Software Developers (15-1252.00) | $133,080 (2024) | 3.834 | $111,000 | 2018-07-16 Series A $14,999,948 |
| Cohere Health Inc | Business Intelligence Analysts (15-2051.01) | $112,590 (2024) | 3.903 | $160,000 | 2025-05-07 Series C $89,999,876 |
| Formlabs Inc | Database Architects (15-1243.00) | $135,980 (2024) | 3.933 | $111,000 | 2018-07-16 Series A $14,999,948 |
| Klaviyo Inc | Software Developers (15-1252.00) | $133,080 (2024) | 3.834 | $126,000 | 2022-07-26 Series C $99,999,983 |
| Klaviyo Inc | Business Intelligence Analysts (15-2051.01) | $112,590 (2024) | 3.903 | $126,000 | 2022-07-26 Series C $99,999,983 |
| EverQuote Inc | Data Scientists (15-2051.00) | $112,590 (2024) | missing in table | $117,640 | 2022-02-23 Series A $14,999,999 |
| Abacus Insights Inc | Database Architects (15-1243.00) | $135,980 (2024) | 3.933 | $110,510 | 2024-10-01 Series A $11,742,458 |
| CarGurus Inc | Business Intelligence Analysts (15-2051.01) | $112,590 (2024) | 3.903 | — | no-company-row |
| Formlabs Inc | Computer Systems Analysts (15-1211.00) | $103,790 (2024) | 4.024 | $111,000 | 2018-07-16 Series A $14,999,948 |
| Iterative Health | Clinical Data Managers (15-2051.02) | $112,590 (2024) | 3.738 | $95,000 | 2021-12-06 Series D+ $149,999,978 |
| Klaviyo Inc | Business Intelligence Analysts (15-2051.01) | $112,590 (2024) | 3.903 | $126,000 | 2022-07-26 Series C $99,999,983 |

## What this run could not check

- Whether a company *missing* from the 80 Days CSV, or listed with a blank H-1B record, sponsors. Blank is not "no": it can be a name the join missed.
- Whether the employer will sponsor *this* role now, or will register you in the next H-1B lottery. History is not a promise, and a posting that is silent on sponsorship has not promised it.
- Real hiring speed. Every hiring lag is your own assumption; no dataset here measures time-to-hire. How long a posting has been open is not how long hiring takes.
- That the H-1B approval counts are exact. Every count in the CSV is even, which suggests the join double-counts; rates are unaffected, raw counts may be 2x.
- Postings not on Greenhouse: no API record, no posting-text check, and the browser liveness check is the only evidence.
- Cap-gap, STEM-extension eligibility, or whether part-time / volunteer work stops your unemployment clock. Ask your DSO.

## Your sign-off (gate G4)

Before acting on an Apply or Consider row, open the posting yourself and confirm: it is the job described, it is in your target occupation, the hiring-lag assumption is reasonable, and the years of experience it asks for are within reach. Record your decision in the run log.

- [ ] Abacus Insights Inc — Forward Deployed Data Engineer (US): posting opened and matches · lag assumption OK · years within reach (posting asks 7+ years; you have 1) · decision: ______

## Run record

| Input | Path |
|---|---|
| persona | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21/persona.json` |
| candidates | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21/candidates.json` |
| liveness | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21/liveness.txt` |
| greenhouse-api | `(not used in live mode: undated)` |
| sponsors-csv | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` |
| soc-csv | `data/bls/compact/soc_occupation_compact.csv` |
| out-dir | `assignments/submissions/salonimathure20/runs/live-2026-10-21/out` |
| posting-evidence | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21/posting-evidence.json` |
| aliases | `scripts/contrib/2026fa/salonimathure20-opt-countdown/aliases.json` |

Recipe: `recipes/cases/2026fa/salonimathure20-opt-countdown.md` v0.2.0 · live mode · run at 2026-10-21T19:13:59.779Z. Machine log: `opt-countdown-log.json` in the same folder.
