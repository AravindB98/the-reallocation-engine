# Sponsor shortlist — entry-level software engineer, F-1 OPT

This report checks 12 companies you are considering against sponsorship history in the 80 Days to Stay data and against your own OPT countdown, then says Apply, Consider or Skip for each one with every input labeled. 3 could be scored on sponsorship history; 1 on the OPT-bridge track (live posting and timeline only, no sponsorship score); and 8 could not be handled, with the reason in the table. Nothing here is a final decision: a person has to clear the liveness gate for each posting. Treat funding information as old: the data ends 2025-09-26, 372 days before the as-of date.

## Results

| Company | Posting | Status | Tier [record→rule] | Approvals / rate [record] | Funding [record] | Rec | Next action |
|---|---|---|---|---|---|---|---|
| VERKADA INC | Backend Engineer - Connectivity | scored | Proven | 272 / 98.6% | 2024-12-20 (recent) | Apply | Tailor an application (2-hour block). |
| COHERE HEALTH INC | Software Engineer II | scored | Likely | 104 / 98.1% | 2025-05-07 (recent) | Consider | Tailor only if the Apply list is exhausted; note the soft spot. |
| TALENT VINE | Software Engineer (Full Stack) – Early Career | excluded | — | — | — | — | Skip: posting states U.S. citizenship required; employer is an unnamed client of a staffing agency [your-input, read from the posting by a human] |
| INTUIT INC | Software Engineer 1 (New College Grad) | not-in-csv | — | — | — | — | No record in this dataset (built from startup funding filings, so large or public employers are often absent). Absence is not evidence either way: check the legal entity name, then look for the employer's own sponsorship record. |
| CONFIDO INC | New Grad Software Engineer | scored | None | — / —% | 2024-06-25 (stale) | Skip | Skip. |
| BOEING | Software Engineer - Entry Level (Boeing Intelligence & Analytics) | excluded | — | — | — | — | Skip: requires an active TS/SCI with Polygraph clearance, which to my knowledge requires U.S. citizenship; on-site only [your-input, read from the posting by a human] |
| MOTION RECRUITMENT PARTNERS | Backend DevOps Engineer (Senior DevOps / Embedded, 6+ years) | opt-bridge-open | — | — | — | — | OPT-bridge candidate. Apply only if the role is in your field and a person has confirmed it is allowed on your OPT (contract terms, employer requirements). No sponsorship record is needed or used. |
| DATABRICKS INC | Software Engineer | no-posting | Proven | 1640 / 99.5% | 2025-09-08 (recent) | — | Network target: sponsor history in the record; no posting URL was supplied (not checked whether one exists). |
| WHATNOT INC | Software Engineer | no-posting | Proven | 134 / 98.5% | 2024-12-24 (recent) | — | Network target: sponsor history in the record; no posting URL was supplied (not checked whether one exists). |
| GRAMMARLY INC | Software Engineer | no-posting | Proven | 156 / 96.3% | 2025-07-17 (recent) | — | Network target: sponsor history in the record; no posting URL was supplied (not checked whether one exists). |
| FOURSQUARE LABS INC | Software Engineer | no-posting | Proven | 56 / 100% | 2025-04-07 (recent) | — | Network target: sponsor history in the record; no posting URL was supplied (not checked whether one exists). |
| Google | Software Engineer | not-in-csv | — | — | — | — | No record in this dataset (built from startup funding filings, so large or public employers are often absent). Absence is not evidence either way: check the legal entity name, then look for the employer's own sponsorship record. |

Scorer: ✓ scored 3 roles → Apply 1 · Consider 1 · Skip 1 (skip 33%). Healthy runs skip at least half.

## Verified vs. inferred

| Item | Label | How |
|---|---|---|
| Total approvals, approval rate, sponsored title list, funding date and stage | record | copied from the 80 Days CSV row (sha256 in the log) |
| Sponsorship tier and its probability | rule over record fields; thresholds are your-input | Proven needs ≥10 approvals and a non-senior software title; p = {"Proven":0.9,"Likely":0.6,"Possible":0.3,"None":0} |
| "Non-senior software title" | inference from title wording | the CSV lists top titles only; it does not say a company hires entry-level |
| Liveness factor | your-input | transcribed from a human-run `npm run ats:liveness`; not checked by this program |
| Timeline factor | your-input | OPT start 2027-01-15, 90-day window (ends 2027-04-15), hiring lag 45 days, as-of 2026-10-03: 194 days remain, factor 1 |
| OPT-bridge rows (`opt-bridge-open` / `opt-bridge-closed`) | rule over your-input | only the liveness result you typed and the timeline arithmetic; contract status, field relevance and whether the role is allowed on your OPT are NOT checked here. Confirm with your school's international office and the employer |
| Fit | your-input | one flat value (0.5) for every company; it does not rank companies |
| Role quality, SOC 15-1252 Software Developers | record, informational only | national median wage 133080 (OEWS 2024), cognitive pivot score 3.834. The scorer's role_quality weight is 0, so this changes no decision. National, not entry-level, not local. |

## Human gate

Gate status: **NOT CLEARED**. No named human has reviewed these rows. To clear: open each Apply/Consider posting by hand, confirm it is live, and log your decision with name and date in `logs/runs/`.
