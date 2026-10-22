# Run log — 2026fa-contactshyam14-code-2

## Executive summary

This is the record of the first runs of a new mode that works out which government occupation code an early-career project-manager or supply-chain job would be filed under, and refuses to give a single answer when the plausible codes disagree. It ran on two real postings and seven written test postings. One real posting (an Inventory Planner near Fort Worth) was refused as ambiguous: its codes are $23,110 apart and one has no published wage. The other (Zipline) was stopped because the repository's posting check could not confirm it was live. Nothing is ranked, because the work-permit card dates have not been entered. A person still has to read the report and sign it.

## 2026-10-21 — case-em-pm-supply-chain-soc-resolver v0.1.0 — sample run (two real postings, seven fictional)

- **Recipe:** `recipes/cases/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver.md` v0.1.0 (card `…card.md`).
- **Downloads (approved by the owner in chat):**
  - BLS `https://www.bls.gov/oes/special-requests/oesm24ma.zip`, fetched 2026-10-21T19:44:27Z, HTTP 200, 40,189,821 bytes, sha256 `7bf915fc…d35d9`.
  - BEA `https://apps.bea.gov/regional/zip/MARPP.zip`, fetched 2026-10-21T19:44:41Z, HTTP 200, 146,479 bytes, sha256 `5dbf2e6a…34c83e`.
  - Both raw files are in `data/bls/local-wage/raw/`, excluded from git. Also installed locally: pandas 2.2.3 into the gitignored `.venv`, and Playwright Chromium for 1.62.1.
- **Commands (verbatim in `course/2026fa/submissions/contactshyam14-code/worked-run.md`):**
  - `npm run ats:liveness` on both real URLs, plus Greenhouse's own board URL for Zipline.
  - `npm run ats:scan -- --dry-run`, default config and with the mode's portals file.
  - `trim_local_wage.py` run with `python -I`.
  - `posting-from-raw.mjs` for both real postings.
  - `soc-resolver.mjs` on 9 postings, then a re-run comparing the JSON.
  - `local-wage-adjustment.py`: via `npm run` (fails on Windows) and directly.
  - `npm run score`; `node --test`; `npm run verify`; `npm run doctor`.
- **Inputs:**
  - Real postings: `real-zipline-7818180003` (Greenhouse API, first published 2026-07-27, updated 2026-10-15) and `real-rs-1439895033` (SuccessFactors, datePosted 2026-10-21, validThrough 2026-10-24).
  - 4 samples and 3 break tests, all fictional employers.
  - Persona with EAD dates **not entered** and the STEM answer **not recorded**.
  - Wage data: `scripts/contrib/…/data/*.csv` (see `PROVENANCE.md`).
- **Outputs:** `course/2026fa/submissions/contactshyam14-code/runs/01-2026-10-21/` containing `soc-resolver.json`, `soc-resolver.md`, `roles.json`, `role-scores.json`, `role-scores.md`.
- **Result:** RESOLVED 0 · AMBIGUOUS-REFUSE 1 · STOP 8. Ranked 0, because the visa-timeline gate is STOP.
  - **RS Inventory Planner:** liveness `active`; EXPERIENCE-FIT ("1-3 years" under Essential, minimum 1); DEGREE-NOT-REQUIRED (Desirable + "or equivalent combination").
    - Candidates: 13-1081 ($80,880), 43-5061 ($57,770, job zone 2, clerical flag), 13-1023 (no OEWS row).
    - National spread $23,110 (40.0%); DFW adjusted spread $21,467 (40.3%) → **AMBIGUOUS-REFUSE**.
  - **Zipline Business Operations Manager, Supply Chain:** liveness `uncertain` ("content present but no visible apply control found") on both the zipline.com URL and the Greenhouse board URL → **STOP at liveness**. `ats:scan --dry-run` lists the job from the Greenhouse API, so a human must decide.
    - Analysis only: EXPERIENCE-FIT ("1-10+ years", minimum 1); DEGREE-NOT-REQUIRED (degree under "Major Bonuses" only); pay in the posting text $147,800–$285,200.
    - Candidates: 15-1299, 11-3021, 11-3071, 13-1111, 11-1021, 13-1082. National spread $70,450 → would be AMBIGUOUS-REFUSE.
    - Job-board seniority label "Senior Level, Lead/Staff" conflicts with the text.
  - **Samples:** all stop at liveness (no URL, by design). Spread analysis is AMBIGUOUS-REFUSE for all four. Sample 4 is the near-boundary "2+ years required, 3+ preferred" case: EXPERIENCE-FIT on 2, with 3 noted as preferred.
  - **Break tests:** 5+ years → STOP at experience; Marketing Coordinator → STOP at scope; "Bachelor's degree a plus" → DEGREE-NOT-REQUIRED.
  - **Employer matching:** both real employers are MISSING from 80 Days (exact match only). Substring look-alikes were rejected (2 for Zipline, 3 for RS Group).
