# Which software jobs are worth your next two hours — 2026-10-02

## Executive summary

**What this is.** A check of 12 software engineering jobs against public sponsorship and funding records, each job's posting, and your visa clock. It's written for a new-grad software engineer on OPT who is currently between jobs.

**Why read it.** Your 90-day unemployment allowance runs out on **2026-11-20**, much sooner than your OPT end date (2027-06-14). Every application has to fit inside that window. This report tells you where to spend your time and why, and shows where each number came from.

**What it found.** 8 of 12 jobs had enough evidence to score: **2 Apply, 3 Consider, 3 Skip**. The other 4 need you first: a company the records can't find, a posting nobody has checked recently, or a company with no sponsorship record either way. No AI model was asked anything. Your fit ratings are your own numbers, and every other value comes from a file in the repository. The sponsorship records show what a company *did* in the past, not what it will do for you now. Ask before you rely on them.

> **Skip rate 38% of scored roles, below the ~50% a healthy run skips.** This list was hand-picked from companies already known to sponsor, so it is biased toward sponsors. Treat that as a property of the input, not good news.

## Your clock (check these against your I-20 / EAD / DSO record first)

| | |
|---|---|
| Run date | 2026-10-02 |
| OPT (EAD) end | 2027-06-14 [your-input] |
| Unemployment days used | 41 as of 2026-10-02 → **41 projected to today** of 90 [your-input, projected] |
| Days left | **49** → allowance runs out **2026-11-20** |
| Hard deadline (must start by) | **2026-11-20** (binding: unemployment-ceiling) |
| Your buffer | 15 days → aim to start by **2026-11-05** |

A start date after the hard deadline scores 0 on timeline: Skip, whatever else is true. Anything legal (STEM extension, what counts as employment) goes to your DSO. This report doesn't decide it.

## Decisions

| Job | Decision | Why | What to do next |
|---|---|---|---|
| Tulip Interfaces: Software Engineer | **Apply** (0.51) | composite 0.510 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| Cohere Health: Software Engineer I, Backend | **Apply** (0.4898) | composite 0.490 ≥ 0.3, gates healthy | Apply (2-hour block): Tailor and apply. In the first recruiter call, ask whether this team sponsors new-grad SWE H-1B registrations: the record shows past behaviour, not current intent. |
| Lookout: Software Engineer, Backend | **Consider** (0.42) | above threshold (0.420) but one soft spot: sponsorship tier "Likely" | Network (3-hour block): Network before applying: one conversation with an engineer at Lookout about whether they sponsor new-grad SWEs. |
| Zakipoint Health: Full Stack Developer | **Consider** (0.39) | above threshold (0.390) but one soft spot: sponsorship tier "Likely" | Network (3-hour block): Network before applying: one conversation with an engineer at Zakipoint Health about whether they sponsor new-grad SWEs. |
| Vecna Robotics: Software Engineer, Fleet Management | **Consider** (0.255) | composite 0.255 in the Consider band [0.2, 0.3) | Network (3-hour block): Network before applying: one conversation with an engineer at Vecna Robotics about whether they sponsor new-grad SWEs. |
| Lendbuzz: Full Stack Engineer | **Skip** (0) | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Network (3-hour block): Posting is dead but Lendbuzz has a Proven sponsorship record. Ask for an informational chat and watch the board for a reopen. Do not apply to this posting. |
| CloudZero: Backend Engineer | **Not scored** | unknown-sponsorship | Network (3-hour block): No sponsorship record either way. Ask an engineer or the recruiter directly before applying. |
| Abacus Insights: Software Engineer, Data Platform | **Not scored** | liveness-no_apply_control | You, now (≤5 min): Open the posting yourself (≤5 min). Re-capture a dated snapshot and re-run before spending any application time. |
| HubSpot: Associate Software Engineer | **Not scored** | unresolved-company | You, now (≤5 min): Find the company's legal entity name and re-run. If it never filed a Form D it is not in this dataset at all; absence is not a "no". |
| Nextuple: Software Engineer | **Not scored** | liveness-snapshot-stale | You, now (≤5 min): Open the posting yourself (≤5 min). Re-capture a dated snapshot and re-run before spending any application time. |
| Nodar: Perception Software Engineer (New Grad) | **Skip** (0.1611) | composite 0.161 < 0.2 — time is better spent elsewhere | Drop: Evidence too thin for the 2-hour block. Drop. |
| Klaviyo: Software Engineer I (New Grad) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | Drop: Expected start 2027-01-30 is after your hard deadline 2026-11-20. Drop now; revisit only if the recruiter commits in writing to a start before 2026-11-05. |

