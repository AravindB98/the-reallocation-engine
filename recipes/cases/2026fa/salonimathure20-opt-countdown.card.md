---
status: DRAFT
todos_open: 0
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# OPT countdown — human card

**Audience:** an MS student on F-1 OPT (year 1) deciding which job postings get this week's limited hours.
**Agent twin:** `recipes/cases/2026fa/salonimathure20-opt-countdown.md`
**Engine layers:** 80 Days to Stay (sponsorship), Job-Ops (liveness), Cognitive Pivot (context only).

## Purpose

Answer: *given how many unemployment days I have left, which of these postings could actually turn into a job in time, at an employer with a real H-1B history?* If the evidence for a posting is missing, the tool says **blocked** and why. It never fills the gap with a guess.

## What it can verify

- The employer's exact-name row in the 80 Days CSV: H-1B approvals, denials, approval rate, and the titles it sponsored.
- Whether a Greenhouse job ID still exists (API 200 or 404) and what the browser liveness checker said, at the time you ran them.
- The arithmetic of your runway: `min(days to OPT end, unemployment days left − buffer)`, and each role's slack against your hiring-lag assumption.
- That the Apply / Consider / Skip decision came from the engine's shared scorer.

## What it cannot verify

- That a company with **no row, or a blank H-1B record, doesn't sponsor**. It might; the data join may have missed its name.
- That a renamed company is the same employer. You assert that yourself, and the report labels it as your input.
- That the H-1B **counts** are exact. Every count in the CSV is even, which looks like double-counting; the approval *rates* are fine.
- How fast any company really hires. That number is yours.
- Whether you are a good fit. That is a model judgment; read it, don't trust it.
- Immigration rules (cap-gap, STEM extension, whether part-time work stops the clock). Ask your DSO.

## Annotated commands

Collect liveness (network; do this first, save the output):

```bash
npm run ats:liveness -- --file my-urls.txt > liveness.txt 2>&1
```

For each Greenhouse posting, record the API status. Expected: `200 <board>/<id>` if live, `404` if gone:

```bash
curl -s -o /dev/null -w "%{http_code} klaviyo/7727703003\n" https://boards-api.greenhouse.io/v1/boards/klaviyo/jobs/7727703003
```

Run the recipe on the worked example (offline, about 1 second):

```bash
node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs
```

Run the tests (offline; 12 should pass):

```bash
node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/
```

## What it produces

- `opt-countdown-report.md`, for you. It shows your clock, then a decision and next action per posting, a verified-vs-inferred table, the context the score ignores (wages, funding), and a sign-off checklist.
- `opt-countdown-log.json`, for the agent. It holds every value with its source label, the reason codes, and the scorer's arithmetic.

## Your gates

1. **Runway (hard stop).** If your OPT end date has passed or your unemployment days are used up, the run stops and scores nothing. Check your dates against your EAD card and SEVP portal. Never commit them.
2. **Blocked roles.** Resolve each reason, or drop the role.
3. **Sign-off.** Before acting on any Apply or Consider: open the posting, confirm it is the job and the occupation you want, sanity-check the hiring lag, and write your decision in the run log.

## Named failure modes

1. **Ghost posting passes as live.** The browser checker read a dead Greenhouse job ID (it redirects to the careers page) as *active*. Mitigation: the Greenhouse API status wins when present; without it, every live role is flagged *single-source*. Hardest to catch for: a student pasting links from job aggregators, which often point at expired IDs.
2. **"No record" read as "won't sponsor."** HubSpot (no row) and DraftKings (blank H-1B fields) would be wrongly skipped by a naive tool. Mitigation: these are blocked, not skipped. Hardest to catch for: anyone who trusts a dataset's silence.
3. **The clock arithmetic hides a wrong input.** A wrong `unemployment_days_used` (for example, forgetting days between EAD start and today) shifts every timeline gate. Mitigation: the report prints every clock input with its label. Hardest to catch for: the student themself, because the number feels known.
