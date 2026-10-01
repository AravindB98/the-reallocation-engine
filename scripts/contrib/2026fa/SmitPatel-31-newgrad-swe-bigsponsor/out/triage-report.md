# New-grad SWE triage at big H-1B sponsors — run report

## Executive summary

This report checks 12 job postings against public H-1B sponsorship records and your OPT dates, and says which are worth your time. **1 apply, 4 to network into first, 3 skip, and 4 that a person has to look at** because the data could not answer them. Your deadline to start work is **2027-04-11** (OPT start plus 90 unemployment days, from dates you entered). A role that starts later than that is skipped however strong the company is. "Sponsors a lot of H-1Bs" is not the same as "sponsors new-grad software engineers", so each company is judged by the job titles it actually sponsored. Many large sponsors are not in this dataset at all, and "not found" never means "does not sponsor".

## Decisions

| Company | Role | Decision | Why | Next action |
|---|---|---|---|---|
| MICROSOFT CORP | Software Engineer (new grad) | **Consider** (0.42) | sponsorship Likely (unlevelled-swe); timeline 1 — start 2027-01-11 is inside [2027-01-11, 2027-03-28] (**start date ESTIMATED** — estimated: max(today + 45d hiring lag, OPT start); confirm with recruiter); liveness 1 [your-input] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| PINTEREST INC | Software Engineer I | **Apply** (0.525) | sponsorship Proven (entry-explicit); timeline 1 — start 2027-02-16 is inside [2027-01-11, 2027-03-28]; liveness 1 [your-input] | Tailor the résumé and apply (2h research/apply block) |
| DATABRICKS INC | Software Engineer - New Grad (2027) | **Skip** (0) | sponsorship Likely (unlevelled-swe); timeline 0 — start 2027-07-12 is after the unemployment deadline 2027-04-11; liveness 1 [your-input] | Network, don't apply yet: ask about an earlier or off-cycle start date |
| LINKEDIN CORP | Software Engineer, Associate | **Consider** (0.42) | sponsorship Likely (unlevelled-swe); timeline 1 — start 2027-03-01 is inside [2027-01-11, 2027-03-28]; liveness 1 [your-input] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| UBER TECHNOLOGIES INC | Software Engineer I | **Skip** (0) | sponsorship Likely (unlevelled-swe); timeline 0 — start 2027-06-21 is after the unemployment deadline 2027-04-11; liveness 1 [your-input] | Network, don't apply yet: ask about an earlier or off-cycle start date |
| STRIPE INC | Software Engineer, New Grad | **Consider** (0.21) | sponsorship Likely (unlevelled-swe); timeline 0.5 — start 2027-04-05 is within the 14-day buffer before 2027-04-11; liveness 1 [your-input] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| DELOITTE CONSULTING LLP | Software Engineer Analyst | **Consider** (0.2325) | sponsorship Unknown (no-swe-title); timeline 1 — start 2027-02-01 is inside [2027-01-11, 2027-03-28]; liveness 1 [your-input] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| VIRTUSA CORP | Java Engineer | **Skip** (0) | sponsorship Unknown (no-swe-title); timeline 1 — start 2027-02-01 is inside [2027-01-11, 2027-03-28]; liveness 0 [your-input] | Skip |

## Needs a person (not scored — no value was invented)

| Company (as typed) | Role | Gate | Reason | What to do |
|---|---|---|---|---|
| Google | Software Engineer, Early Career | G1 company-match | no-company-match | Not in this dataset (built from SEC Form D filers). Find the exact legal name, or treat sponsorship as Unknown and check another source |
| Salesforce.com, Inc. | Associate Software Engineer | G1 company-match | ambiguous-company-match (SALESFORCE COM INC, SALESFORCECOM INC) | Several rows match; pick the right entity by hand |
| SNOWFLAKE INC | Software Engineer - University Grad | G2 liveness | liveness-unchecked | `npm run ats:liveness -- https://example.com/fixture/p11` |
| Meta Platforms | Software Engineer, University Grad | G1 company-match | no-company-match | Not in this dataset (built from SEC Form D filers). Find the exact legal name, or treat sponsorship as Unknown and check another source |

## Sponsored-title evidence (read this before trusting a tier)