## Where each number came from (verified vs. inferred)

Labels: **[record]** = read from a data file in the repo · **[your-input]** = a number you (or this fictional persona) supplied, or a rule this recipe chose · **[model-judgment]** = none in this run.

### Cohere Health: Software Engineer I, Backend

- Company match: CSV row "COHERE HEALTH INC" by exact normalized name [record]
- H-1B history: 104 approvals, 2 denials, 98.1% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Engineering Manager", "Senior Software Engineer, Platform", "Senior Machine Learning DevOps Engineer", "Software Engineer II", "Machine Learning Engineer" [record]. SWE-matching: "Senior Software Engineer, Platform", "Software Engineer II" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Proven** → p = 0.9: 104 approvals, 98.1% approved, non-senior SWE title on record: "Software Engineer II" [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-10-01, 1 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-11-06 (run date + 35 d) vs safe 2026-11-05 / hard 2026-11-20 → 0.933 [your-input: your dates + time-to-start "assumed: Series C startup, ~3 interview rounds over 4 weeks + 1 week to start"]
- Fit: 0.7 [your-input: backend Python services match my projects]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $160,000 vs national 15-1252 median $133,080 = 1.20× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2025-05-07 (Series C, $89,999,876), 513 d before the run; in shipped Form D samples: no [record]
- Decision: Apply, composite 0.4898 [scorer output; arithmetic in role-scores.md]

### Klaviyo: Software Engineer I (New Grad)

- Company match: CSV row "KLAVIYO INC" by exact normalized name [record]
- H-1B history: 154 approvals, 4 denials, 97.5% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Business Intelligence Engineer", "Software Engineer II", "Engineering Manager Data Exchange", "Engineering Manager II- SMS", "Senior Software Engineer" [record]. SWE-matching: "Software Engineer II", "Senior Software Engineer" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Proven** → p = 0.9: 154 approvals, 97.5% approved, non-senior SWE title on record: "Software Engineer II" [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-10-01, 1 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2027-01-30 (run date + 120 d) vs safe 2026-11-05 / hard 2026-11-20 → 0 [your-input: your dates + time-to-start "assumed: large public-company new-grad cycle, ~4 months from application to start"]
- Fit: 0.75 [your-input: strong stack match]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $126,000 vs national 15-1252 median $133,080 = 0.95× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2022-07-26 (Series C, $99,999,983), 1529 d before the run; in shipped Form D samples: no [record]
- Decision: Skip, composite 0 [scorer output; arithmetic in role-scores.md]

### Lendbuzz: Full Stack Engineer

- Company match: CSV row "LENDBUZZ INC" by exact normalized name [record]
- H-1B history: 60 approvals, 0 denials, 100.0% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Full Stack Engineer", "Senior Software Engineer", "Machine Learning Engineer", "Software Engineer" [record]. SWE-matching: "Full Stack Engineer", "Senior Software Engineer", "Software Engineer" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Proven** → p = 0.9: 60 approvals, 100.0% approved, non-senior SWE title on record: "Full Stack Engineer" [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: expired (http_gone) from a fixture snapshot captured 2026-10-01, 1 d before the run → liveness factor 0 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-11-11 (run date + 40 d) vs safe 2026-11-05 / hard 2026-11-20 → 0.6 [your-input: your dates + time-to-start "assumed: Series C startup, ~5-6 weeks"]
- Fit: 0.65 [your-input: full-stack; my frontend is weaker]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $125,000 vs national 15-1252 median $133,080 = 0.94× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2021-05-13 (Series C, $54,745,817), 1968 d before the run; in shipped Form D samples: no [record]
- Decision: Skip, composite 0 [scorer output; arithmetic in role-scores.md]

