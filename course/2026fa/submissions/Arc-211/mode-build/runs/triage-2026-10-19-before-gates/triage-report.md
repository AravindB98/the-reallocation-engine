# Finance data-engineering triage — 2026-10-19

## Executive summary

This report sorts 20 employer(s) into what to do next for a STEM-OPT master's graduate targeting data-engineering and business-intelligence roles. Each employer was checked against past visa-sponsorship records, the job titles it actually sponsored, its recorded pay level, recent funding, and the visa calendar. Result: 0 worth tailoring an application to (after an E-Verify check where unknown), 0 where the posting itself may not be a target role, 7 large sponsors whose records list only software titles (data roles may be filed under them), 0 to network into, 12 whose job posting still needs checking by hand, and 0 to skip. Nothing here is a hiring prediction; every number below says where it came from, and the final call is yours.

## Run record

- As of: 2026-10-19 · data mode: **sample** (Form D = shipped samples only)
- Sponsorship CSV: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- Scorer: no candidate passed the pre-checks — scorer not called

### How the list was narrowed

| Step | Count | Label |
|---|---|---|
| Companies in CSV | 30369 | record |
| …with any H-1B data | 1557 | record |
| Industry matches `financ\|bank\|insur\|invest\|capital\|fintech\|payment` | 2425 | your-input filter on record |
| …with H-1B data | 34 | record |
| …H-1B blank (unknown, not scored) | 2391 | record |
| …sponsored a data/BI-type title | 12 | model-judgment (title rule) |
| …sponsored only software-type titles (kept for research) | 7 | model-judgment (title rule) |

### Visa-timeline gate (all your-input)

- Program end 2026-12-11; OPT filing deadline 2027-02-09; assumed OPT start 2027-01-25
- Hiring lag 60 days → earliest offer 2026-12-18; unemployment allowance 90 days
- **Factor 1** — offer lands before OPT starts — no unemployment days used

### H-1B lottery attempts (context, not scored; dates are your-input)

- STEM OPT ends 2030-01-24 (OPT start + 36 months); earliest offer 2026-12-18
- **3 of 3 remaining registration window(s) reachable with an earliest offer on 2026-12-18**
- To keep every attempt, an employer must be ready to register you by **2027-03-20**

| Fiscal year | Registration closes (assumed) | State |
|---|---|---|
| FY2028 | 2027-03-20 | reachable |
| FY2029 | 2028-03-20 | reachable |
| FY2030 | 2029-03-20 | reachable |
| FY2031 | 2030-03-20 | after-stem-end |

### Target occupations (BLS national median, record)

- 15-1243.01 Data Warehousing Specialists: $135,980
- 15-1243.00 Database Architects: $135,980
- 15-2051.01 Business Intelligence Analysts: $112,590
- 15-1242.00 Database Administrators: $104,620
- 15-1252.00 Software Developers: $133,080
- 15-1211.00 Computer Systems Analysts: $103,790

## Decisions