- **MICROSOFT CORP** — 12226 approvals, 428 denials [record]. Titles: Software Engineer → unlevelled; Product Manager → non-swe; Technical Program Manager → non-swe; Applied Sciences → non-swe; Data Science → non-swe [classification = keyword rule v0.1, your-input]
- **PINTEREST INC** — 1364 approvals, 16 denials [record]. Titles: Software Engineer → unlevelled; Software Engineer II → mid; Software Engineer I → entry; Senior Software Engineer → senior; Senior Data Analyst → non-swe [classification = keyword rule v0.1, your-input]
- **DATABRICKS INC** — 1640 approvals, 8 denials [record]. Titles: Software Engineer → unlevelled; Senior Software Engineer → senior; Solutions Architect → non-swe; Specialist Solutions Architect → non-swe; Senior Solutions Engineer → non-swe [classification = keyword rule v0.1, your-input]
- **LINKEDIN CORP** — 4962 approvals, 28 denials [record]. Titles: Sr Software Engineer → senior; Staff Software Engineer → senior; Sr. Software Engineer, Systems Infrastructure → senior; Sr Data Scientist → non-swe; Software Engineer → unlevelled; Sr Software Engineer → senior; Staff Software Engineer → senior; Staff Software Engineer, Systems Infrastructure → senior; Associate Product Manager → non-swe; Sr. Software Engineer, Machine Learning → senior [classification = keyword rule v0.1, your-input]
- **UBER TECHNOLOGIES INC** — 3984 approvals, 42 denials [record]. Titles: Senior Software Engineer → senior; Staff Software Engineer → senior; Software Engineer II → mid; Software Engineer → unlevelled; SOFTWARE ENGINEER → unlevelled [classification = keyword rule v0.1, your-input]
- **STRIPE INC** — 1250 approvals, 22 denials [record]. Titles: Software Engineer → unlevelled; Backend Engineer → unlevelled; Risk Strategist → non-swe; Product Manager → non-swe; Engineering Manager → non-swe [classification = keyword rule v0.1, your-input]
- **DELOITTE CONSULTING LLP** — 8810 approvals, 222 denials [record]. Titles: Manager → non-swe; Senior Consultant → non-swe; Senior Solution Specialist → non-swe; Consultant → non-swe; Solution Specialist → non-swe; Senior Consultant → non-swe; Manager → non-swe; Consultant → non-swe; Senior Solution Specialist → non-swe; Solution Specialist → non-swe [classification = keyword rule v0.1, your-input]
- **VIRTUSA CORP** — 3212 approvals, 88 denials [record]. Titles: JUNIOR COMPUTER SYSTEMS ENGINEER 1 → non-swe; IT PROJECT MANAGER 3 → non-swe; JAVA ENGINEER 2 → non-swe; BUSINESS ANALYST 3 → non-swe; .NET ENGINEER 2 → non-swe [classification = keyword rule v0.1, your-input]

## Pay context (not part of the score)

National median for Software Developers (15-1252), OEWS 2024: $133,080 [record]. The company medians below cover **all** the roles each company sponsored, not entry-level SWE, so they overstate new-grad pay at senior-heavy companies.

- MICROSOFT CORP: $156,705 median sponsored salary [record]
- PINTEREST INC: $156,853 median sponsored salary [record]
- DATABRICKS INC: $149,422.5 median sponsored salary [record]
- LINKEDIN CORP: $167,149 median sponsored salary [record]
- UBER TECHNOLOGIES INC: $165,000 median sponsored salary [record]
- STRIPE INC: $158,371 median sponsored salary [record]
- DELOITTE CONSULTING LLP: $120,754.5 median sponsored salary [record]
- VIRTUSA CORP: $110,488 median sponsored salary [record]

## What this run could not check

- Whether a company sponsors new-grad SWEs *this year*. The title list is historical and shows only top titles, with no counts.
- Companies that are not in the dataset (for example several of the largest tech sponsors).
- Whether a posting is live, unless the liveness source says `record` (from `npm run ats:liveness` with a date).
- Start dates that were estimated from your hiring-lag assumption. Confirm them with the recruiter.
- The OPT rules themselves. Confirm the dates and the unemployment limit with your DSO.

## Run record

- Run date: 2026-09-30 · mode: sample · persona: kiran-rao-example
- persona: `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-dec-grad.json`
- postings: `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/postings-sample.json`
- csv: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- bls: `data/bls/compact/soc_occupation_compact.csv`
- scorer: `scripts/score/role-scorer.mjs`
- Scorer: `✓ scored 8 roles → Apply 1 · Consider 4 · Skip 3 (skip 38%)`
- Agent log: `triage-log.json`
