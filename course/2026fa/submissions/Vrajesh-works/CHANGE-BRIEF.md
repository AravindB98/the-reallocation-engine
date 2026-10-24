# CHANGE-BRIEF — written before building

**Date:** 2026-10-02 · **Handle:** Vrajesh-works · **Slug:** `ms-is-swe-opt-shortlist`

> **Authorship note.** Claude Code drafted this brief from the assignment text and a first look at the repo. Vrajesh must read it, edit anything that is not what they actually expect, and sign the line at the bottom. Until then these are the AI's predictions, not the student's. Revisions are appended under "Revisions"; the original text is never rewritten.
>
> **What was seen before writing:** the repo's governing docs, the `role-scorer.mjs` source, the first rows of the 80 Days CSV, and a count of rows (30,369), rows with approvals (1,557), rows whose sponsored titles mention software/developer/programmer (556), and the newest `latest_funding_date` (2025-09-26). Those counts informed prediction 5 below, so it is not a blind prediction.

## Executive summary

I am an international master's student in Information Systems, graduating December 2026, looking for entry-level software engineer roles. I will be on F-1 OPT with a limited unemployment window and will need an employer willing to sponsor an H-1B. The recipe I'm designing takes a short list of companies I am considering, checks each against the repository's sponsorship records, and combines that with a countdown from my own OPT dates. It returns a sourced Apply / Consider / Skip for each, and a "network, don't apply" list for strong sponsors with no live posting. It never decides for me: a human clears the liveness gate and owns every final call.

## 1. Situation and engine layers

- **Situation:** MS Information Systems, F-1, graduating December 2026; target = entry-level Software Engineer (SOC 15-1252, Software Developers). Exact OPT dates are personal immigration details, so committed files use a fictional persona's dates; my real dates are passed on the command line and never committed.
- **Layers used:** 80 Days to Stay (sponsorship history and funding fields, one CSV) and The Cognitive Pivot (national wage and ability levels for 15-1252, informational only). Job-Ops (liveness) is used as a human-run step: I run `npm run ats:liveness` and transcribe the result.

## 2. Reuse vs. new

Reuse (exact paths):

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — columns `Total Approvals`, `Approval_Rate`, `top_job_titles_sponsored`, `latest_funding_date`, `latest_funding_stage`.
- `data/bls/compact/soc_occupation_compact.csv` — row `15-1252.00`, for wage and `cognitive_pivot_score` in the report only.
- `scripts/score/role-scorer.mjs` via `npm run score` — the combiner. I do not copy it.
- `scripts/ats/check-liveness.mjs` via `npm run ats:liveness` — run by hand; result transcribed.

New (nothing the repo lacks is claimed to exist):

- `scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/` — a script that builds `roles.json` from the CSV and my inputs, calls the scorer, and writes a JSON log and a Markdown report.
- **Proposed, not built:** a funding term in the scorer. The scorer has no funding vote (only sponsorship, fit, role quality), so I use funding recency as a displayed field only. `[TODO: DEV]`
- **Proposed, not built:** a full Form D join. Only four 50-company samples ship. `[TODO: DATA SOURCE]`

## 3. Gates and what a human needs to see

| Gate | Condition (testable) | What the human must see to clear it |
|---|---|---|
| Liveness | each scored posting has a transcribed `ats:liveness` result with a date; anything not clearly live/dead is left unscored | the tool's raw output line and the posting URL, opened by hand once |
| Timeline | `window_end − as_of − hiring_lag > 0`, all three values shown | my own OPT dates and my own hiring-lag assumption, written out |
| Sponsorship tier (review, not a gate) | tier follows from printed counts and title text | the approvals count, approval rate and matched title string for the company |

## 4. Predicted failure cases and checks

1. **Company missing from the CSV** (name differs from the legal entity): exact normalized match only; result `not-in-csv`, no score. Check: fixture company that is absent.
2. **Posting 404 / no longer live:** a dead result closes the liveness gate and the role scores Skip. Check: fixture with a dead result; scorer shows gate multiplier 0.
3. **OPT window already past or the hiring lag does not fit:** timeline factor 0. Check: `--as-of` after the window end.
4. **Ambiguous name match** (two CSV rows normalize to the same name): refuse, list both. Check: duplicate-row fixture.
5. **Liveness unchecked or uncertain:** left unscored with "liveness unresolved", never defaulted to live. (The scorer itself treats a missing liveness as 1.0, so I must not leave it blank.)

## 5. One prediction about what it will get wrong first

The 80 Days data is a snapshot that ends around September 2025 (newest funding date 2025-09-26), more than a year before today. I predict that "recently funded" will be stale or empty for nearly every company when measured against today, and that the sponsorship tier will over-trust old approval counts. I also predict it cannot tell whether a company sponsors **entry-level** roles. The CSV lists only top titles, not levels, so any "entry-level" label will be a guess from title wording, and I will mark it as one.

## Revisions

### 2026-10-03

**Prediction 5 (funding looks stale) was partly wrong.** I predicted "recently funded" would look stale or empty. The first real run showed the opposite: funding dates like 2025-09-08 counted as "recent" under the 24-month rule, even though the data ends 372 days before the run. The rule hides how old the data is. The part I got right is that the data is a year old and that the "entry-level" label cannot be verified from it.

**Scope changed: OPT-bridge track.** The brief only asked "does this company sponsor?". I realized my immediate goal is a job right after graduating, including a contract role that does not sponsor but can be worked on OPT. A no-sponsor role would have been a Skip. I added a separate `opt-bridge` track that checks only liveness and timeline and uses no sponsorship score. It cannot see seniority or fit.

**Failure cases I did not predict.**
- A posting can rule me out through text no dataset shows: Talent Vine requires U.S. citizenship, and Boeing's entry-level role requires an active TS/SCI clearance. I added a human `excluded_reason`.
- A large employer can be missing from the data (Intuit, Boeing), so "not in the data" says nothing about whether they sponsor.
- A young company with no approvals (Confido) can get a Skip that may be a false negative.
- A break attempt found that `--as-of 2026-02-30` was accepted; fixed.

**Failure cases I predicted that held.** A company missing from the CSV gives `not-in-csv`, a closed OPT window gates every role to Skip, and unresolved liveness is never defaulted to live.

Reviewed and adopted by: Vrajesh Mathurbhai Nasit · date: 10/03/2026
