# Sponsor shortlist — entry-level software engineer, F-1 OPT

This report checks 7 companies you are considering against sponsorship history in the 80 Days to Stay data and against your own OPT countdown, then says Apply, Consider or Skip for each one with every input labeled. 4 could be scored; 3 could not, and the table says why. Nothing here is a final decision: a person has to clear the liveness gate for each posting. Treat funding information as old: the data ends 2026-03-01, 215 days before the as-of date.

## Results

| Company | Posting | Status | Tier [record→rule] | Approvals / rate [record] | Funding [record] | Rec | Next action |
|---|---|---|---|---|---|---|---|
| Example Proven Soft Inc | Software Engineer I | scored | Proven | 40 / 95% | 2026-03-01 (recent) | Apply | Tailor an application (2-hour block). |
| EXAMPLE BOUNDARY TEN LLC | Software Developer | scored | Proven | 10 / 90% | 2024-02-01 (stale) | Skip | Network, don't apply: posting is dead but sponsor history is real. |
| EXAMPLE BOUNDARY NINE LLC | Software Engineer | scored | Likely | 9 / 90% | 2026-01-15 (recent) | Consider | Tailor only if the Apply list is exhausted; note the soft spot. |
| EXAMPLE NO SPONSOR INC | Software Engineer | scored | None | — / —% | 2026-02-01 (recent) | Skip | Skip. |
| EXAMPLE SENIOR ONLY INC | Software Engineer | liveness-unresolved | Likely | 50 / 99% | 2025-12-01 (recent) | — | Run: npm run ats:liveness -- https://example.invalid/jobs/5  then transcribe status + checked_on into the postings file. |
| EXAMPLE TWIN INC | Software Engineer | ambiguous | — | — | — | — | Two or more CSV rows match; pick the entity by hand. |
| EXAMPLE NOT IN FILE CORP | Software Engineer | not-in-csv | — | — | — | — | No record found. Check the legal entity name; do NOT assume this company sponsors. |

Scorer: ✓ scored 4 roles → Apply 1 · Consider 1 · Skip 2 (skip 50%). Healthy runs skip at least half.

## Verified vs. inferred

| Item | Label | How |
|---|---|---|
| Total approvals, approval rate, sponsored title list, funding date and stage | record | copied from the 80 Days CSV row (sha256 in the log) |
| Sponsorship tier and its probability | rule over record fields; thresholds are your-input | Proven needs ≥10 approvals and a non-senior software title; p = {"Proven":0.9,"Likely":0.6,"Possible":0.3,"None":0} |
| "Non-senior software title" | inference from title wording | the CSV lists top titles only; it does not say a company hires entry-level |
| Liveness factor | your-input | transcribed from a human-run `npm run ats:liveness`; not checked by this program |
| Timeline factor | your-input | OPT start 2027-01-15, 90-day window (ends 2027-04-15), hiring lag 45 days, as-of 2026-10-02: 195 days remain, factor 1 |
| Fit | your-input | one flat value (0.5) for every company; it does not rank companies |
| Role quality, SOC 15-1252 Software Developers | record, informational only | national median wage 133080 (OEWS 2024), cognitive pivot score 3.834. The scorer's role_quality weight is 0, so this changes no decision. National, not entry-level, not local. |

## Human gate

Gate status: **NOT CLEARED**. No named human has reviewed these rows. To clear: open each Apply/Consider posting by hand, confirm it is live, and log your decision with name and date in `logs/runs/`.
