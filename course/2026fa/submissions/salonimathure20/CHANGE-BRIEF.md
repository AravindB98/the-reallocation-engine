# CHANGE-BRIEF — opt-countdown (salonimathure20)

## Summary

This brief records what I planned to build before the prototype code was written, and what I expected to go wrong. It is a recipe that checks job postings against an F-1 OPT student's remaining unemployment days and the employer's H-1B history. The original predictions are kept as written. What actually happened is added under *Revisions* rather than edited in, including two predictions that turned out wrong.

**How this was written:** the predictions below were made in the working session after reading the governing docs and the data, and before `lib.mjs` or `opt-countdown.mjs` existed. The file was written up in the same session, after the build, from those notes. The session transcript shows the order.

## Career situation

An international MS student (Information Systems / Data Science track) in Boston. Graduated May 2026, now on **F-1 post-completion OPT, year 1**, unemployed, and targeting **data analyst / BI analyst (SOC 15-2051.01), systems analyst (15-1211) and new-grad software engineer (15-1252)** roles. Will need H-1B sponsorship later. The binding constraint is the **90-day OPT unemployment limit**, not the 12-month OPT end date: with 27 days used and a 10-day safety buffer, there are about 53 days left in which a job has to *start*. The worked run uses a fictional persona with exactly this profile (`ananya-rao-example`).

**Engine layers:** 80 Days to Stay (sponsorship history, funding columns), Job-Ops (liveness). Cognitive Pivot is used for context only.

## Reuse (exact paths)

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`, `median_salary_offered`, `latest_funding_*`.
- `data/bls/compact/soc_occupation_compact.csv`: national median wage, cognitive pivot score (context).
- `npm run ats:liveness` (`scripts/ats/check-liveness.mjs`): posting liveness.
- `scripts/score/role-scorer.mjs`: the composite. Called, not copied.
- `search/examples/priya-nair/profile.yml`: the shape of the `visa` block (`opt_end_date`, `unemployment_days_used`, `unemployment_ceiling`, `buffer_target`).

## Proposed (not in the repo yet)

- A **runway → timeline-factor** computation from the OPT dates and a stated hiring-lag assumption. The scorer takes a timeline factor, but nothing in the repo computes one from a person's OPT dates. That is the gap this recipe fills.
- A rule that a **blank H-1B record blocks the role** instead of scoring it as a non-sponsor.

## Gates and what a human needs to see

1. **Runway gate (hard stop):** if the OPT end date is past or the unemployment days are gone, stop. The human needs to see the computed runway and every input behind it.
2. **Evidence gate per role:** no CSV row, or no liveness record, means blocked. The human sees the reason code.
3. **Adequacy gate:** before acting on any Apply or Consider, the human opens the posting and confirms the role, the occupation and the lag assumption.

## Predicted failure cases and how I'll check each

| # | Predicted failure | Check |
|---|---|---|
| P1 | A company I care about is missing from the CSV | look up a known Boston sponsor; expect `no-company-row`, blocked, not scored |
| P2 | OPT end date already past | test persona with `opt_end_date` before `as_of`; expect halt, exit code, no `roles.json` |
| P3 | A posting that 404s | add a fake job ID; expect `ats:liveness` to report it `expired` and the scorer to skip it |
| P4 | A SOC code with no BLS row | test with `15-9999.00`; expect `no-occupation-row` in context, decision unaffected (weight 0) |

## Prediction about what the prototype will get wrong or miss on the first pass

The **hiring-lag numbers will dominate the outcome**, and they are pure assumption: no repo data measures time-to-hire. I expect the timeline gate to close for large employers no matter how good the sponsor is. The output will look more certain than its weakest input.

## Revisions (added after the build; originals above unchanged)

- **P3 was wrong.** `npm run ats:liveness` reported the fake job ID `boards.greenhouse.io/klaviyo/jobs/1000000003` as **active**, not expired. The URL redirects to Klaviyo's careers search page, which has apply-like buttons. The Greenhouse API returned 404 for the same ID. I added the API status as a second liveness record that wins when present (gate G3).
- **P1 was right, but it was not the only missing-data shape.** HubSpot has no row (`no-company-row`). DraftKings *has* a row but blank H-1B columns (`no-h1b-record-joined`). A third shape: Iterative Health is in the CSV under its old name, Iterative Scopes, so the exact match fails. I handled that with a human-asserted alias labeled your-input.
- **New, not predicted:** every one of the 1,557 filled H-1B rows has even approvals and even denials. That suggests the counts are doubled by the join. I did not correct the data; it is listed under *can't verify*.
- **The lag prediction held.** Klaviyo and Toast were both gated to 0 by timeline (60-day assumed lag against a 53-day runway), even though both are Proven sponsors.
- **Baseline friction not predicted:** `npm run verify` failed on a fresh setup (no `pyyaml`), `ats:scan` needed `portals.yml`, and `ats:liveness` needed a Playwright browser download.
