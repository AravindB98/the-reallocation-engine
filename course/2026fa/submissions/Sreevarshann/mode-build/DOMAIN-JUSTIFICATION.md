# Domain justification — Data/ML Engineer sponsor and occupation-code mode

## Executive summary
This mode helps an F-1 master's graduate on OPT decide which entry-level Data Engineer and ML Engineer postings are worth their limited unemployment days. Before anything is scored, it checks real sponsorship history, posting liveness, and the 90-day clock, and it refuses to score when the evidence is missing.

## Who and when
The user is an international MS graduate on post-completion F-1 OPT who has already used part of the 90-day unemployment allowance and is targeting entry-level Data Engineer or ML Engineer roles. They use this mode each time they build a shortlist, before applying rather than after.

## The information asymmetry
The student can see a job title and a company name. They can't easily see three things. First, whether the company actually sponsors, and how strongly: only 1,557 of the 30,369 companies in the engine's dataset (5.1%) have any sponsorship figures. Second, whether the posting is still live. Third, whether the company they know by its brand appears in sponsorship records under a different legal name. Recruiters and the company can see all of this, while the student has to guess.

## Engine layers
- **80 Days to Stay:** sponsorship approvals, denials and approval rate from mapped_student_employment_targets_v3.csv, plus Form D funding recency (sample only).
- **Job-Ops:** npm run ats:liveness as a hard gate, so a dead posting is never scored.
- **Cognitive Pivot:** BLS/O*NET job zone, national median and cognitive-pivot score for the candidate SOC codes. These are report-only because the scorer weights role quality at 0, and the Data Scientists code (15-2051.00) has no score at all.

## Failure mode 1: SOC ambiguity for DE/ML titles
A "Data Engineer" can be filed under 15-1252 or 15-1243, and an "ML Engineer" under 15-1252 or 15-2051. The dataset has no SOC field, only each company's list of top sponsored titles. So when a company lists "Data Engineer", the mode can only infer that it might sponsor DE roles. It can't say under which code, at what level, or how often, and for 867 companies the list holds a single title. The error looks like a confident match. It's hardest to catch for a new grad, who reads a title list as role-level evidence and has no access to the underlying labor-condition filings.

> **Reference — real numbers from the runs** (sources: `runs/2026-10-20/reference/reference-counts.txt`, `runs/2026-10-20/report.md`, `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` line 15)
>
> - Sponsor table: 30,369 company rows; 1,557 with sponsorship figures; **0** rows with any SOC-like code. The audit says: "No SOC code columns are present".
> - Sponsored-title lists are short: 867 of the 1,557 companies list exactly 1 title; the longest list has 14.
> - Companies whose listed titles match a DE/ML keyword (a judgment): 131 — 96 proven, 35 likely.
> - Candidate SOC codes per title (the user's mapping, a judgment): data titles → 15-1252, 15-1243; ML titles → 15-1252, 15-2051.
> - National medians for those codes (OEWS 2024): 15-1243 Database Architects 135,980; 15-1252 Software Developers 133,080; 15-2051 Data Scientists 112,590 — a 23,390 spread depending on which code a role is filed under. 15-2051.00 has no cognitive-pivot score.
> - In the live run: Reddit, Discord and Twilio list an ML title (→ 15-1252 or 15-2051); Sigma Computing lists "Senior Analytics Engineer" (→ 15-1243 or 15-1252); Formlabs lists no DE/ML title. Per-employer SOC: **proposed** for all six — not answerable from repo data.

## Failure mode 2: legal-name mismatch hides real sponsors
Sponsorship records use legal names. A student searching for "Instacart" gets "not found", while MAPLEBEAR INC, the company's legal name, has 498 approvals and 4 denials. Because the mode is built to refuse rather than guess, it blocks the company. That's the safe error, but it still costs the student a strong sponsor. Another 212 normalized names match more than one row. This failure is hardest to catch for international students, who are less likely to know US corporate legal names and would simply drop a strong sponsor from their list.

> **Reference — real numbers from the runs** (sources: `runs/2026-10-20/break/1b-legal-name-lookups.txt`, `runs/2026-10-20/break/1-samsara-exact-name.txt`, `runs/2026-10-20/reference/reference-counts.txt`, `runs/2026-10-20/report.md`)
>
> - "Instacart" → not found; `MAPLEBEAR INC` → found, proven, 498 approvals / 4 denials.
> - "One Medical" → not found; `1LIFE HEALTHCARE INC` → found, likely, 2 approvals / 0 denials.
> - That Instacart is Maplebear Inc. and One Medical is 1Life Healthcare is outside knowledge (inferred); the repo does not record it.
> - Contrast: "Samsara" and "Plaid" → not found, but their legal-name rows (`SAMSARA NETWORKS INC`, `PLAID TECHNOLOGIES INC`) have **no** sponsorship figures — a better name match would still block them.
> - 212 normalized names map to more than one dataset row, so an exact lookup returns "ambiguous" for them.
> - The same sponsorship record under two names: `PATHAI INC` and `PATHRAI INC` both show 78 approvals / 2 denials / 97.5% and identical titles, but different funding records (2019-04-09 Series C vs 2022-03-30 Pre-Seed).
> - `HUMAN INC`: 1,382 approvals / 12 denials across 13 listed titles — high enough to warrant checking the join; not verified.
> - In the live run, Brex was not found in the sponsor table and was blocked, never scored.
