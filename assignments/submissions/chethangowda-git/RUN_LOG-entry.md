# Run-Log Entry — H-1B Wage-Floor Triage (2026-10-21)

## Executive summary

The log record of the day this mode was built and run. It lists what was run, on what, and what
came out, so the result can be traced and repeated. In short: the new wage data and checks were
built and tested (all checks pass, deliberate breaks are caught), and a run on five real, live
job postings ruled three out on their own wording and stopped or deferred the other two; nothing
passed, and no person has yet signed off on the real-run decisions.

This entry is submitted here rather than appended to `logs/RUN_LOG.md`: the assignment allows
"or include it in your submission", and the repository's contributor rules reserve that file.

## Entry

### 2026-10-21 — chethangowda-git-h1b-wage-floor-sde v0.1.0
- **Inputs:**
  - DOL OFLC wage data, wage year 2026–27, hand-downloaded 2026-10-21 (raw folder not committed;
    SHA-256 in `data/oflc/oflc-extract-audit.md`).
  - Sample: 20 fictional postings (`scripts/oflc/fixtures/postings.sample.json`) + 1 fictional
    Greenhouse record.
  - Real: 5 live Greenhouse postings from 4 companies, anonymized A1, A2, B, C, D; earliest start
    2027-06 (your-input scenario).
- **Commands:** `npm run verify` · `npm run doctor` · `extract-prevailing-wages.py` ·
  `wage-timeline-gate.test.py` (+ two mutants) · `npm run ats:liveness` · 80 Days read ·
  `greenhouse-to-gate-input.py` · `wage-timeline-gate.py` — verbatim in `WORKED-RUN.md`.
- **Outputs:**
  - Tracked: `data/oflc/` (20 areas, 41 cities, 44 counties, audit, README);
    `scripts/oflc/` (extractor, converter, gate, test, fixtures); the recipe and card under
    `recipes/cases/2026fa/`.
  - Not committed: `private/real-postings/2026-10-21/` (raw postings, gate inputs, two logs, two
    reports, terminal captures).
- **Result:**
  - Conformance pass (166 files); doctor: no private paths tracked.
  - Test 36/36; mutant A caught (11/36); mutant B, fail-open, caught (34/36, flags only the
    posting it breaks).
  - Liveness: 5 active / 0 expired / 0 uncertain.
  - Gate as posted: PASS 0 · UNCERTAIN 0 · FAIL 0 · SKIP 3 · STOP 2.
  - Gate with start assumed 2027-06: PASS 0 · UNCERTAIN 2 · FAIL 0 · SKIP 3 · STOP 0.
- **Human gate G7:** not cleared — no application decision has been recorded for the two
  UNCERTAIN postings; the text-flag snippets were read during the session.
- **Lifecycle:** RUNNABLE-SAMPLE claimed with 8 typed TODOs open (stated in the recipe).
- **Open issues:**
  - No experience-vs-candidate check; both survivors ask for 5+ / 7+ years.
  - ×2,080 annualization and `GeoLvl` meaning unconfirmed.
  - 80 Days lookup is a one-off read, not a script.
  - No converter for Lever / Ashby / Workday.
  - Repo gaps noted (not fixed): doctor misreads inline-comment status lines and skips
    `recipes/cases/`; conformance skips Markdown under `data/`.