### Abacus Insights: Software Engineer, Data Platform

- Company match: CSV row "ABACUS INSIGHTS INC" by exact normalized name [record]
- H-1B history: 22 approvals, 0 denials, 100.0% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Software Engineer", "Business Analyst Manager - Data Distribution Team" [record]. SWE-matching: "Software Engineer" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Proven** → p = 0.9: 22 approvals, 100.0% approved, non-senior SWE title on record: "Software Engineer" [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: uncertain (no_apply_control) from a fixture snapshot captured 2026-09-30, 2 d before the run → **held** [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-11-06 (run date + 35 d) vs safe 2026-11-05 / hard 2026-11-20 → 0.933 [your-input: your dates + time-to-start "assumed: Series A, ~5 weeks"]
- Fit: 0.6 [your-input: data-platform leaning]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $110,510 vs national 15-1252 median $133,080 = 0.83× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2024-10-01 (Series A, $11,742,458), 731 d before the run; in shipped Form D samples: no [record]

### Nodar: Perception Software Engineer (New Grad)

- Company match: CSV row "NODAR INC" by exact normalized name [record]
- H-1B history: 2 approvals, 0 denials, 100.0% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Perception Software Engineer" [record]. SWE-matching: "Perception Software Engineer" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Likely** → p = 0.6: only 2 approvals (< 10) [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-09-30, 2 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-11-13 (run date + 42 d) vs safe 2026-11-05 / hard 2026-11-20 → 0.467 [your-input: your dates + time-to-start "assumed: small robotics startup, ~6 weeks"]
- Fit: 0.45 [your-input: C++/perception: partial match]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $155,000 vs national 15-1252 median $133,080 = 1.16× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2022-04-05 (Series A, $11,999,921), 1641 d before the run; in shipped Form D samples: no [record]
- Decision: Skip, composite 0.1611 [scorer output; arithmetic in role-scores.md]

### Lookout: Software Engineer, Backend

- Company match: CSV row "LOOKOUT INC" by exact normalized name [record]
- H-1B history: 38 approvals, 0 denials, 100.0% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Staff Software Engineer", "Senior Software Engineer" [record]. SWE-matching: "Staff Software Engineer", "Senior Software Engineer" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Likely** → p = 0.6: every SWE title on record is senior (Staff Software Engineer; Senior Software Engineer): weak evidence for a new grad [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-10-01, 1 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-10-30 (run date + 28 d) vs safe 2026-11-05 / hard 2026-11-20 → 1 [your-input: your dates + time-to-start "recruiter (fictional) said 2 rounds then start in ~4 weeks"]
- Fit: 0.7 [your-input: backend Go: good match]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $169,678 vs national 15-1252 median $133,080 = 1.28× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2021-03-15 (Series B, $46,771,430), 2027 d before the run; in shipped Form D samples: no [record]
- Decision: Consider, composite 0.42 [scorer output; arithmetic in role-scores.md]

### Zakipoint Health: Full Stack Developer

