## 2026-10-03 — msis-pm-network-targets sample run

- **Recipe:** recipes/cases/2026fa/AdityaHasija37-msis-pm-network-targets.md v0.1.0 (DRAFT, 3 TODOs open)
- **Inputs:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows); `scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/boards.sample.json` (Gate A cleared by AdityaHasija37, 2026-10-03; 10 boards); `fixtures/persona.fixture.json` (fictional); `fixtures/sample-responses/` (captured live 2026-10-03, trimmed)
- **Command:** `node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --offline scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses --run-date 2026-10-03`
- **Outputs:** `scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/out/{run-log.json, report.md, roles.json, role-scores.json, role-scores.md, candidates.json}`
- **Result:** candidates 90 → evaluated 11 → apply 4 · consider 0 · network 6 · human-check 0 · board-unknown 0 · skip 1; roles scored 18 (all Apply, 0.525)
- **Gates:** A cleared by AdityaHasija37, 2026-10-03 (4 direct, 4 indirect, 2 corrected) · B 0 fetch failures · C factor 1, 1,216 days left, 60-day lag · D report read by AdityaHasija37, 2026-10-03
- **Checks:** tests 10/10 (also from a clean clone of `dedb123`); conformance OK; `pii-scan --diff`: clean; hand cross-check DATADOG INC: CSV 340.0 / 0.0 / 100.0 = report 340 / 0 / 100%
- **Open issues:** company-level skip rate 9% (filtering happens before evaluation); every scored role 0.525 (all Proven, constant fit), so the scorer does not rank; `role-scorer.mjs` scores a missing liveness as open and labels it `record` (break attempt 2); approval counts are company-wide and undated; E-Verify and STEM-OPT relatedness not checkable; 3 TODOs (board-proposal script, E-Verify data, fiscal years of approvals)
