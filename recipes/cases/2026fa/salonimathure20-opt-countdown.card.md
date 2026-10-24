---
status: DRAFT
todos_open: 0
last_gate: "live-run, 2026-10-21 (see the agent twin)"
attestation: null
recipe_version: 0.2.0
---

# OPT countdown — human card

**Audience:** an MS student on F-1 OPT (year 1) deciding which job postings get this week's limited hours.
**Agent twin:** `recipes/cases/2026fa/salonimathure20-opt-countdown.md` (open items live there, not here)
**Engine layers:** 80 Days to Stay (sponsorship), Job-Ops (liveness, posting text), Cognitive Pivot (context only).

## Purpose

Answer: *given how many unemployment days I have left, which of these postings could actually turn into a job in time, at an employer with a real H-1B history, and which postings say outright that they won't sponsor me?* If the evidence for a posting is missing, or more than two days old, the tool says **blocked** and why. It never fills the gap with a guess.

## What it can verify

- The employer's exact-name row in the 80 Days CSV: H-1B approvals, denials, approval rate, and the titles it sponsored.
- Whether a Greenhouse job is still posted (API 200 or 404), **when** that was checked, and how long the posting has been up.
- What the posting itself says: an explicit "we won't sponsor" sentence, the years of experience it asks for, any pay range it prints.
- The arithmetic of your runway: `min(days to OPT end, unemployment days left − buffer)`, and each role's slack against your hiring-lag assumption.
- That the Apply / Consider / Skip decision came from the engine's shared scorer, and that the arithmetic can be redone by hand.

## What it cannot verify

- That a company with **no row, or a blank H-1B record, doesn't sponsor**. It might; the data join may have missed its name (CarGurus has no row).
- That a posting which **says nothing** about sponsorship will sponsor. Only an explicit refusal is caught.
- That a renamed company is the same employer. You assert that yourself in the alias table, and the report labels it as your input.
- That the H-1B **counts** are exact. Every count in the CSV is even, which looks like double-counting; the approval *rates* are fine.
- How fast any company really hires. That number is yours.
- Whether you are a good fit. That is a model judgment. **Watch out:** the shared scorer can recommend a role on sponsorship history alone, even with zero fit. Check the "years asked" column yourself.
- Immigration rules (cap-gap, STEM extension, whether part-time work stops the clock). Ask your DSO.

## Annotated commands

Collect posting evidence (network; run it the same day you decide). Try `--dry-run` first to see the requests:

```bash
node scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs --candidates my/candidates.json --out my/posting-evidence.json
```

Collect the browser liveness check (network, ~1 minute for 12 URLs):

```bash
npm run ats:liveness -- --file my/urls.txt > my/liveness.txt 2>&1
```

Run the mode live (offline after the two steps above, ~1 second):

```bash
node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs --mode live --persona my/persona.json --candidates my/candidates.json --liveness my/liveness.txt --posting-evidence my/posting-evidence.json --out-dir my/out
```

Run the tests (offline; 20 should pass):

```bash
node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/
```

## What it produces

- `opt-countdown-report.md`, for you. It shows your clock, a decision and next action per posting, a verified-vs-inferred table, what each posting says, the context the score ignores (wages, funding), and a sign-off checklist.
- `opt-countdown-log.json`, for the agent. It holds every value with its source label, the reason codes, and the scorer's arithmetic.

## Your gates

1. **Runway (hard stop).** If your OPT end date has passed or your unemployment days are used up, the run stops and scores nothing. Check your dates against your EAD card and SEVP portal. Never commit them.
2. **Blocked roles.** Resolve each reason, or drop the role. "Stale" means re-run the posting-evidence step.
3. **Posting says no.** A posting that refuses sponsorship is skipped, however strong the company's history. The company can still be a networking target.
4. **Sign-off.** Before acting on any Apply or Consider: open the posting; confirm it is the job and occupation you want; sanity-check the hiring lag and the years asked; write your decision in the run log.

## Named failure modes

1. **The company sponsors; this posting doesn't.** EverQuote has 56 approvals at 100%, yet its Data Scientist posting says "not eligible for immigration sponsorship, now or in the future". A tool reading only company history ranks it as a top sponsor. Hardest to catch for: a student skimming a ranked list who never reaches the last paragraph of the posting.
2. **Yesterday's "Apply" is gone today.** v0.1's only Apply (Formlabs) had closed 18 days later. Mitigation: evidence older than 2 days blocks the role. Hardest to catch for: a student working from last week's list, because the list still looks authoritative.
3. **"No record" read as "won't sponsor."** CarGurus (no row), HubSpot (no row) and DraftKings (blank H-1B fields) would be wrongly skipped by a naive tool. Mitigation: these are blocked, not skipped. Hardest to catch for: anyone who trusts a dataset's silence.
4. **The clock arithmetic hides a wrong input.** A wrong `unemployment_days_used` shifts every timeline gate. Mitigation: the report prints every clock input with its label. Hardest to catch for: the student themself, because the number feels known.
