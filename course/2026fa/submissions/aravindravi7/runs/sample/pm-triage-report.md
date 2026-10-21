# PM sponsor title-match — triage report (2026-10-03, SAMPLE)

## Executive summary

This report checks 10 product-manager job postings for one question most sponsor lists skip: has the company sponsored work visas *for product-manager titles*, or only for other jobs? It also checks whether each posting is still open and whether the hiring timeline fits the student's remaining work-authorization allowance, then says what to do next with each one.

**This run used test (fixture) data, so 6 rows are demonstrations (DEMO) with no actionable verdict.** The "Would be if live" column shows what the scorer computed: Apply 1 · Consider 4 · Skip 1. Nothing on fixture data clears a gate.

Of 10 postings, 6 were scored only as a demonstration and 4 are on hold because something could not be verified. No row in this report is actionable. 3 postings are at companies whose sponsorship record shows a product-manager-family title; 3 are at companies that sponsor visas but show no such title in the record.

Nothing here is a guarantee of sponsorship. The record shows past filings, not future intent. Every "apply" still needs a named human to confirm the employer uses E-Verify (required for STEM OPT).

## Decisions and next actions

| Decision | Would be if live | Employer tier (yours unless marked) | Company — role | Composite | Sponsorship evidence | Liveness | Gates (G2 liveness · G4 E-Verify) | Next action (3-3-2 block) |
|---|---|---|---|---|---|---|---|---|
| **DEMO** | Apply (0.570) | 3 | Stripe — Product Manager: New Grad Accelerator | 0.570 | Proven (title-family-match); approvals 1250; PM titles on record: "Product Manager" | active [fixture] | not cleared — fixture · open — E-Verify not checked | none (demo) [—]: Demonstration on fixture data — not actionable. See would_be_if_live for what the scorer computed. |
| **DEMO** | Consider (0.430) | 3 | Databricks — Associate Product Manager, New Grad | 0.430 | Possible (sponsor-not-pm); approvals 1640; PM titles on record: none | active [fixture] | not cleared — fixture · open — E-Verify not checked | none (demo) [—]: Demonstration on fixture data — not actionable. See would_be_if_live for what the scorer computed. |
| **DEMO** | Consider (0.420) | 3 | Datadog — Technical Program Manager II | 0.420 | Likely (adjacent-family); approvals 340; PM titles on record: "PRODUCT MANAGER" | active [fixture] | not cleared — fixture · open — E-Verify not checked | none (demo) [—]: Demonstration on fixture data — not actionable. See would_be_if_live for what the scorer computed. |
| **DEMO** | Consider (0.355) | 3 | Reddit — Product Manager, Ads | 0.355 | Possible (sponsor-not-pm); approvals 408; PM titles on record: none; ambiguous, not counted: "Advertiser Optimization PM" | active [fixture] | not cleared — fixture · open — E-Verify not checked | none (demo) [—]: Demonstration on fixture data — not actionable. See would_be_if_live for what the scorer computed. |
| **DEMO** | Consider (0.240) | 3 | Ramp — Product Manager, Vendor Intelligence | 0.240 | None (no H-1B record in this dataset — absence, not proof of non-sponsorship); matched RAMP BUSINESS CORP | active [fixture] | not cleared — fixture · open — E-Verify not checked | none (demo) [—]: Demonstration on fixture data — not actionable. See would_be_if_live for what the scorer computed. |
| **DEMO** | Skip (0.000) | 3 | MongoDB — Senior Product Manager | 0.000 | Proven (title-family-match); approvals 462; PM titles on record: "Senior Product Manager" | expired [fixture] | not cleared — fixture · open — E-Verify not checked | none (demo) [—]: Demonstration on fixture data — not actionable. See would_be_if_live for what the scorer computed. |
| **HOLD** | — | 1 | Anthropic — Product Manager, Claude Science | — | not matched | active [fixture] | not cleared — fixture · open — E-Verify not checked | resolve-hold [—]: company-not-in-csv: no CSV row whose normalized name equals "ANTHROPIC"; supply csv_name after checking by hand |
| **HOLD** | — | 3 | Figma — Technical Program Manager - Infrastructure | — | Possible (sponsor-not-pm); approvals 188; PM titles on record: none | unchecked | held — unchecked · open — E-Verify not checked | resolve-hold [—]: liveness-unchecked: URL not in any liveness file — run liveness-json.mjs on it |
| **HOLD** | — | 3 | Stripe — Product Manager, Payments | — | Proven (title-family-match); approvals 1250; PM titles on record: "Product Manager" | uncertain [fixture] | held — uncertain · open — E-Verify not checked | resolve-hold [—]: liveness-uncertain: checker: content present but no visible apply control found — a human opens the posting |
| **HOLD** | — | 4 | Peloton Interactive — Product Manager, Connected Fitness | — | not matched | active [fixture] | not cleared — fixture · open — E-Verify not checked | resolve-hold [—]: ambiguous-company-match: matches PELOTON INTERACTIVE INC / PELOTON INTERACTIVE LLC |

