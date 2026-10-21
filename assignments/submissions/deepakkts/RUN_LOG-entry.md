# RUN_LOG entry: case-aiml-cognitive-floor, 2026-10-21

## Executive summary

This is the run-history record for the first real run of the AI/ML
cognitive-floor mode. It lives in the submission folder because the
repository's contribution rules say students must never edit the shared run
log. Read it for the facts of the run: what went in, what came out, and what
is still open. Of 12 postings, 7 cleared the floor, 4 were held for missing
occupation data, and 1 was skipped because the posting had closed.

## Why this entry is here

`CONTRIBUTING.md`, table "Where your work goes (and nowhere else)", row
"Run-log entries" names `logs/runs/<term>-<handle>-<n>.md` as the place for
entries and says "**never** edit `logs/RUN_LOG.md`". The assignment allows the
entry to be included in the submission instead.

## 2026-10-21 · case-aiml-cognitive-floor v0.1.0

- Recipe: recipes/case-aiml-cognitive-floor.md v0.1.0
- Command: node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir assignments/submissions/deepakkts/run
- Mode: live (Greenhouse board API), run log `started_at` 2026-10-21T19:32:31.191Z
- Inputs: dec2026-completion-jan2027-start-aiml; 12 roles at 7 employers (PathAI, Discord, Figma, Moloco, Reddit, Airbnb, AppLovin); floor percentile 75 [model-judgment]; timeline months 2026-12 [your-input] / 2027-01 [your-input] / 2027-01 [model-judgment] / 2027-02 [model-judgment]
- Sources: soc_occupation_compact.csv sha256 bac5acf77ca2d25268c75b3706084f7f67bcc0c6e3cc68cd03e0ebd2598343d1; mapped_student_employment_targets_v3.csv sha256 eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270
- Outputs: assignments/submissions/deepakkts/run/run-log.json; assignments/submissions/deepakkts/run/report.md
- Result: exit 0; CLEARS_FLOOR 7 · HOLD_MISSING_EVIDENCE 4 · SKIP_GATED_LIVENESS 1; floor cutoff 3.749 (rank 671 of 894)
- Stops fired: none
- Supporting runs: `npm run ats:scan -- --dry-run` (11 companies, 1179 jobs, 18 kept, no writes); `npm run ats:liveness` (11 active, 1 expired, exit 1, 19:45:15Z to 19:45:44Z); `node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/test.mjs` (32/32, exit 0); fresh clone at 0ff57e4 without `npm ci` gave identical dispositions
- G4 human gate: G4 cleared by Deepak Kumaran T S on October 21, 2026. I confirm the SOC candidate lists, the floor percentile of 75, ead_expected_month 2027-01 and latest_opt_start_month 2027-02 as stated.
- Audits: I have read run/report.md and run/run-log.json. Yes.
- your-input values: program_completion_month 2026-12, target_start_month 2027-01, needs_sponsorship true. Confirmed.
- Open issues: 15-2051.00 Data Scientists has no O*NET ratings in this checkout; the floor at P75 does not separate the ML-engineer candidate codes; ambiguous-sponsor and score-mismatch paths have no fixture case; an "Expression of Interest" posting passes the liveness gate; SOC candidate lists, the floor percentile and two timeline months are model-judgment values, confirmed at gate G4
