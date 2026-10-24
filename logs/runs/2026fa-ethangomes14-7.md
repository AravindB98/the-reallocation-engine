### 2026-10-21 — data-engineer-h1b sponsor screen v0.5.1 (live, every gate cleared by Ethan Gomes)

- **Recipe:** recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md v0.5.1 (status RUNNABLE-SAMPLE → RUNNABLE-LIVE)
- **Change:**
  - `--mode sample|live` in `sponsor-screen.mjs`. The log had hardcoded `sample`.
  - `localToday()` in `lib.mjs`, now used by all three scripts. `fetch-greenhouse-status.mjs` and `find-greenhouse-postings.mjs` had dated "today" in UTC.
  - Two tests, for 23 in all.
  - Frozen pre-review alias file `samples/aliases-2026-10-20.json` (sha256 b3282e9224ef), so the 2026-10-20 sample run still reproduces.
- **Inputs:**
  - `samples/candidates-2026-10-20.json` (19 postings, unchanged; sha256 24c2d70c414c)
  - `samples/liveness-2026-10-21.txt` (checked 2026-10-21; sha256 275a2a348adc)
  - `samples/greenhouse-status-2026-10-21.json` (checked 2026-10-21; sha256 f23f016c8233)
  - `aliases.json` (4 entries, 4 reviewed; sha256 8d73af90403c)
  - persona electrifier (fictional) · sponsor CSV sha256 eccdee2addf4
- **Commands:**
  1. `npm run ats:liveness -- <19 URLs>` → `samples/liveness-2026-10-21.txt`
  2. `fetch-greenhouse-status.mjs --candidates samples/candidates-2026-10-20.json --out samples/greenhouse-status-2026-10-21.json`, run twice (see Open issues)
  3. `sponsor-screen.mjs --mode live --today 2026-10-21 --candidates … --liveness …-2026-10-21.txt --greenhouse-status …-2026-10-21.json --out-dir assignments/submissions/ethangomes14/runs/screen-2026-10-21-live`
  4. `verify-against-csv.py` on that log, then `node --test …`, conformance, `npm run verify`, `npm run doctor`
- **Outputs:**
  - `assignments/submissions/ethangomes14/runs/screen-2026-10-21-live/{screen-log.json, screen-report.md, roles.json, role-scores.json, role-scores.md}`
  - `runs/terminal-live-2026-10-21.txt` · `runs/terminal-greenhouse-2026-10-21.txt`
  - kept as bug evidence: `runs/screen-2026-10-21-live-BUG-before-date-fix/` and `samples/greenhouse-status-2026-10-21-BUG-utc-dated.json`
- **Result:** 19 candidates → Apply 8 · Consider 10 · Skip 1 · unscored 0.
  - Fit floor capped 2 (klaviyo-7809608003, roku-8201216).
  - Through reviewed aliases: Gemini, Upstart and Unite Us → Apply (Proven); Robinhood × 2 → Consider (Possible).
  - Skip+unscored 5%. That is below the scorer's ~50% healthy-run line, but the boards were picked because the companies sponsor, so it is not a fair skip-rate test.
  - Invariant violations: 0.
- **Verification:**
  - Python `csv` cross-check: 19/19 values, CSV hash match, row accounting 19 = 0+8+10+1, 0 closed-gate rows not Skip.
  - Greenhouse cross-check covered 19/19 links (all 200).
  - Liveness: 18 active, 1 uncertain (Stripe, as on 2026-10-03 and 2026-10-20).
  - 23/23 tests · conformance, `npm run verify` and `npm run doctor` pass.
- **Gate decisions (all by Ethan Gomes, 2026-10-21):**
  - **G1:** accepted all four aliases: Gemini → GEMINI SPACE STATION LLC, Robinhood → ROBINHOOD MARKETS INC, Upstart → UPSTART NETWORK INC, Unite Us → UNITE USA INC. Legal names were checked with a Google search and recorded in `aliases.json` (`reviewed_by_person`, `reviewed_on`, `review_note`). He also confirmed the six exact matches (Sigma Computing, Klaviyo, Gusto, Airbnb, Stripe, Roku) and their Data Engineer-family titles.
  - **G2:** opened all 18 "active" links and confirmed each shows its job. The three possibly-evergreen postings (Robinhood 4738660, first published 2022-12-08; Robinhood 7729014, 2026-03-18; Airbnb 7998356, 2026-06-10) are confirmed on the page, but whether they are still being filled is **unknown**, so Ethan is not acting on them. Stripe stays Skip (`uncertain`), with no override.
  - **G3:** confirmed the timeline inputs: OPT start 2027-03-01, 90-day limit, 0 days used, 10-day buffer, 45-day hiring lag (deadline 2027-05-20, slack 80 days).
  - **G4:** read the live report, `screen-2026-10-21-live/screen-report.md`.
- **Open issues:**
  - **The date bug.** The first Greenhouse fetch (20:40 EDT) was stamped 2026-10-22 (UTC). The screen treated it as unusable (stale), so the first live run had no API cross-check. Fixed in v0.5.1, re-fetched and re-run; both mis-dated artifacts are kept.
  - **What the review rests on.** The alias review relies on a search-engine check; the Unite Us row's website field (`unite-usa.com`) still differs from the company's domain. Whether the three evergreen postings are being filled is unknown. Fit ratings are still Claude's, from titles only.
  - **Still open:** the `[TODO: DATA SOURCE]` for DOL LCA data. Greenhouse only; 14/37 board guesses were wrong.
