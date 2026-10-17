# Run log — 2026fa-SmitPatel-31-2

## Executive summary

The first run of the newgrad-swe-bigsponsor mode on **real job postings**. It found new-grad postings on three
real company job boards, checked whether each posting was still open, and triaged them. The one company with the
strongest evidence that it sponsors entry-level software engineers (Pinterest) was skipped. The posting-check
tool called its page "expired" even though the company's own job listing still shows it, because the careers
site blocks automated browsers. It was moved to the "needs a person" list instead of being skipped. A made-up job link was
correctly handed to a person rather than scored.

## 2026-10-17 — newgrad-swe-bigsponsor real-postings run

- **Mode:** recipes/case-newgrad-swe-bigsponsor.md v0.1.0 (status at run: DRAFT)
- **Inputs:** persona `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-dec-grad.json` (fictional) · portals `…/fixtures/portals-newgrad.yml` (Pinterest, Databricks, Stripe Greenhouse boards) · postings `…/fixtures/postings-live-2026-10-17.json` (4: 3 real, 1 deliberate non-existent id) · `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` · `data/bls/compact/soc_occupation_compact.csv`
- **Run by:** Claude Code (AI agent), for Smit Patel, on a local branch `mode/SmitPatel-newgrad-swe-bigsponsor`
- **Commands (verbatim):**
  1. `REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/portals-newgrad.yml npm run ats:scan -- --dry-run`
  2. `npm run ats:liveness -- "https://www.pinterestcareers.com/jobs/?gh_jid=7838591" "https://stripe.com/jobs/search?gh_jid=8128744" "https://stripe.com/jobs/search?gh_jid=8212508" "https://job-boards.greenhouse.io/stripe/jobs/1000000001"`
  3. `npm run ats:liveness -- "https://job-boards.greenhouse.io/pinterest/jobs/7838591" "https://job-boards.greenhouse.io/stripe/jobs/8128744"` (cross-check)
  4. `node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --postings scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/postings-live-2026-10-17.json --today 2026-10-17 --out-dir scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out-live`
- **Outputs:** `…/out-live/` → triage-log.json · triage-report.md · roles.json · role-scores.json · role-scores.md. The scan dry run wrote nothing (`git status` unchanged).
- **Result:**
  - scan: `Companies scanned: 3 · Total jobs found: 1786 · Filtered by title: 1766 removed · Filtered by location: 18 removed · New offers added: 2`
  - liveness: `Results: 2 active  1 expired  1 uncertain` (exit 1); cross-check `Results: 1 active  1 expired  0 uncertain`
  - triage: `✓ triage 2026-10-17: 4 postings → Apply 0 · Consider 2 · Skip 1 · Needs-human 1`
- **Findings:**
  - Liveness false "expired": Pinterest 7838591 is listed by `boards-api.greenhouse.io/v1/boards/pinterest/jobs/7838591` (HTTP 200), but the board URL redirects to pinterestcareers.com, which returns 403 to a scripted client. The checker sees < 300 chars and calls it expired. The gate multiplies Pinterest (sponsorship Proven) to 0.
  - Liveness on a non-existent id: the Greenhouse API returns 404, but the board URL redirects to Stripe's careers search page, so the checker says `uncertain`, not `expired`. The mode routed it to Needs-human (G2 `liveness-unknown-status`). It was not scored.
  - Scan location filter: Stripe's US new-grad SWE posting (location `San Francisco, Seattle, New York`) was dropped because the string contains no `US`/`USA`. A non-engineering `University Recruiter` posting passed the title filter.
  - No posting states a start date, so all three were estimated as the OPT start (2027-01-11). That is the most favourable case.
- **Gate decisions (human):** G1, G3, G4 cleared by Smit Patel, 2026-10-17; G2-Pinterest delegated; G2-r04 (break test) still PROPOSED
  - G1 company-match: PINTEREST INC, STRIPE INC each match exactly one row. **Accepted** — cleared by Smit Patel, 2026-10-17.
  - G2 liveness, Pinterest r01: checker `expired` vs API listed. **Decided: send to a person.** Neither verdict is accepted. Re-run with r01 marked `disputed` (`…/fixtures/postings-live-2026-10-17-g2.json`, checker verdict kept as `checker_status`) → `✓ triage 2026-10-17: 4 postings → Apply 0 · Consider 2 · Skip 0 · Needs-human 2` (`…/out-live-g2/`). Next step: open the posting in a normal browser before deciding Apply. Smit gave no preference and delegated the call to Claude, 2026-10-17.
  - G2 liveness, Stripe r04 (break test): proposed: accept as not-a-posting; no action.
  - G3 timeline, Stripe r02/r03: **Keep Consider**; ask the recruiter for the start date before spending networking time. "Immediate Start" in r03's title suggests an earlier start than a cohort role. — cleared by Smit Patel, 2026-10-17.
  - G4 entry-level evidence, Stripe: top titles show plain `Software Engineer` only (Likely, not Proven). **Accepted** — cleared by Smit Patel, 2026-10-17.
- **Open issues:** the Needs-a-person row for a disputed posting suggests re-running the checker, which fails the same way; checker false-expired on bot-blocked careers sites; checker never says `expired` for a redirect-to-search; scan location filter misses US city-only strings; no stated start dates; the persona is fictional, so this is not a real job recommendation.
