# Domain Justification: case-aiml-cognitive-floor

## Executive summary

This page explains who the AI/ML cognitive-floor mode is for, what that person
cannot see without it, and the two errors in this domain that are easiest to
miss. The main finding: the federal data the engine uses to judge how
AI-resistant an occupation is has no ratings for Data Scientists. A tool that
reads the blank as zero, or borrows a neighbouring occupation's score, gives a
precise-looking wrong answer.

## Who uses this mode and in what exact situation

An F-1 master's student whose program ends in December 2026. The student is
applying for early-career AI/ML engineer, applied scientist and data scientist
roles that start in January 2027 on post-completion OPT, at employers with
H-1B history that post on Greenhouse. The student has weeks, a fixed OPT start
window, and more postings than applications they can do well.

## Identifies a specific information asymmetry

A posting shows a title. It never shows the occupation (SOC) code the employer
will file under, yet the occupation decides how the role measures on the
Cognitive Pivot score. The student also cannot see which occupations the
federal data leaves unrated. In this checkout `data/bls/compact/soc_occupation_compact.csv`
holds 1016 occupations. 122 of them have a blank `cognitive_pivot_score`,
including 15-2051.00 Data Scientists, whose 9 rating fields are all blank.

## Connects clearly to at least one engine layer

- **The Cognitive Pivot:** exact O*NET-SOC lookup of `cognitive_pivot_score` and its 9 ability and skill fields, against a percentile floor.
- **Job-Ops:** `npm run ats:scan -- --dry-run` for discovery. The liveness gate uses the Greenhouse board API and the repository's closed-posting patterns, cross-checked with `npm run ats:liveness`.
- **80 Days to Stay:** approval and denial counts from `mapped_student_employment_targets_v3.csv`, reported beside each row.

## Names 1–2 failure modes specific to the domain

**1. An unrated occupation scored as if it had data.** The shape: a blank
rating is parsed as 0, or the lookup falls back to a sibling code under the
same 6-digit BLS code. On 15-2051.00 the first mutant returns score 0 and
`below_floor`, so every data-scientist posting is silently skipped. The second
returns 3.903 and `clears_floor`, taken from 15-2051.01 Business Intelligence
Analysts. Both print a tidy three-decimal number. A data-science student would
struggle most to catch it. Data scientist is their main target title, and
nothing on the screen says the number came from no data or from a different
job.

**2. The same title, a different occupation.** The shape: "Machine Learning
Engineer" can be filed as 15-1252.00 Software Developers (score 3.834, at or
below 715 of 894 scored occupations) or 15-1221.00 Computer and Information
Research Scientists (4.516, at or below 885 of 894). At the 75th-percentile
floor used in the run (cutoff 3.749) both clear. Any floor above about the
80th percentile gives opposite answers for the same posting, depending on a
code nobody can read from the posting. A new graduate would struggle most to
catch it. The filing happens after an offer, and the posting gives no hint.
