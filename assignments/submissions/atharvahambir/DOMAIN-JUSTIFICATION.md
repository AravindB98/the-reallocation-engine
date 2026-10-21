# Domain justification — a daily board check for entry-level data roles on a short OPT clock

## Executive summary

This page says who the mode is for, what they can't see without it, and where it can go wrong. Each morning it turns "open every target company's job board and read every posting" into one short report: the postings that match the student's requirements, the visa evidence for each, and everything it dropped and why. Every number traces to a record or to the student's own input.

## Who, in exactly what situation

An international MS student looking for **entry-level data roles**: Data Analyst, Data Scientist, BI Analyst, Business Analyst, Analytics Engineer or Data Engineer, with 0–3 years asked, nothing senior, anywhere in the US or US-remote. The student is on **post-completion F-1 OPT with the end date within about three months**, holds a **STEM degree with the extension not yet filed**, and so needs an employer that **sponsors H-1B and is enrolled in E-Verify**. They keep a short list of target companies on Greenhouse or Ashby.

## The information asymmetry

From outside, this student can't easily see:
- **Postings:** which of today's postings at *their* companies fit *their* level, location and experience limit, without reading every ad. On 2026-10-20, 7 of 2,108 postings across eight boards matched. Overnight, one of them closed.
- **Sponsorship:** whether a company has a record at all. The public data files companies under legal names ("Robinhood" is `ROBINHOOD MARKETS INC`, 824 approvals), so a miss reads like "doesn't sponsor". Only 1,557 of 30,369 companies carry any H-1B history.
- **The deadline:** which of **two clocks** ends first, the OPT end date or the unemployment allowance.
- **E-Verify:** whether a sponsor can also support the STEM extension.

## How it connects to the engine

| Layer | Use |
|---|---|
| **Job-Ops** | board APIs via the repo's `greenhouse-watch` fetcher, plus `npm run ats:liveness`; being listed on the company's own board is the liveness gate |
| **80 Days to Stay** | the shipped sponsorship CSV, exact-name matches only (a vote) |
| **Visa timeline** (Ch.10) | factor from the earlier of the two clocks (a gate) |
| **Scorer** (Ch.11) | the existing `role-scorer.mjs` makes every Apply / Consider / Skip call |
| **Cognitive Pivot** | display only: BLS median wage at zero weight |

## Domain-specific failure modes

1. **Right sponsor, wrong name.** The everyday name misses the legal name (Robinhood), or matches a *different* entity (`CHIME INC`, 2 approvals, instead of `CHIME FINANCIAL INC`, 580). Seen live: the only "Anthropic" in the data is *ANTHROPIC – A SERIES OF AURUM VP FUND LLC*, an investment fund, and the tool accepts it as Anthropic's legal name if the student sets it. The result is a confident "no record" or a borrowed record. *Hardest to catch for* a student skimming for a familiar name, and most of all one targeting fast-growing AI startups, whose legal names are newest and least likely to be in the data. The mode holds unmatched companies as "Needs you" and prints similar-name hints.
2. **The second clock.** A hiring timeline that fits the OPT end date still fails if the unemployment allowance runs out first. For the sample persona that's 2026-12-17, against an OPT end of 2027-03-15. *Hardest to catch for* a student who only remembers the date on their EAD card. The mode names both clocks and scores against the earlier one; the rules stay questions for the DSO.
