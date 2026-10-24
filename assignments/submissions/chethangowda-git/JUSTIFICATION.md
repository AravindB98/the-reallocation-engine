# Domain Justification — H-1B Wage-Floor Triage for SDE I / SDE II

## Executive summary

This page explains who the mode is for, what they cannot see without it, and how it goes
wrong. It is for an international student who will need an H-1B and is choosing which
software jobs are worth applying to. The short version: the pay a job board shows and the
pay the government requires for a visa are different numbers, the gap depends on the city
and the experience level, and the postings that look best on salary can still be closed to
a visa holder by a single line of text.

## Who, and in what exact situation

An international master's student on F-1, with about three years of software-engineering
experience from India, applying in fall 2026 for full-time **SDE I / new-grad and SDE II**
roles (SOC 15-1252) that start in **June 2027 or later**, in 41 target cities. They will
start on OPT and need an employer to file an H-1B, so an application is only worth making if
the employer *can* sponsor at the posted pay — and will.

## The information asymmetry

A posting shows a title, a city and a pay range. It does not show:

- **The prevailing-wage floor** the employer must meet, set by the Department of Labor per
  metro area and four experience levels. The spread is large: San Jose's Level 1 is about
  $152,797 a year — above the national median for software developers ($133,080, BLS 2024) —
  and higher than Huntsville's Level 3 (about $127,067). *(Annual figures are hourly × 2,080,
  a convention still to be confirmed against an OFLC source.)*
- **Which level the role implies.** "SDE II, 3+ years" plausibly files at Level 2 or 3, not 1.
- **Disqualifying text** buried in the description — "authorized to work … without
  sponsorship", or a TS/SCI clearance that requires US citizenship.
- **When the job starts.** None of the five real postings tested stated a start date.

## Engine layers

- **80 Days to Stay** — the company's H-1B approval history (154 and 272 approvals for the two
  real-run survivors). Only 5.1% of the 30,369 companies carry any record, and counts are
  company-wide with no year — so a blank is a stop, not a "no".
- **Job-Ops** — `npm run ats:liveness` as a hard gate, plus a new offline Greenhouse converter.
- **New layer** — the DOL prevailing-wage extract (`data/oflc/`), which the repo's own planning
  notes listed as a source but never built.

## Failure modes specific to this domain

**1. The "my experience helps me" trap.** A Sunnyvale SDE II posting pays $160K–$190K and asks
for 3+ years. Checked against the Level 1 floor ($152,797) it looks safe. But an employer would
plausibly file at Level 2 ($187,075) or Level 3 ($221,374), and $160K clears neither. *Hardest to
catch for the experienced applicant* — exactly this persona — because they read their years as
an advantage and anchor on the entry-level number. Whether experience from India counts toward
the level is a second, unverifiable assumption stacked on the first.

**2. The clean-looking disqualifier.** In the real run, a live posting paid $170K–$200K — above
the Level 2 floor in 19 of the 20 target areas — and required an active TS/SCI clearance.
Two of five real postings failed this way and a third said "without sponsorship"; a salary
check alone would have kept all three. *Hardest to catch for anyone triaging in bulk by pay and
city* — the way a scanner is used — because nothing in the structured fields looks wrong.
