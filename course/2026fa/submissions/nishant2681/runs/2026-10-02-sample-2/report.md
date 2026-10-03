# Role triage report — 2026-10-02-sample-2

## Executive summary

This report sorts 8 job postings into apply, network-first, or drop, for a candidate on post-graduation work authorization who needs visa sponsorship. It is a sample run on fictional postings, so read it to check the method, not to choose real jobs.

**Result:** Apply 1 · Consider 4 · Skip 3. Skip rate 38%, below the 50% a healthy run skips.
1 role(s) were dropped because the hire could not start before the unemployment deadline, and 1 because the posting had expired. 2 employer(s) had no sponsorship record to judge.

**How to read the labels:** every input value is labeled *record* (from a public dataset), *your-input* (typed by the candidate) or *model-judgment* (an AI's opinion). This run has 0 model-judgment values.
*scorer output* marks values computed by the existing scorer from those labeled inputs — every input value is still labeled record / your-input / model-judgment.

## Run record

- Run id `2026-10-02-sample-2` · today `2026-10-02` · mode `sample`
- Strong-fit cutoff for Unknown tiers: 0.7 [your-input]
- Scorer: `node scripts/score/role-scorer.mjs course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2.partial/scorer-input/roles.json --profile course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2.partial/scorer-input/profile.json --out-dir course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2.partial/scorer` → exit 0
  (ran in the staging folder `course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2.partial`, renamed to `course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2` after every check passed)
- Input profile: `search/examples/priya-nair/profile.yml` (sha256 `3a1f85a6cb0a…`)
- Input jobs: `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json` (sha256 `c1d01083e3b6…`)
- Input csv: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2addf4…`)
- Input scorer: `scripts/score/role-scorer.mjs` (sha256 `8655e182c3c2…`)

## Roles

| Role | Sponsorship | Funding | Fit | Liveness | Timeline | Composite | Decision | Next action |
|---|---|---|---|---|---|---|---|---|
| Affinity Solutions — Data Analyst (CSV: AFFINITY SOLUTIONS INC) | Proven p=0.9 [record]; matched titles: "SENIOR DATA ANALYST", "DATA SCIENTIST", "DATA ANALYST"; approvals 40, denials 0, rate 100.0 [record] | $20,031,615 Series B (2019-05-07) [record; context only, not scored] | 0.8 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.555 [scorer output] | **Apply** [scorer output] | Tailor an application (2-hour block) |
| Adept ID — Data Scientist (CSV: ADEPT ID INC) | Likely p=0.6 [record]; matched titles: "Research Data Scientist"; approvals 4, denials 0, rate 100.0 [record] | $2,500,000 Pre-Seed (2021-11-15) [record; context only, not scored] | 0.75 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 0.933 [your-input]; lag 4 wk, start 2026-10-30, deadline 2026-11-27 | 0.406 [scorer output] | **Consider** [scorer output] | Network into the company first (3-hour block) |
| Deloitte — Consultant, Data Analytics (CSV: DELOITTE CONSULTING LLP) | Possible p=0.3 [record]; matched titles: none; approvals 8,810, denials 222, rate 97.5 [record] | $40,128,485 Series C (2022-01-07) [record; context only, not scored] | 0.7 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.315 [scorer output] | **Consider** [scorer output] | Network into the company first (3-hour block) |
| Wayfair — Data Analyst | Unknown (no-csv-match); p omitted [record] | — (no CSV row) [record; context only, not scored] | 0.85 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.255 [scorer output] | **Consider** [scorer output] | Network, don't apply yet |
| 0xCord — Data Engineer (CSV: 0XCORD INC) | Unknown (no-h1b-record); p omitted [record] | $3,500,000 Pre-Seed (2022-04-07) [record; context only, not scored] | 0.5 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.150 [scorer output] | **Skip** [scorer output] | Drop — composite 0.150 < 0.2 — time is better spent elsewhere |
| Affinity Solutions — Data Scientist (CSV: AFFINITY SOLUTIONS INC) | Proven p=0.9 [record]; matched titles: "SENIOR DATA ANALYST", "DATA SCIENTIST", "DATA ANALYST"; approvals 40, denials 0, rate 100.0 [record] | $20,031,615 Series B (2019-05-07) [record; context only, not scored] | 0.8 [your-input] | expired → 0.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.000 [scorer output] | **Skip** [scorer output] | Drop — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) |
| Adept ID — Data Analyst (CSV: ADEPT ID INC) | Likely p=0.6 [record]; matched titles: "Research Data Scientist"; approvals 4, denials 0, rate 100.0 [record] | $2,500,000 Pre-Seed (2021-11-15) [record; context only, not scored] | 0.8 [your-input] | uncertain → 0.5 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-10-23, deadline 2026-11-27 | 0.225 [scorer output] | **Consider** [scorer output] | Network into the company first (3-hour block) |
| Affinity Solutions — Analytics Engineer (CSV: AFFINITY SOLUTIONS INC) | Proven p=0.9 [record]; matched titles: "SENIOR DATA ANALYST", "DATA SCIENTIST", "DATA ANALYST"; approvals 40, denials 0, rate 100.0 [record] | $20,031,615 Series B (2019-05-07) [record; context only, not scored] | 0.9 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 0.000 [your-input]; lag 12 wk (default), start 2026-12-25, deadline 2026-11-27 | 0.000 [scorer output] | **Skip** [scorer output] | Drop — gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) |

## Timeline gate dates

| Role | Days used / ceiling | Remaining | OPT end | Deadline | Full-credit cutoff | Lag | Expected start | Factor | Why |
|---|---|---|---|---|---|---|---|---|---|
| affinity-data-analyst | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| adeptid-data-scientist | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 4 wk | 2026-10-30 | 0.933 | starts within 30 days of the deadline |
| deloitte-consulting-analyst | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| wayfair-data-analyst | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| 0xcord-data-engineer | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| affinity-data-scientist-expired | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| adeptid-data-analyst-uncertain | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 3 wk | 2026-10-23 | 1.000 | starts 30+ days before the deadline |
| affinity-analytics-engineer-nolag | 34 / 90 | 56 | 2027-01-31 | 2026-11-27 | 2026-10-28 | 12 wk (default) | 2026-12-25 | 0.000 | starts after the deadline |

## Scorer arithmetic (scorer output)

- `affinity-data-analyst`: (0.9·0.35 + 0.8·0.3) × 1 × 1 = 0.555 → Apply (composite 0.555 ≥ 0.3, gates healthy)
- `adeptid-data-scientist`: (0.6·0.35 + 0.75·0.3) × 1 × 0.9333333333333333 = 0.406 → Consider (above threshold (0.406) but one soft spot: sponsorship tier "Likely")
- `deloitte-consulting-analyst`: (0.3·0.35 + 0.7·0.3) × 1 × 1 = 0.315 → Consider (above threshold (0.315) but one soft spot: sponsorship tier "Possible")
- `wayfair-data-analyst`: (0.85·0.3) × 1 × 1 = 0.255 → Consider (composite 0.255 in the Consider band [0.2, 0.3))
- `0xcord-data-engineer`: (0.5·0.3) × 1 × 1 = 0.150 → Skip (composite 0.150 < 0.2 — time is better spent elsewhere)
- `affinity-data-scientist-expired`: (0.9·0.35 + 0.8·0.3) × 0 × 1 = 0.000 → Skip (gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes))
- `adeptid-data-analyst-uncertain`: (0.6·0.35 + 0.8·0.3) × 0.5 × 1 = 0.225 → Consider (composite 0.225 in the Consider band [0.2, 0.3))
- `affinity-analytics-engineer-nolag`: (0.9·0.35 + 0.9·0.3) × 1 × 0 = 0.000 → Skip (gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes))

## What this report cannot tell you

- How many approvals were for this exact title: approvals are per company.
- Whether an employer missing from the data sponsors: Unknown is not "doesn't sponsor".
- Whether the employer will sponsor now: the record looks backwards.
- Salary, occupation code, or any immigration-law answer (ask a DSO or attorney).
- Which job title the tier was matched on: it uses the candidate's target-title list, not each posting's own title.