## Holds — a human must resolve these

- **Anthropic — Product Manager, Claude Science** (tier 1): `company-not-in-csv` no CSV row whose normalized name equals "ANTHROPIC"; supply csv_name after checking by hand
- **Figma — Technical Program Manager - Infrastructure** (tier 3): `liveness-unchecked` URL not in any liveness file — run liveness-json.mjs on it
- **Stripe — Product Manager, Payments** (tier 3): `liveness-uncertain` checker: content present but no visible apply control found — a human opens the posting
- **Peloton Interactive — Product Manager, Connected Fitness** (tier 4): `ambiguous-company-match` matches PELOTON INTERACTIVE INC | PELOTON INTERACTIVE LLC

## Funding context (record — not a vote in the scorer)

| Company (CSV row) | Latest funding date | Stage | Amount | In Form D samples? |
|---|---|---|---|---|
| STRIPE INC | 2024-04-08 | Series D+ | $694,159,778 | not-in-sample |
| DATADOG INC | 2015-12-28 | Series C | $94,507,338 | not-in-sample |
| DATABRICKS INC | 2025-09-08 | Series D+ | $1,074,999,900 | 2025Q4_d filed 31-DEC-2025, sold $4,082,050,250 (acc. 0001587468-25-000010); 2025Q4_d filed 31-DEC-2025, sold $23,017,200 (acc. 0001587468-25-000009) |
| MONGODB INC | 2014-12-10 | Series C | $100,000,000 | not-in-sample |
| REDDIT INC | 2021-08-11 | Series D+ | $700,000,000 | not-in-sample |
| RAMP BUSINESS CORP | 2025-07-28 | Series D+ | $599,999,270 | not-in-sample |
| FIGMA INC | 2024-05-15 | Series D+ | $415,749,740 | not-in-sample |

The Form D samples hold 200 of 58329 filings, so "not-in-sample" says nothing about whether a company raised money.

## Per-filing evidence — DOL labor condition applications (context)

A certified LCA means the employer *filed* for this kind of title (the step before an H-1B petition). It is **not** a visa approval and does not mean anyone was hired. "Unknown" means no LCA employer name matched exactly; it is not evidence of absence.

