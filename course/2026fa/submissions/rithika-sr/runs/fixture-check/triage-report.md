# Sponsor triage — Sasha Jones (fictional) · run date 2026-10-03

Target: Data Scientist (entry level), SOC 15-2051. Recipe `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`, prototype v0.1.0.
Labels: **[record]** came from repo data; **[your-input]** came from the person. This run used **no model judgment**.

**Summary:** 9 candidate roles → 5 scored, 4 held at a gate. Scorer decisions: Apply 1 · Consider 3 · Skip 1.

## Scored roles (decision from scripts/score/role-scorer.mjs)

| Role | Decision | Composite | Sponsorship [record] | Fit [your-input] | Liveness [record] | Timeline [your-input] | Next action |
|---|---|---|---|---|---|---|---|
| NORTHWIND ANALYTICS INC — Data Scientist I | **Apply** | 0.555 | Proven (p 0.9; 25 approvals, rate 96.2%; Data Scientist, Senior Data Scientist) | 0.8 | live (2026-10-03) | 1.0 | Tailor and send an application (research-and-apply block). |
| BLUEFIN ROBOTICS LLC — Data Scientist | **Consider** | 0.420 | Likely (p 0.6; 3 approvals, rate 100.0%; no title matched) | 0.7 | live (2026-10-03) | 1.0 | Network first: ask a contact about the soft spot before applying. |
| BLUEFIN ROBOTICS LLC — Senior Data Scientist | **Skip** | 0.000 | Likely (p 0.6; 3 approvals, rate 100.0%; no title matched) | 0.9 | closed (2026-10-03) | 1.0 | Skip. Spend the time on networking or credibility hours. |
| CEDAR LOOP HEALTH INC — Data Scientist | **Consider** | 0.210 | None (p 0.0; 0 approvals, rate 0.0%; no title matched) | 0.7 | live (2026-10-03) | 1.0 | Network first: ask a contact about the soft spot before applying. |
| KITE METRICS CORP — Applied Scientist | **Consider** | 0.450 | Likely (p 0.6; 12 approvals, rate 92.3%; no title matched) | 0.8 | live (2026-10-03) | 1.0 | Network first: ask a contact about the soft spot before applying. |

**⚠ Needs a human (G4):** the scorer did not Skip these roles, but the record shows 0 approvals. Fit alone kept them above the Skip line:
- CEDAR LOOP HEALTH INC — Data Scientist (Consider)

## Held at a gate (not scored, nothing invented)

| Role | Gate | Why held | Next action |
|---|---|---|---|
| Quiet Harbor Labs Inc — Data Scientist | G1 | company is in the CSV but Total Approvals is blank: no sponsorship record (not zero) | Treat sponsorship as unknown; network to ask before applying. |
| Nimbus Data Co — Data Scientist | G1 | company not found in sponsorship CSV (exact-name match; may be a naming miss) | Search the CSV by hand for the legal name before deciding. |
| Northwind Analytics Inc — Data Scientist II | G2 | posting liveness never checked | Run: npm run ats:liveness -- https://jobs.example.com/northwind/ds2 |
| Kite Metrics — Data Scientist | G1 | company not found in sponsorship CSV (exact-name match; may be a naming miss) | Search the CSV by hand for the legal name before deciding. |

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
