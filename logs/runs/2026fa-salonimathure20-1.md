# Run 1 — opt-countdown — 2026-10-03

## Summary

The opt-countdown prototype ran in sample mode on a fictional OPT student with 53 days of runway and eight Boston-area postings. Six were scored (Apply 1, Consider 2, Skip 3) and two were blocked because the sponsorship data had no H-1B record for them. The machine gates passed. The human sign-off on the Apply and Consider rows is still open, and so is a defect found in the shared liveness checker (a dead job ID reported as active).

- **Recipe:** recipes/cases/2026fa/salonimathure20-opt-countdown.md v0.1.0
- **Mode:** sample (saved liveness and API output; real shipped CSVs)
- **Inputs:** persona `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/persona.json`, candidates `…/fixtures/worked-run/candidates.json`, liveness `…/fixtures/worked-run/liveness.txt`, greenhouse-api `…/fixtures/worked-run/greenhouse-api.txt`, sponsors CSV `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, SOC CSV `data/bls/compact/soc_occupation_compact.csv`
- **Command:** `node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs`
- **Outputs:** `course/2026fa/submissions/salonimathure20/runs/opt-countdown/` → `opt-countdown-log.json`, `opt-countdown-report.md`, `roles.json`, `scorer-profile.json`, `role-scores.json`, `role-scores.md`
- **Result:** runway 53 days (bound by unemployment clock; start by 2026-11-25); 8 evaluated → Apply 1 (Formlabs) · Consider 2 (Iterative Health, PathAI) · Skip 3 (Klaviyo and Toast gated by timeline, Klaviyo ghost gated by liveness) · Blocked 2 (HubSpot no-company-row, DraftKings no-h1b-record-joined); skip rate 50% of scored
- **Gates:** G0 pass · G1 pass · G2 2 blocked (reasons above) · G3 1 gated (Greenhouse API 404) · G4 **not yet signed**
- **Open issues:**
  - `npm run ats:liveness` reported a nonexistent Greenhouse job ID as active (redirect to the careers page); proposed fix is a typed TODO in the recipe.
  - Every H-1B count in the 80 Days CSV is even (1,557 / 1,557 rows), so counts may be doubled.
  - The only Apply sits 0.017 above threshold and depends on a model-judged fit.
  - Hiring lags are assumptions.

## G4 sign-off (human)

| Role | Opened posting? | In target SOC? | Lag OK? | Decision | Name · date |
|---|---|---|---|---|---|
| Formlabs — Business Systems Analyst | | | | | |
| Iterative Health — Clinical Data Specialist | | | | | |
| PathAI — Senior Software Engineer, Fullstack | | | | | |
