# Run 2 — opt-countdown — 2026-10-21

## Summary

The opt-countdown mode (v0.2) ran live on a fictional OPT student with 35 days of runway and twelve Massachusetts job postings. No posting was worth applying to now. Six strong sponsors were too slow for the clock; one posting refused sponsorship in its own text; three postings had closed; one company had no sponsorship record; one role reached "Consider". The machine gates passed. Still open: the human sign-off, and a scorer flaw that lets sponsorship history stand in for fit.

- **Recipe:** recipes/cases/2026fa/salonimathure20-opt-countdown.md v0.2.0
- **Mode:** live (posting evidence fetched 2026-10-21 ~19:07 UTC; real shipped CSVs)
- **Inputs:** persona `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/live-2026-10-21/persona.json` (fictional), candidates `…/live-2026-10-21/candidates.json` (12), posting-evidence `…/live-2026-10-21/posting-evidence.json` (checked 2026-10-21), liveness `…/live-2026-10-21/liveness.txt`, aliases `scripts/contrib/2026fa/salonimathure20-opt-countdown/aliases.json`, sponsors CSV `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, SOC CSV `data/bls/compact/soc_occupation_compact.csv`
- **Commands:**
  1. `node scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs --candidates …/candidates.json --dry-run`
  2. `node scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs --candidates …/candidates.json --out …/posting-evidence.json`
  3. `npm run ats:liveness -- --file …/urls.txt` (shared checker, patched in this branch; also run unpatched for comparison)
  4. `node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs --mode live --persona … --candidates … --liveness … --posting-evidence … --out-dir assignments/submissions/salonimathure20/runs/live-2026-10-21/out`
  5. `python3 assignments/submissions/salonimathure20/verify-run.py …` (independent recomputation)
- **Outputs:** `assignments/submissions/salonimathure20/runs/live-2026-10-21/out/` → `opt-countdown-log.json`, `opt-countdown-report.md`, `roles.json`, `scorer-profile.json`, `role-scores.json`, `role-scores.md`; raw terminal output in `…/terminal/`
- **Result:**
  - Runway 35 days, bound by the unemployment clock; a job must start by 2026-11-25.
  - 12 evaluated → Apply 0 · Consider 1 · Skip 9 · G2b 1 · Blocked 1. Skip rate 90% of scored.
  - Consider: Abacus Insights.
  - Skip: 6 gated by timeline (PathAI, Formlabs ×2, Cohere Health, Klaviyo ×2) and 3 gated by liveness (Formlabs BSA and Iterative Health, both closed since 2026-10-03, and the fake Klaviyo ID).
  - G2b: EverQuote ("not eligible for immigration sponsorship").
  - Blocked: CarGurus (`no-company-row`).
- **Gates:** G0 pass · G1 pass · G2 1 blocked (`no-company-row`) · G2b 1 (EverQuote) · G3 3 gated (API 404) · G4 **not yet signed**
- **Verification:** `verify-run.py` 36/36 agree; rerun deterministic; 20/20 tests; mutation check caught 2/2 restored bugs; `pii-scan --diff origin/main` clean.
- **Artifact changes:**
  - `scripts/ats/liveness-browser.mjs`: a job URL redirected off its job ID now reads `uncertain`. This is the single maintained-file patch.
  - New `posting-evidence.mjs`, `aliases.json` and v0.2 tests.
  - Recipe and card bumped to v0.2.0.
- **Open issues:**
  - The shared scorer returns **Apply 0.341 for fit 0** at a Proven sponsor (sponsorship weight 0.35 > threshold 0.30). The Consider row asks for 7+ years against 1. Recipe TODO 3 (DEFINE) and TODO 4 (APPROVE) cover this.
  - Hiring lags and company sizes are unverified inputs that decide 6 of 10 outcomes.
  - No posting-text check for non-Greenhouse ATSs.
  - H-1B counts are possibly doubled (unconfirmed).
  - Four CI harness scripts are missing upstream, so the `harness-regression` job fails on every PR.
  - The working-tree PII scan flags upstream `package-lock.json`.

## G4 sign-off (human)

| Role | Opened posting? | In target SOC? | Lag OK? | Years within reach? | Decision | Name · date |
|---|---|---|---|---|---|---|
| Abacus Insights — Forward Deployed Data Engineer (US) | | | | (posting asks 7+; persona has 1) | | |