| Company — role | LCA status | PM-family LCAs (certified: same family / other family) | Hiring vs continuation (certified) | SOC codes used (certified) | Offered wage, annual (certified) | Sample case numbers |
|---|---|---|---|---|---|---|
| Stripe — Product Manager: New Grad Accelerator | lca-pm-filed | 13 / 6 (of 19 PM rows; 0 certified-withdrawn) | 13 new or change-employer · 6 continuation-only | 11-9041.00 Architectural and Engineering Managers ×2; 11-3021.00 Computer and Information Systems Managers ×4; 41-9031.00 Sales Engineers ×1; 15-1299.09 Information Technology Project Managers ×8; 15-1252.00 Software Developers ×1; 15-2031.00 Operations Research Analysts ×3 | $140,400 – $274,456 (median $185,994, n=19) | I-200-25318-407943, I-200-26028-596910, I-200-26044-639179, I-200-26044-639265, I-200-26050-650810 |
| Databricks — Associate Product Manager, New Grad | lca-pm-filed | 6 / 6 (of 12 PM rows; 0 certified-withdrawn) | 8 new or change-employer · 4 continuation-only | 11-3021.00 Computer and Information Systems Managers ×4; 15-2051.01 Business Intelligence Analysts ×1; 15-1252.00 Software Developers ×1; 15-1299.09 Information Technology Project Managers ×3; 15-1299.08 Computer Systems Engineers/Architects ×1; 15-1211.00 Computer Systems Analysts ×2 | $131,560 – $242,320 (median $169,822, n=12) | I-200-25307-363645, I-200-25317-406701, I-200-26021-578500, I-200-26058-671066, I-200-26065-686198 |
| Datadog — Technical Program Manager II | lca-pm-filed | 1 / 6 (of 7 PM rows; 0 certified-withdrawn) | 5 new or change-employer · 2 continuation-only | 15-1299.09 Information Technology Project Managers ×6; 15-2051.00 Data Scientists ×1 | $181,000 – $295,000 (median $205,000, n=7) | I-200-25321-413671, I-200-26107-808014, I-200-26112-822816, I-200-26122-861396, I-200-26160-994265 |
| Reddit — Product Manager, Ads | lca-pm-filed | 1 / 2 (of 3 PM rows; 0 certified-withdrawn) | 2 new or change-employer · 1 continuation-only | 15-1299.09 Information Technology Project Managers ×3 | $231,925 – $260,000 (median $260,000, n=3) | I-200-25345-475838, I-200-26068-689922, I-200-26104-792654 |
| Ramp — Product Manager, Vendor Intelligence | lca-pm-filed | 1 / 0 (of 1 PM rows; 0 certified-withdrawn) | 1 new or change-employer · 0 continuation-only | 15-1299.09 Information Technology Project Managers ×1 | $181,293 – $181,293 (median $181,293, n=1) | I-200-26051-654053 |
| MongoDB — Senior Product Manager | lca-pm-filed | 6 / 0 (of 7 PM rows; 1 certified-withdrawn) | 5 new or change-employer · 1 continuation-only | 17-2112.00 Industrial Engineers ×1; 13-1161.00 Market Research Analysts and Marketing Specialists ×2; 15-2051.01 Business Intelligence Analysts ×1; 15-1252.00 Software Developers ×1; 15-1299.09 Information Technology Project Managers ×1 | $95,682 – $186,222 (median $173,701, n=6) | I-200-25316-402555, I-200-26002-530417, I-200-26014-557113, I-200-26063-678187, I-200-26089-740725 |
| Anthropic — Product Manager, Claude Science | lca-confirmed-none (no PM LCA in FY2026 Q1–Q3, H-1B only) | — | — | — | — | — |
| Figma — Technical Program Manager - Infrastructure | lca-pm-filed | 1 / 1 (of 2 PM rows; 0 certified-withdrawn) | 1 new or change-employer · 1 continuation-only | 15-1299.09 Information Technology Project Managers ×1; 13-1082.00 Project Management Specialists ×1 | $161,080 – $245,000 (median $203,040, n=2) | I-200-26027-592469, I-200-26131-891712 |
| Stripe — Product Manager, Payments | lca-pm-filed | 13 / 6 (of 19 PM rows; 0 certified-withdrawn) | 13 new or change-employer · 6 continuation-only | 11-9041.00 Architectural and Engineering Managers ×2; 11-3021.00 Computer and Information Systems Managers ×4; 41-9031.00 Sales Engineers ×1; 15-1299.09 Information Technology Project Managers ×8; 15-1252.00 Software Developers ×1; 15-2031.00 Operations Research Analysts ×3 | $140,400 – $274,456 (median $185,994, n=19) | I-200-25318-407943, I-200-26028-596910, I-200-26044-639179, I-200-26044-639265, I-200-26050-650810 |
| Peloton Interactive — Product Manager, Connected Fitness | lca-pm-filed | 0 / 1 (of 1 PM rows; 0 certified-withdrawn) | 0 new or change-employer · 1 continuation-only | 15-1299.09 Information Technology Project Managers ×1 | $158,974 – $158,974 (median $158,974, n=1) | I-200-25323-422672 |

