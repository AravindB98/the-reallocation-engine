# OPT countdown report — ananya-rao-example — as of 2026-10-03

## Executive summary

This report checks 8 job postings against one question first: can this employer hire you before your clock runs out? You have **53 days** of search time left (a job should start by **2026-11-25**); the tighter limit is your remaining OPT unemployment days, after your safety buffer. Of the 6 postings with complete evidence, 1 is worth applying to now, 2 worth a networking conversation first, and 3 should be skipped. 2 more could not be scored because a fact was missing; those need a person to check before anything else happens. Nothing here is final: you decide every row (see "Your sign-off" at the end).

## Your clock

| Item | Value | Label |
|---|---|---|
| As of | 2026-10-03 | your-input |
| OPT end date | 2027-06-30 (270 days away) | your-input |
| Unemployment days used / allowed / buffer | 27 / 90 / 10 | your-input |
| Search runway | **53 days** (bound by unemployment-clock) | script arithmetic on your-input |

## Decisions and next actions

| Role | Decision | Why | Next action (3-3-2 block) |
|---|---|---|---|
| Formlabs Inc — Business Systems Analyst (Somerville, MA) | **Apply** (0.3173) | composite 0.317 ≥ 0.3, gates healthy | Tailor and submit this week; ask one contact for a referral first · 2 (apply) + 3 (network) h |
| PathAI Inc — Senior Software Engineer, Fullstack (Boston, hybrid) | **Consider** (0.2825) | composite 0.282 in the Consider band [0.2, 0.3) | Informational chat with someone on the team before applying · 3 (network) h |
| Iterative Health — Clinical Data Specialist (NYC, BOS or Dallas) | **Consider** (0.2943) | composite 0.294 in the Consider band [0.2, 0.3) | Informational chat with someone on the team before applying · 3 (network) h |
| Klaviyo Inc — Full Stack Software Engineer - People Systems (Boston) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts · 3 (network) h |
| Toast Inc — Principal Software Engineer, Tech Lead (Remote US) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts · 3 (network) h |
| DraftKings Inc — Data Analyst (Boston) | **Blocked** | sponsorship: no-h1b-record-joined; liveness: liveness-unchecked | Resolve before scoring: sponsorship: no-h1b-record-joined, liveness: liveness-unchecked · 2 (research) h |
| HubSpot Inc — Data Analyst (Cambridge, MA) | **Blocked** | sponsorship: no-company-row; liveness: liveness-unchecked | Resolve before scoring: sponsorship: no-company-row, liveness: liveness-unchecked · 2 (research) h |
| Klaviyo Inc — Data Analyst (link copied from a job aggregator) | **Skip** (0) | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Dead or ghost posting: do not apply · 0 h |

Skip rate among scored roles: 50% (a healthy run skips at least half).

## Verified vs. inferred, per role

| Role | Sponsorship | Fit | Liveness | Timeline | Flags |
|---|---|---|---|---|---|
| Klaviyo Inc — Full Stack Software Engineer - People Systems (Boston) | 0.975 Proven [record: 154 approvals, 97.47%] | 0.7 [model-judgment] | 1 [record: greenhouse-api 200; checker active] | 0 [your-input: lag 60 d, slack -7 d] | — |
| PathAI Inc — Senior Software Engineer, Fullstack (Boston, hybrid) | 0.975 Proven [record: 78 approvals, 97.5%] | 0.35 [model-judgment] | 1 [record: greenhouse-api 200; checker active] | 0.633 [your-input: lag 45 d, slack 8 d] | — |
| Toast Inc — Principal Software Engineer, Tech Lead (Remote US) | 0.974 Proven [record: 150 approvals, 97.4%] | 0.15 [model-judgment] | 1 [record: greenhouse-api 200; checker active] | 0 [your-input: lag 60 d, slack -7 d] | — |
| Formlabs Inc — Business Systems Analyst (Somerville, MA) | 0.875 Proven [record: 70 approvals, 87.5%] | 0.65 [model-judgment] | 1 [record: greenhouse-api 200; checker uncertain] | 0.633 [your-input: lag 45 d, slack 8 d] | checker said "uncertain", Greenhouse API said 200 |
| Iterative Health — Clinical Data Specialist (NYC, BOS or Dallas) | 0.9 Proven [record: 18 approvals, 100%] | 0.5 [model-judgment] | 1 [record: greenhouse-api 200; checker active] | 0.633 [your-input: lag 45 d, slack 8 d] | name alias "ITERATIVE SCOPES INC" asserted by your-input |
| Klaviyo Inc — Data Analyst (link copied from a job aggregator) | 0.975 Proven [record: 154 approvals, 97.47%] | 0.75 [model-judgment] | 0 [record: greenhouse-api 404; checker active] | 0 [your-input: lag 60 d, slack -7 d] | checker said "active", Greenhouse API said 404 |
| DraftKings Inc — Data Analyst (Boston) | missing: no-h1b-record-joined | 0.7 [model-judgment] | missing: liveness-unchecked | 0 [your-input: lag 60 d, slack -7 d] | — |
| HubSpot Inc — Data Analyst (Cambridge, MA) | missing: no-company-row | 0.7 [model-judgment] | missing: liveness-unchecked | 0 [your-input: lag 60 d, slack -7 d] | — |

