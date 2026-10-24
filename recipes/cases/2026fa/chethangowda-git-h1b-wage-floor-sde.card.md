---
status: RUNNABLE-SAMPLE
todos_open: 8
last_gate: "sample-run, 2026-10-21, assignments/submissions/chethangowda-git/RUN_LOG-entry.md"
attestation: null
recipe_version: 0.1.0
type: card
---

# H-1B Wage-Floor Triage — human card

## Executive summary

The one-page version of the recipe. It tells an international student targeting SDE I / SDE II
jobs which postings to drop before applying: closed postings, postings that refuse visa holders,
jobs that start too early, and jobs whose posted pay is below the H-1B minimum for that city and
experience level. Read it before you run the check, and again before you believe a result.

## Purpose

You are on F-1, you will need an H-1B, you cannot start before mid-2027, and you have about three
years of experience. A job board shows you a title, a city and a pay range. It does not show you
that the H-1B minimum for a Sunnyvale SDE II can be over $220,000, that a posting asking for a
"TS/SCI" clearance is closed to you at any salary, or that a posting with no start date may want
you next month. This check makes those visible and stops when it cannot know.

## What it can verify

- The official H-1B minimum wage (four levels) for software developers in your 20 target metro
  areas, traced to the government file.
- Which wage area each of your 41 cities belongs to — and which three straddle two.
- Whether a posted pay range clears, misses, or straddles the minimum for its experience band.
- Whether the start month (when posted) is before your cutoff.
- Whether the posting's own words refuse sponsorship or require a clearance or citizenship.
- Whether the posting is still live today.
- Whether the company has H-1B approvals on record, and how many.

## What it cannot verify

This is the more important list.

- **Which level the employer will file.** That is their decision; "UNCERTAIN" means exactly this.
- **Whether you qualify** for the experience the posting asks for, or whether your experience from
  India counts.
- **When you can legally start** — your OPT approval date is not in any dataset here.
- **Start dates the posting never mentions** — most don't.
- **Remote postings with no office** — no office, no wage area.
- **Whether a company sponsors this role.** The H-1B counts are company-wide, with no year.
- **Reworded refusals.** The text check matches patterns; read every flagged snippet yourself.

## How to run

```bash
npm run ats:liveness -- <posting urls>
python3 -I scripts/oflc/greenhouse-to-gate-input.py private/real-postings/<date>/*.json -o private/real-postings/<date>/gate-input.json
python3 -I scripts/oflc/wage-timeline-gate.py private/real-postings/<date>/gate-input.json --out-dir private/real-postings/<date>/run
```

## What a result means

| Result | Meaning | Your move |
|---|---|---|
| PASS | the pay minimum clears the higher plausible level | still check experience fit and sponsorship history — PASS is not "apply" |
| UNCERTAIN | the range straddles the floor | you decide; ask the recruiter which level they file at |
| FAIL | even the top of the range is below the floor | drop it |
| SKIP | starts too early, refuses sponsorship, or needs clearance | drop it |
| STOP | something needed is missing | find the missing fact, or drop it — never guess it |