| Company | Next action | Score | Sponsorship [record → your-input tier] | Fit [model-judgment] | Liveness [label] | E-Verify [label] | Pay median, all titles [record] | Latest funding [record] |
|---|---|---|---|---|---|---|---|---|
| GEMINI SPACE STATION LLC | **check-posting-by-hand** | — (needs-liveness-check) | 24 appr, 100.0% → Proven | 0.8 | — | unknown [your-input] | $150,000 (meets-floor) | 2021-11-19 |
| GREEN DOT CORP | **check-posting-by-hand** | — (needs-liveness-check) | 92 appr, 100.0% → Proven | 0.8 | — | unknown [your-input] | $122,033 (meets-floor) | 2024-09-06 |
| GUARANTR INC | **check-posting-by-hand** | — (needs-liveness-check) | 60 appr, 100.0% → Proven | 0.5 | — | unknown [your-input] | $110,500 (meets-floor) | 2017-09-01 |
| HOULIHAN LOKEY INC | **check-posting-by-hand** | — (needs-liveness-check) | 84 appr, 93.3% → Proven | 0.5 | — | unknown [your-input] | $135,000 (meets-floor) | — |
| MULLIGAN FUNDING LLC | **check-posting-by-hand** | — (needs-liveness-check) | 4 appr, 100.0% → Weak | 0.5 | — | unknown [your-input] | $100,000 (meets-floor) | 2023-04-24 |
| PROSPER MARKETPLACE INC | **check-posting-by-hand** | — (needs-liveness-check) | 184 appr, 98.9% → Proven | 0.5 | — | unknown [your-input] | $131,498 (meets-floor) | 2015-04-07 |
| REMITLY INC | **check-posting-by-hand** | — (needs-liveness-check) | 344 appr, 98.9% → Proven | 0.5 | — | unknown [your-input] | $145,274 (meets-floor) | 2017-11-10 |
| RYAN SPECIALTY GROUP LLC | **check-posting-by-hand** | — (needs-liveness-check) | 14 appr, 100.0% → Likely | 0.8 | — | unknown [your-input] | $92,000 (meets-floor) | 2020-09-01 |
| SIMPL INC | **check-posting-by-hand** | — (needs-liveness-check) | 2 appr, 100.0% → Weak | 0.5 | — | unknown [your-input] | $117,187 (meets-floor) | 2021-09-30 |
| SOCIAL FINANCE INC | **check-posting-by-hand** | — (needs-liveness-check) | 182 appr, 100.0% → Proven | 0.8 | — | unknown [your-input] | $169,488 (meets-floor) | 2020-12-30 |
| SOLAR MOSAIC INC | **check-posting-by-hand** | — (needs-liveness-check) | 10 appr, 100.0% → Likely | 0.8 | — | unknown [your-input] | $143,500 (meets-floor) | 2015-04-23 |
| UPSTART NETWORK INC | **check-posting-by-hand** | — (needs-liveness-check) | 316 appr, 99.4% → Proven | 0.8 | — | unknown [your-input] | $160,000 (meets-floor) | 2013-01-17 |
| AMOUNT INC | **research-soc-mismatch** | — (soc-adjacent) | 34 appr, 94.4% → Proven | — | — | unknown [your-input] | $120,259 (meets-floor) | 2024-07-31 |
| BANK OF NEW YORK MELLON CORP | **research-soc-mismatch** | — (soc-adjacent) | 704 appr, 99.2% → Proven | — | — | unknown [your-input] | $145,000 (meets-floor) | — |
| FIRST HELP FINANCIAL LLC | **research-soc-mismatch** | — (soc-adjacent) | 30 appr, 100.0% → Proven | — | — | unknown [your-input] | $136,500 (meets-floor) | 2021-11-03 |
| LENDBUZZ INC | **research-soc-mismatch** | — (soc-adjacent) | 60 appr, 100.0% → Proven | — | — | unknown [your-input] | $125,000 (meets-floor) | 2021-05-13 |
| LOANDEPOTCOM LLC | **research-soc-mismatch** | — (soc-adjacent) | 62 appr, 100.0% → Proven | — | — | unknown [your-input] | $125,031 (meets-floor) | 2015-12-31 |
| RIVER FINANCIAL INC | **research-soc-mismatch** | — (soc-adjacent) | 4 appr, 100.0% → Weak | — | — | unknown [your-input] | $130,000 (meets-floor) | 2021-01-28 |
| VOUCH INC | **research-soc-mismatch** | — (soc-adjacent) | 12 appr, 100.0% → Likely | — | — | unknown [your-input] | $133,000 (meets-floor) | 2024-11-07 |
| JPMORGAN CHASE & CO | **not-in-data** | — (not-found) | — | — | — | — | — | — |

## Why each row

