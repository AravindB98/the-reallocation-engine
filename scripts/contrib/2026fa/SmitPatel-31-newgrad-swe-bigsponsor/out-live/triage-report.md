# New-grad SWE triage at big H-1B sponsors — run report

## Executive summary

This report checks 4 job postings against public H-1B sponsorship records and your OPT dates, and says which are worth your time. **0 apply, 2 to network into first, 1 skip, and 1 that a person has to look at** because the data could not answer them. Your deadline to start work is **2027-04-11** (OPT start plus 90 unemployment days, from dates you entered). A role that starts later than that is skipped however strong the company is. "Sponsors a lot of H-1Bs" is not the same as "sponsors new-grad software engineers", so each company is judged by the job titles it actually sponsored. Many large sponsors are not in this dataset at all, and "not found" never means "does not sponsor".

## Decisions

| Company | Role | Decision | Why | Next action |
|---|---|---|---|---|
| PINTEREST INC | University Grad Software Engineer 2027 (USA) | **Skip** (0) | sponsorship Proven (entry-explicit); timeline 1 — start 2027-01-11 is inside [2027-01-11, 2027-03-28] (**start date ESTIMATED** — estimated: max(today + 45d hiring lag, OPT start); confirm with recruiter); liveness 0 [record] | Skip |
| STRIPE INC | Software Engineer, New Grad | **Consider** (0.42) | sponsorship Likely (unlevelled-swe); timeline 1 — start 2027-01-11 is inside [2027-01-11, 2027-03-28] (**start date ESTIMATED** — estimated: max(today + 45d hiring lag, OPT start); confirm with recruiter); liveness 1 [record] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| STRIPE INC | Software Engineer, Early Career — Immediate Start | **Consider** (0.42) | sponsorship Likely (unlevelled-swe); timeline 1 — start 2027-01-11 is inside [2027-01-11, 2027-03-28] (**start date ESTIMATED** — estimated: max(today + 45d hiring lag, OPT start); confirm with recruiter); liveness 1 [record] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |

## Needs a person (not scored — no value was invented)

| Company (as typed) | Role | Gate | Reason | What to do |
|---|---|---|---|---|
| STRIPE INC | (break test: non-existent job id) | G2 liveness | liveness-unknown-status | `npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/1000000001` |

## Sponsored-title evidence (read this before trusting a tier)

- **PINTEREST INC** — 1364 approvals, 16 denials [record]. Titles: Software Engineer → unlevelled; Software Engineer II → mid; Software Engineer I → entry; Senior Software Engineer → senior; Senior Data Analyst → non-swe [classification = keyword rule v0.1, your-input]
- **STRIPE INC** — 1250 approvals, 22 denials [record]. Titles: Software Engineer → unlevelled; Backend Engineer → unlevelled; Risk Strategist → non-swe; Product Manager → non-swe; Engineering Manager → non-swe [classification = keyword rule v0.1, your-input]
- **STRIPE INC** — 1250 approvals, 22 denials [record]. Titles: Software Engineer → unlevelled; Backend Engineer → unlevelled; Risk Strategist → non-swe; Product Manager → non-swe; Engineering Manager → non-swe [classification = keyword rule v0.1, your-input]

## Pay context (not part of the score)

National median for Software Developers (15-1252), OEWS 2024: $133,080 [record]. The company medians below cover **all** the roles each company sponsored, not entry-level SWE, so they overstate new-grad pay at senior-heavy companies.

- PINTEREST INC: $156,853 median sponsored salary [record]
- STRIPE INC: $158,371 median sponsored salary [record]
- STRIPE INC: $158,371 median sponsored salary [record]

## What this run could not check

- Whether a company sponsors new-grad SWEs *this year*. The title list is historical and shows only top titles, with no counts.
- Companies that are not in the dataset (for example several of the largest tech sponsors).
- Whether a posting is live, unless the liveness source says `record` (from `npm run ats:liveness` with a date).
- Start dates that were estimated from your hiring-lag assumption. Confirm them with the recruiter.
- The OPT rules themselves. Confirm the dates and the unemployment limit with your DSO.

## Run record

- Run date: 2026-10-17 · mode: sample · persona: kiran-rao-example
- persona: `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-dec-grad.json`
- postings: `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/postings-live-2026-10-17.json`
- csv: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- bls: `data/bls/compact/soc_occupation_compact.csv`
- scorer: `scripts/score/role-scorer.mjs`
- Scorer: `✓ scored 3 roles → Apply 0 · Consider 2 · Skip 1 (skip 33%)`
- Agent log: `triage-log.json`
