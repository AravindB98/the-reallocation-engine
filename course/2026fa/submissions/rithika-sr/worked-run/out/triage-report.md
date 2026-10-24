# Sponsor triage — Sasha Jones (fictional) · run date 2026-10-03

Target: Data Scientist (entry level), SOC 15-2051. Recipe `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`, prototype v0.1.0.
Labels: **[record]** came from repo data; **[your-input]** came from the person. This run used **no model judgment**.

**Summary:** 8 candidate roles → 4 scored, 4 held at a gate. Scorer decisions: Skip 1 · Apply 3.

## Scored roles (decision from scripts/score/role-scorer.mjs)

| Role | Decision | Composite | Sponsorship [record] | Fit [your-input] | Liveness [record] | Timeline [your-input] | Next action |
|---|---|---|---|---|---|---|---|
| AIRBNB INC — Data Scientist, Platform | **Skip** | 0.000 | Proven (p 0.9; 1000 approvals, rate 99.0%; Data Scientist, Senior Data Scientist) | 0.4 | closed (2026-10-03) | 1.0 | Skip. Spend the time on networking or credibility hours. |
| AIRBNB INC — Staff Data Scientist, Locations | **Apply** | 0.375 | Proven (p 0.9; 1000 approvals, rate 99.0%; Data Scientist, Senior Data Scientist) | 0.2 | live (2026-10-03) | 1.0 | Tailor and send an application (research-and-apply block). |
| MAPLEBEAR INC — Data Scientist | **Apply** | 0.465 | Proven (p 0.9; 498 approvals, rate 99.2%; Senior Data Scientist, Data Scientist) | 0.5 | live (2026-10-03) | 1.0 | Tailor and send an application (research-and-apply block). |
| NEXTDOOR INC — Data Scientist - Search (Senior) | **Apply** | 0.405 | Proven (p 0.9; 222 approvals, rate 96.5%; Data Scientist) | 0.3 | live (2026-10-03) | 1.0 | Tailor and send an application (research-and-apply block). |

**⚠ Needs a human (G4):** Apply here comes mainly from sponsorship, not fit (fit < 0.5). A Proven sponsor alone contributes 0.9 × 0.35 = 0.315, which already clears the 0.30 Apply threshold:
- AIRBNB INC — Staff Data Scientist, Locations (fit 0.2)
- NEXTDOOR INC — Data Scientist - Search (Senior) (fit 0.3)

## Held at a gate (not scored, nothing invented)

| Role | Gate | Why held | Next action |
|---|---|---|---|
| Airbnb — Staff Data Scientist, Locations | G1 | company not found in sponsorship CSV (exact-name match; may be a naming miss) | Search the CSV by hand for the legal name before deciding. |
| Instacart — Data Scientist | G1 | company not found in sponsorship CSV (exact-name match; may be a naming miss) | Search the CSV by hand for the legal name before deciding. |
| Figma Inc — Data Scientist | G2 | liveness checker said 'uncertain', which is neither live nor closed | Run: npm run ats:liveness -- https://job-boards.greenhouse.io/figma/jobs/5552580004 |
| $AVY INC — Data Scientist (no posting found) | G1 | company is in the CSV but Total Approvals is blank: no sponsorship record (not zero) | Treat sponsorship as unknown; network to ask before applying. |

## Visa timeline gate [your-input]

Factor **1.0**: 94 days until EAD start + 70 unemployment days left = 164 available / 60-day hiring lag.

## Role quality (report only — weight 0 in the scorer)

- [record] Data Scientists, OEWS 2024: median $112,590, mean $124,590, employment 233,440.
- [record] OEWS wage is published at the 6-digit SOC, so all O*NET sub-occupations of this SOC share it (a group wage).
- **Missing:** O*NET ability levels and cognitive_pivot_score are empty for this row, so AI-resilience cannot be checked from repo data.

## What this run did NOT verify

- Whether a company sponsors SOC 15-2051 specifically. CSV approval counts are company-wide; the title check only looks at top_job_titles_sponsored. [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.
- Company matching is exact (case-insensitive). A G1 miss may be a naming difference (e.g. 'Airbnb' vs 'AIRBNB INC'), not a non-sponsor.
- Liveness values are transcribed from ats:liveness checks recorded in the candidates file; this prototype does not run the check itself. [TODO: DEV]
- The timeline formula reflects a general understanding of the 90-day OPT unemployment limit. It is not legal advice; confirm dates with the school's international student office.
- BLS wage is a national OEWS estimate shared by all O*NET sub-occupations of 15-2051 (a group wage), not an offer. role_quality carries weight 0 in the scorer, so it does not change any decision.
- Funding values come from the CSV; they were not re-checked against new SEC filings.

## Human gate G4

These are recommendations. A named person reviews this report and decides Apply / Network / Skip for each role.