- **GEMINI SPACE STATION LLC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based strong match on fallback — company's sponsored titles (Senior Analytics Engineer | Senior Data Scientist)
- **GREEN DOT CORP** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based strong match on fallback — company's sponsored titles (Lead Engineer, Data Management | Professional 4, Business Intelligence | Professional 3, Business Analytics)
- **GUARANTR INC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based weak match on fallback — company's sponsored titles (Technical Business Analyst)
- **HOULIHAN LOKEY INC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based weak match on fallback — company's sponsored titles (Senior Business Analyst, HCG)
- **MULLIGAN FUNDING LLC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based weak match on fallback — company's sponsored titles (Data Scientist)
- **PROSPER MARKETPLACE INC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based weak match on fallback — company's sponsored titles (Credit Risk Analytics Senior Manager | Operations Analytics Manager)
- **REMITLY INC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based weak match on fallback — company's sponsored titles (SENIOR ANALYST, MARKETING ANALYTICS)
- **RYAN SPECIALTY GROUP LLC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based strong match on fallback — company's sponsored titles (Data Analyst, Catastrophe Modeling)
- **SIMPL INC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based weak match on fallback — company's sponsored titles (Data Scientist)
- **SOCIAL FINANCE INC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based strong match on fallback — company's sponsored titles (Business Intelligence Manager, Relay | Senior Director, Marketing Analytics and Data Science)
- **SOLAR MOSAIC INC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based strong match on fallback — company's sponsored titles (Customer Experience (CX) Ops Data Analyst)
- **UPSTART NETWORK INC** — no liveness check recorded — not sent to the scorer (it would default to 1.0). Fit: rule-based strong match on fallback — company's sponsored titles (Data Engineer)
- **AMOUNT INC** — sponsored titles are software-type only (Software Engineer | Software Engineer, Sr. Analyst | Senior Product Manager) — data roles may be filed as 15-1252; find a data-engineering posting before judging, not scored. Fit: no target-role match on fallback — company's sponsored titles (none) — no fit vote
- **BANK OF NEW YORK MELLON CORP** — sponsored titles are software-type only (Senior Specialist, Full-Stack Developer | Specialist, Back-End Developer | Principal, Full-Stack Developer | Senior Specialist, Back-End Developer | Lead Manager, Application Development) — data roles may be filed as 15-1252; find a data-engineering posting before judging, not scored. Fit: no target-role match on fallback — company's sponsored titles (none) — no fit vote
- **FIRST HELP FINANCIAL LLC** — sponsored titles are software-type only (Senior Software Engineer) — data roles may be filed as 15-1252; find a data-engineering posting before judging, not scored. Fit: no target-role match on fallback — company's sponsored titles (none) — no fit vote
- **LENDBUZZ INC** — sponsored titles are software-type only (Full Stack Engineer | Senior Software Engineer | Machine Learning Engineer | Software Engineer) — data roles may be filed as 15-1252; find a data-engineering posting before judging, not scored. Fit: no target-role match on fallback — company's sponsored titles (none) — no fit vote
- **LOANDEPOTCOM LLC** — sponsored titles are software-type only (SENIOR SOFTWARE ENGINEER | PRODUCT OWNER | DIRECTOR OF PRODUCT MANAGEMENT | DIRECTOR, SOFTWARE ENGINEERING | SENIOR SOFTWARE DEVELOPER IN TEST (SDET) | Sr Software Engineer | IT Service Management Analyst | Software Development Engineer in Test (SDET) | Sr. Software Engineer | Major Incident & Resolution Manager | Sr Software Engineer) — data roles may be filed as 15-1252; find a data-engineering posting before judging, not scored. Fit: no target-role match on fallback — company's sponsored titles (none) — no fit vote
- **RIVER FINANCIAL INC** — sponsored titles are software-type only (Computer Systems Analyst (Product Management)) — data roles may be filed as 15-1252; find a data-engineering posting before judging, not scored. Fit: no target-role match on fallback — company's sponsored titles (none) — no fit vote
- **VOUCH INC** — sponsored titles are software-type only (Software Engineer 2 | Enterprise Business Operations Manager - AI) — data roles may be filed as 15-1252; find a data-engineering posting before judging, not scored. Fit: no target-role match on fallback — company's sponsored titles (none) — no fit vote
- **JPMORGAN CHASE & CO** — company not in the sponsorship CSV — no value invented

## What this run could not verify

- **E-Verify enrollment** — no data in the repo; every "unknown" must be looked up by hand before tailoring (gate G4).
- **Role-specific sponsorship** — the CSV lists only a company's top sponsored titles; a missing data-engineer title is not evidence they never sponsor one.
- **Pay for the actual role** — the company median covers all sponsored titles; the BLS figure is a national occupation median, not an offer.
- **Funding** — the latest-funding date comes from the 80 Days CSV; the Form D cross-check uses a 50-row-per-quarter sample, so "no hit" means "not in the sample".
- **Liveness** — read from a hand-transcribed `ats:liveness` result; this script never touches the network.
- **Lottery dates and rules** — registration-close dates are assumptions from config; selection rules and fees change by year. Confirm with USCIS and the school's international office.
- **Which occupation code an employer files** — the employer's attorney picks it. A software-titled sponsor may or may not file data roles that way.

## Human gate

Before acting on any row: confirm the posting is still live, look up E-Verify, and read the sponsored titles yourself. Record the decision in the run log.