- **Verification:**
  - The re-run gave identical postings, summary and visa JSON.
  - National 13-1081 median 80880 and DFW 13-1081 median 77110 match the raw xlsx, read with an independent parser.
  - BEA DFW 2024 RPP is 103.090; 77110 / 1.0309 = 74,798.72 = the script's output.
  - 80 Days: 1,557 of 30,369 rows have Total Approvals. Positive control: the exact-name matcher returns 1LIFE HEALTHCARE INC 2.0 / 0.0, as in the raw file.
- **Tests:** `node --test` 43/43. The mutation (preferred years counted as required) was caught by 2 failing tests, then restored.
- **Conformance:**
  - Baseline before any change: `npm run verify` exit 1 on this Windows machine, because `python3` is the Microsoft Store alias. `npm run doctor` exit 0, but it reported a missing tool.
  - With `.venv/Scripts` (holding `python3.exe`) first on PATH: see the worked run for final exit codes.
- **Gate decisions:** Zipline liveness gate (checker said uncertain, "no visible apply control"): cleared by Shyam Sundar J G, 2026-10-21, after opening the posting in a browser (page loaded, Apply button worked, title matched). No other gate cleared; the work-permit timeline gate stays STOP (not cleared) because the card dates are not entered.
- **Open issues:**
  - `local-wage-adjustment.py` labels a `#` (top-coded) median as `suppressed-small-sample`, and its `.venv` hop fails via `npm run` on Windows. Proposed as a maintainer patch, not applied.
  - The scorer's `role_quality` weight of 0 means the score spread can't separate SOCs.
  - No SOC column in 80 Days; no OMB delineation file; no BLS EP experience table.
  - The RS posting expires around 2026-10-24.
- **Sample-run adequacy (sets the recipe's `last_gate`):** read by Shyam Sundar J G, 2026-10-21. I re-ran the 43 offline tests (all pass), the liveness check on the two real postings (RS Group active, Zipline uncertain, same as the saved run), the resolver on two postings (both stopped, none ranked because my EAD dates are not entered), and `npm run verify` and `npm run doctor` (both pass). I also checked the numbers against the raw files with an independent script (written by the AI session, run by me): Logisticians in Dallas-Fort Worth has a raw median of 77110 and a price index of 103.090, so 74,798.72 matches the report, and the raw 80 Days file shows blank approvals for the Zipline and RS Group name matches. I judge this enough for RUNNABLE-SAMPLE because every gate behaved as designed, but it only shows the mode refuses correctly, not which occupation code an employer would file. I disagree with nothing beyond the limits already listed above, except that the checker's uncertain result for Zipline stays unresolved by the tool itself. I opened the posting in a browser on 2026-10-21 and it loaded, the Apply button worked and the title matched, so I treat it as live on my own judgment.
- No secrets, no personal contact details, no private application notes.
