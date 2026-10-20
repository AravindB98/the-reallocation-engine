# Domain justification — Data/ML Engineer sponsor and occupation-code mode

## Executive summary

## Who and when

## The information asymmetry

## Engine layers

## Failure mode 1: SOC ambiguity for DE/ML titles

> **Reference — real numbers from the runs** (sources: `runs/2026-10-20/reference/reference-counts.txt`, `runs/2026-10-20/report.md`, `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` line 15)
>
> - Sponsor table: 30,369 company rows; 1,557 with sponsorship figures; **0** rows with any SOC-like code. The audit says: "No SOC code columns are present".
> - Sponsored-title lists are short: 867 of the 1,557 companies list exactly 1 title; the longest list has 14.
> - Companies whose listed titles match a DE/ML keyword (a judgment): 131 — 96 proven, 35 likely.
> - Candidate SOC codes per title (the user's mapping, a judgment): data titles → 15-1252, 15-1243; ML titles → 15-1252, 15-2051.
> - National medians for those codes (OEWS 2024): 15-1243 Database Architects 135,980; 15-1252 Software Developers 133,080; 15-2051 Data Scientists 112,590 — a 23,390 spread depending on which code a role is filed under. 15-2051.00 has no cognitive-pivot score.
> - In the live run: Reddit, Discord and Twilio list an ML title (→ 15-1252 or 15-2051); Sigma Computing lists "Senior Analytics Engineer" (→ 15-1243 or 15-1252); Formlabs lists no DE/ML title. Per-employer SOC: **proposed** for all six — not answerable from repo data.

## Failure mode 2: legal-name mismatch hides real sponsors

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