- Company match: CSV row "ZAKIPOINT HEALTH INC" by exact normalized name [record]
- H-1B history: 14 approvals, 2 denials, 87.5% approved [record; fiscal years not in the file]
- Sponsored titles on record: "FULL STACK SOFTWARE DEVELOPER", "Market Research Analyst" [record]. SWE-matching: "FULL STACK SOFTWARE DEVELOPER" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Likely** → p = 0.6: approval rate 87.5% (< 90%) [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-09-30, 2 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-11-01 (run date + 30 d) vs safe 2026-11-05 / hard 2026-11-20 → 1 [your-input: your dates + time-to-start "assumed: early-stage, ~4 weeks"]
- Fit: 0.6 [your-input: full-stack; health-data domain is new to me]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $87,091 vs national 15-1252 median $133,080 = 0.65× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2023-08-29 (Pre-Seed, $1,892,417), 1130 d before the run; in shipped Form D samples: no [record]
- Decision: Consider, composite 0.39 [scorer output; arithmetic in role-scores.md]

### Vecna Robotics: Software Engineer, Fleet Management

- Company match: CSV row "VECNA ROBOTICS INC" by exact normalized name [record]
- H-1B history: 8 approvals, 4 denials, 66.7% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Test Engineer", "Industry Solutions Design Engineer" [record]. SWE-matching: none [title rule = your-input; not an SOC code]
- Sponsorship tier: **Possible** → p = 0.3: approvals 8 < 2 or approval rate 66.7% < 75% [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-10-01, 1 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-11-01 (run date + 30 d) vs safe 2026-11-05 / hard 2026-11-20 → 1 [your-input: your dates + time-to-start "assumed: ~4 weeks"]
- Fit: 0.5 [your-input: robotics fleet software: partial match]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $83,520 vs national 15-1252 median $133,080 = 0.63× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2021-12-22 (Series C, $74,999,953), 1745 d before the run; in shipped Form D samples: no [record]
- Decision: Consider, composite 0.255 [scorer output; arithmetic in role-scores.md]

### CloudZero: Backend Engineer

- Company match: CSV row "CLOUDZERO INC" by exact normalized name [record]
- H-1B history: **empty in the file** [record]. That means no trace, not "does not sponsor".
- Sponsorship tier: **Unknown**: H-1B fields are empty: no trace in this dataset, which is not evidence of non-sponsorship [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-10-01, 1 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-11-06 (run date + 35 d) vs safe 2026-11-05 / hard 2026-11-20 → 0.933 [your-input: your dates + time-to-start "assumed: Series C startup, ~5 weeks"]
- Fit: 0.7 [your-input: cloud cost backend: good match]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Funding (report-only, not a vote): latest round on record 2025-02-05 (Series C, $49,999,994), 604 d before the run; in shipped Form D samples: no [record]

### HubSpot: Associate Software Engineer

- Company match: **none** (no row whose normalized company_name equals "hubspotinc"). No sponsorship or funding value exists for this job.
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-10-01, 1 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-12-01 (run date + 60 d) vs safe 2026-11-05 / hard 2026-11-20 → 0 [your-input: your dates + time-to-start "assumed: public company, ~2 months"]
- Fit: 0.75 [your-input: strong match]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]

### Tulip Interfaces: Software Engineer

- Company match: CSV row "TULIP INTERFACES INC" by exact normalized name [record]
- H-1B history: 18 approvals, 0 denials, 100.0% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Software Engineer" [record]. SWE-matching: "Software Engineer" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Proven** → p = 0.9: 18 approvals, 100.0% approved, non-senior SWE title on record: "Software Engineer" [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-10-01, 1 d before the run → liveness factor 1 [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-10-23 (run date + 21 d) vs safe 2026-11-05 / hard 2026-11-20 → 1 [your-input: your dates + time-to-start "recruiter (fictional) said they can start a new grad in 3 weeks"]
- Fit: 0.65 [your-input: general SWE]
- Role quality: **missing: no-soc-row** (no row for SOC "15-1132" in the compact BLS table (2018 SOC); no crosswalk is guessed)
- Funding (report-only, not a vote): latest round on record 2021-07-19 (Series C, $99,999,935), 1901 d before the run; in shipped Form D samples: no [record]
- Decision: Apply, composite 0.51 [scorer output; arithmetic in role-scores.md]

### Nextuple: Software Engineer

- Company match: CSV row "NEXTUPLE INC" by exact normalized name [record]
- H-1B history: 18 approvals, 0 denials, 100.0% approved [record; fiscal years not in the file]
- Sponsored titles on record: "Software Engineer" [record]. SWE-matching: "Software Engineer" [title rule = your-input; not an SOC code]
- Sponsorship tier: **Proven** → p = 0.9: 18 approvals, 100.0% approved, non-senior SWE title on record: "Software Engineer" [tier inputs = record; thresholds and tier→p table = your-input]
- Posting: active (apply_control_visible) from a fixture snapshot captured 2026-09-10, 22 d before the run → **held** [your-input: sample-mode snapshot, not a fetched page]
- Timeline: start 2026-11-01 (run date + 30 d) vs safe 2026-11-05 / hard 2026-11-20 → 1 [your-input: your dates + time-to-start "assumed: ~4 weeks"]
- Fit: 0.6 [your-input: general SWE]
- Role quality (report-only, weight 0 in the score): SOC 15-1252 Software Developers, national median $133,080 (OEWS 2024), job zone 4 [record]
- Pay check (report-only): median salary across *all* this company's sponsored titles $87,200 vs national 15-1252 median $133,080 = 0.66× [both record; ratio computed]
- Funding (report-only, not a vote): latest round on record 2021-12-07 (Pre-Seed, $2,000,000), 1760 d before the run; in shipped Form D samples: no [record]

## What this run cannot tell you

- **Whether a company will sponsor *you*, now, for *this* job.** The records are past approvals with no fiscal year attached. A sponsor can freeze sponsorship next month.
- **Whether a title on record was really coded as SOC 15-1252.** The sponsor file lists job titles, not SOC codes. "Software engineer" matching is a text rule.
- **Whether any posting is live today.** Sample mode reads saved snapshots written for this exercise. No page was fetched.
- **Whether the company is enrolled in E-Verify** (needed before you can file a STEM extension with them). No such data is in the repo.
- **Whether a company raised money recently.** The newest funding date in the sponsor file is 2025-09-26, and the shipped Form D samples matched 0 of these companies.
- **Immigration law.** The clock above is planning arithmetic. Your DSO rules on what counts as unemployment.

## Run record

- Recipe: `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md` v0.1.0 · mode: sample · run id `swe-opt-clock-2026-10-02`
- Prototype: `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02`
- Scorer: `node scripts/score/role-scorer.mjs course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/roles.json --out-dir course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02`: ✓ scored 8 roles → Apply 2 · Consider 3 · Skip 3 (skip 38%)
- Gates: G0 pass · G4 pass · per-role G1–G3 in `course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/run-log.json`
- Inputs (sha256): persona `search/examples/neel-kapoor/profile.yml` `8f55710f2ad7…` · roles `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/fixtures/sample-roles.json` `350ba68a5f81…` · sponsors_csv `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` `eccdee2addf4…` · soc_csv `data/bls/compact/soc_occupation_compact.csv` `bac5acf77ca2…` · scorer `scripts/score/role-scorer.mjs` `8655e182c3c2…` · form_d:companies-sec-2025q2-d.sample.json `data/sec/form-d/processed/sample/companies-sec-2025q2-d.sample.json` `6b24543c0628…` · form_d:companies-sec-2025q3-d.sample.json `data/sec/form-d/processed/sample/companies-sec-2025q3-d.sample.json` `a1bdd1ebad49…` · form_d:companies-sec-2025q4-d.sample.json `data/sec/form-d/processed/sample/companies-sec-2025q4-d.sample.json` `b92e0aa223c7…` · form_d:companies-sec-2026q1-d.sample.json `data/sec/form-d/processed/sample/companies-sec-2026q1-d.sample.json` `f3fbe3f70970…`
- Human sign-off: `course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/gate-decisions.md` (unsigned until you fill it in)
