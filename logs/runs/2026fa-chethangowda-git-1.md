## 2026-10-03 — chethangowda-git-ai-sde-coop-h1b sample run

- **Recipe:** recipes/cases/2026fa/chethangowda-git-ai-sde-coop-h1b.md v0.1.0 (DRAFT)
- **Inputs:** `scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/fixtures/candidates.sample.json` (hypothetical postings, your-input); `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (record); `scripts/score/role-scorer.mjs` (unmodified CLI)
- **Outputs:** `scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/out/triage-log.json`, `out/triage-report.md`, `out/{coop-path,no-coop-path}/role-scores.{json,md}`; terminal captures in `course/2026fa/submissions/chethangowda-git/runs/`
- **Result:** 7 candidates → 3 stopped before scorer (`no-company-match` 1, `no-sponsorship-record` 1, `missing-gate-value: liveness` 1) · 4 scored × 2 scenarios. Co-op path: Apply 2 · Consider 0 · Skip 2 (skip 50%). No-co-op path: Apply 1 · Consider 0 · Skip 3 (skip 75%). Offline test 16/16; mutant test 13/16 (exit 1, as intended). Baseline `npm run score` on `data/examples/ch11-roles.json`: Apply 2 · Consider 1 · Skip 2.
- **Gate decisions:** G5 (human decision on the report): not cleared. No named human has reviewed the decisions yet.
- **Open issues:** 5 typed TODOs (automated liveness; co-op conversion data source; role-specific sponsorship; fit vote; role-quality weight). `npm run ats:liveness` failed (Playwright browser missing). Doctor does not scan `recipes/cases/`.