Extract: `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/data/lca/lca-pm-filings-fy2026_q3.csv` (10936 rows, verified against pin, record). context only (v0.2.0-pre: tier use pending the student's review sheet).

## Role quality (context only — carries no weight)

There is no O*NET occupation called "Product Manager". The SOC code a company files under is chosen at visa-filing time and is not on the posting, so the national median wage below is shown for each plausible code rather than picked for you.

| SOC (your-input candidate) | BLS title | National median |
|---|---|---|
| 11-3021 | Computer and Information Systems Managers | $171,200 |
| 11-2021 | Marketing Managers | $161,030 |
| 15-1299 | Computer Occupations, All Other | $108,970 |
| 13-1111 | Management Analysts | $101,190 |
| 13-1082 | Project Management Specialists | $100,750 |
| 15-1199 | — | missing: no-occupation-row |

Spread across candidate codes: $100,750 – $171,200. That spread is why this recipe keeps the scorer's role-quality weight at 0.

## What was verified vs. what was assumed

- **Record** (read from a real file in the repo or produced by a real check): approvals, denials, sponsored-title strings, funding dates, BLS medians, the liveness checker's verdict, the title-family classification (a fixed rule applied to record strings).
- **Your input** (the person decided): fit ratings, OPT end date, unemployment days used, hiring-lag assumption, candidate SOC codes, any `csv_name` used to resolve a company match, a named human's liveness or E-Verify check, the tier→number mapping and the timeline steps.
- **Fixture** (test data, never a record): fit, liveness, timeline on the DEMO rows. Fixture values cannot clear a gate and produce no verdict.
- **Model judgment**: none. Every employer tier here is your own, and no language model was called during this run.
- **Not checked by this tool**: whether a PM sponsorship exists beyond the top titles the CSV stores; what this employer pays; whether the posting will sponsor *this* hire. E-Verify is checked only where a named human recorded it.
- **Filings by the same FEIN under a different trade name are not grouped by the join** (1,249 FEINs affected).
- **Form D coverage is the shipped sample only**: 200 of 58329 filings, so a company's absence from it says nothing about its funding.

## Run record

- As-of: 2026-10-03 · mode: sample · recipe v0.2.0 · rules v0.1.1 (`scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/fixtures/rules.v0.1.1.json`, fixture)
- 80 Days CSV: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 rows, sha256 eccdee2addf4…, record)
- Liveness: `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/fixtures/liveness.sample.txt` (text, 9 URLs, fixture)
- Form D: 4 sample files, 200 of 58329 companies shipped
- Scorer: `node scripts/score/role-scorer.mjs course/2026fa/submissions/aravindravi7/runs/sample/roles.json --profile course/2026fa/submissions/aravindravi7/runs/sample/scorer-profile.json --out-dir course/2026fa/submissions/aravindravi7/runs/sample` → ✓ scored 6 roles → Apply 1 · Consider 4 · Skip 1 (skip 17%)
- Full per-term trace: `pm-triage-log.json` (agent log) and `role-scores.md` (scorer's own audit).

*Gate status: see the Gates column. A gate counts as cleared only by a real check or a named human, never by fixture data, and the run is accepted only when a named person records it in the run log.*
