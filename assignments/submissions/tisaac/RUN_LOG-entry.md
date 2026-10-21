# RUN_LOG entry — case-swe-stem-opt-runway

Entries in the `logs/RUN_LOG.md` format (`recipes/_shared.md` → Logging Rules), filed with the submission as the assignment allows ("or include it in your submission"): for student PRs, `logs/RUN_LOG.md` is a protected path. Full output: `WORKED-RUN.md`.

## 2026-10-21 — case-swe-stem-opt-runway run 1 (hand-picked)

- **Recipe:** recipes/case-swe-stem-opt-runway.md v0.1.0 (status RUNNABLE-SAMPLE)
- **Inputs:** scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21-handpicked.json (3 public Greenhouse postings picked by hand + 1 dead job id); liveness-2026-10-21-handpicked.json; data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
- **Outputs:** assignments/submissions/tisaac/run-1-handpicked/ (mode-run.json, mode-report.md, my-roles.json, role-scores.json, role-scores.md)
- **Result:** 4 → Apply 1 · Consider 0 · Skip 3 · Held 0 (skip 75%). Dead job id gated by the board signal; `npm run ats:liveness` called it active.
- **Open issues:** postings chosen by hand with an unsaved filter (replaced in run 2); "Toast" not matched to `TOAST INC`.

## 2026-10-21 — case-swe-stem-opt-runway run 2 (filtered selection)

- **Recipe:** recipes/case-swe-stem-opt-runway.md v0.1.0 (status RUNNABLE-SAMPLE)
- **Inputs:** select-postings.mjs + scope.json on boards klaviyo, toast, duolingo (540 listed, snapshot postings-2026-10-21/); jobs-2026-10-21.json (23 + 1 dead job id); liveness-2026-10-21.json (checked 2026-10-21T19:26:27Z); same CSV
- **Outputs:** postings-2026-10-21-audit.md; assignments/submissions/tisaac/run-2-selected/
- **Result:** 24 → Apply 14 · Consider 0 · Skip 10 · Held 0 (skip 42%). Selection audit read; filter errors found and fixed before this run. Tests 13/13 and 21/21.
- **Open issues:** all 5 Toast postings skipped as `no-matched`.

## 2026-10-21 — case-swe-stem-opt-runway run 3 (name gate cleared)

- **Recipe:** recipes/case-swe-stem-opt-runway.md v0.1.0 (status RUNNABLE-SAMPLE)
- **Inputs:** scope.json with `csv_name.toast = "TOAST INC"` (my own match, after SEC EDGAR address check); selection replayed from the run-2 snapshot (no network); same liveness evidence and CSV
- **Outputs:** assignments/submissions/tisaac/run-3-name-resolved/
- **Result:** 24 → Apply 19 · Consider 0 · Skip 5 · Held 0 (skip 21%).
- **Open issues:** skip rate below the healthy ~50%, because `fit` is a fixed 0.5 placeholder and the mode cannot tell roles apart within a company. Visa-timeline, ban, and title gates not cleared per role; no application sent. Duolingo has no row in the CSV.