## Context the score does not use

Role quality carries weight 0 in the shared scorer and funding has no scorer term at all, so these are shown for your judgment only. National medians are not what this employer or your metro pays.

| Role | Occupation (SOC) | National median wage [record, BLS OEWS] | Cognitive pivot score [record] | H-1B median salary offered [record, 80 Days] | Latest funding [record, 80 Days] |
|---|---|---|---|---|---|
| Klaviyo Inc | Software Developers (15-1252.00) | $133,080 (2024) | 3.834 | $126,000 | 2022-07-26 Series C $99,999,983 |
| PathAI Inc | Software Developers (15-1252.00) | $133,080 (2024) | 3.834 | $145,600 | 2019-04-09 Series C $60,004,900 |
| Toast Inc | Software Developers (15-1252.00) | $133,080 (2024) | 3.834 | $177,341 | 2015-12-23 Series B $23,200,000 |
| Formlabs Inc | Computer Systems Analysts (15-1211.00) | $103,790 (2024) | 4.024 | $111,000 | 2018-07-16 Series A $14,999,948 |
| Iterative Health | Clinical Data Managers (15-2051.02) | $112,590 (2024) | 3.738 | $95,000 | 2021-12-06 Series D+ $149,999,978 |
| Klaviyo Inc | Data Scientists (15-2051.00) | $112,590 (2024) | missing in table | $126,000 | 2022-07-26 Series C $99,999,983 |
| DraftKings Inc | Business Intelligence Analysts (15-2051.01) | $112,590 (2024) | 3.903 | — | 2024-12-03 Series D+ $155,000,000 |
| HubSpot Inc | Business Intelligence Analysts (15-2051.01) | $112,590 (2024) | 3.903 | — | no-company-row |

## What this run could not check

- Whether a company *missing* from the 80 Days CSV, or listed with a blank H-1B record, sponsors. Blank is not "no": it can be a name the join missed.
- Whether the employer will sponsor *this* role now, or will register you in the next H-1B lottery. History is not a promise.
- Real hiring speed. Every hiring lag is your own assumption; no dataset here measures time-to-hire.
- That the H-1B approval counts are exact. Every count in the CSV is even, which suggests the join double-counts; rates are unaffected, raw counts may be 2x.
- Cap-gap, STEM-extension eligibility, or whether part-time / volunteer work stops your unemployment clock. Ask your DSO.

## Your sign-off (gate G4)

Before acting on an Apply or Consider row, open the posting yourself and confirm: it is the job described, it is in your target occupation, and the hiring-lag assumption is reasonable. Record your decision in the run log.

- [ ] PathAI Inc — Senior Software Engineer, Fullstack (Boston, hybrid): posting opened and matches · lag assumption OK · decision: ______
- [ ] Formlabs Inc — Business Systems Analyst (Somerville, MA): posting opened and matches · lag assumption OK · decision: ______
- [ ] Iterative Health — Clinical Data Specialist (NYC, BOS or Dallas): posting opened and matches · lag assumption OK · decision: ______

## Run record

| Input | Path |
|---|---|
| persona | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/persona.json` |
| candidates | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/candidates.json` |
| liveness | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/liveness.txt` |
| greenhouse-api | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/greenhouse-api.txt` |
| sponsors-csv | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` |
| soc-csv | `data/bls/compact/soc_occupation_compact.csv` |
| out-dir | `course/2026fa/submissions/salonimathure20/runs/opt-countdown` |

Recipe: `recipes/cases/2026fa/salonimathure20-opt-countdown.md` v0.1.0 · sample mode · run at 2026-10-04T01:37:19.795Z. Machine log: `opt-countdown-log.json` in the same folder.
