# Run log — 2026fa-SmitPatel-31-1

## Executive summary

The first recorded sample run of the newgrad-swe-bigsponsor recipe, on a fresh clone with fictional inputs and
the shipped sponsorship CSV. It completed. It recommended one application, sent four to networking first, skipped
three, and handed four to a person. The person's decisions at each gate are recorded below.

## 2026-09-30 — newgrad-swe-bigsponsor sample run

- **Recipe:** recipes/cases/2026fa/SmitPatel-31-newgrad-swe-bigsponsor.md v0.1.0 (status at run: DRAFT)
- **Inputs:** persona `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-dec-grad.json` (fictional) · postings `…/fixtures/postings-sample.json` (fictional) · `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` · `data/bls/compact/soc_occupation_compact.csv` · `--today 2026-09-30`
- **Command:** `node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --today 2026-09-30`
- **Where:** fresh clone of `SmitPatel-31/the-reallocation-engine` at `015843d`, with only this contribution's files added
- **Run by:** Claude Code (AI agent), for Smit Patel
- **Outputs:** `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out/` → triage-log.json · triage-report.md · roles.json · role-scores.json · role-scores.md
- **Result:** `✓ triage 2026-09-30: 12 postings → Apply 1 · Consider 4 · Skip 3 · Needs-human 4` · scorer: `✓ scored 8 roles → Apply 1 · Consider 4 · Skip 3 (skip 38%)` · tests: `# tests 13 # pass 13 # fail 0`
- **Break tests:** closed window → exit 3, nothing written · missing CSV → exit 2 · invalid `--today` → exit 2 · 4 code mutants → all caught
- **Gate decisions (human):**
  - G1 (Google, Meta — no-company-match; Salesforce — ambiguous): Smit left this to the agent's judgment. Claude kept all three **excluded as Unknown**, because the recipe forbids guessing between `SALESFORCE COM INC` and `SALESFORCECOM INC` (identical figures, no way to tell them apart from the CSV), and Google/Meta have no row. Needs a v0.2 data source. — delegated by Smit Patel to Claude, 2026-09-30
  - G2 (all 8 scored liveness values are fixtures, `your-input`; Snowflake unchecked): **accepted for the sample run only.** No decision counts as real until `npm run ats:liveness` has run on real URLs. — Smit Patel, 2026-09-30
  - G3 (Microsoft start date estimated from the 45-day lag, collapsed to OPT start): **downgraded to confirm first.** Keep Consider, but the next action is to ask the recruiter for the start date before spending networking time. — Smit Patel, 2026-09-30
  - G4 (Virtusa `JAVA ENGINEER 2` / `.NET ENGINEER 2` misread as non-swe; Deloitte Consider with no SWE titles): **accepted as scored.** Both logged for v0.2; no override. — Smit Patel, 2026-09-30
- **Open issues:** no real liveness check; title rule v0.1 misreads staffing titles; fit alone nearly lifts a no-SWE-evidence sponsor into Consider; OPT rules not confirmed with the DSO; not run on Node 20 or in CI.
