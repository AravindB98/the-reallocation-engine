## 2026-10-01 — de-mlops-h1b sample run

- **Recipe:** recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md v0.1.0 (status DRAFT)
- **Inputs:** persona `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json` (fictional); postings `…/sample/postings.json` (12: 11 real Greenhouse postings fetched 2026-10-01 + 1 fabricated job id; fit/start_date placeholder? **yes**); liveness `…/sample/liveness.txt` (written 2026-10-01, one URL per call); CSV `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` + Form D samples + BLS compact (SHA-256 in the JSON log)
- **Commands:** `node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs --persona scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json --postings scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json --liveness scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt`; `npm run score -- scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/roles.json --out-dir course/2026fa/submissions/gnanasudharsan/runs`; `node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/`
- **Outputs:** `course/2026fa/submissions/gnanasudharsan/runs/2026-10-01/{de-mlops-h1b-log.json, de-mlops-h1b-report.md, role-scores.json, role-scores.md, prototype-stdout.txt}`; break-test outputs in `course/2026fa/submissions/gnanasudharsan/runs/break/`
- **Result:** 6 scored (Apply 2 · Consider 4 · Skip 0), 6 held (5 `liveness-unconfirmed`, 1 `not-in-dataset`); not-apply rate 50% (scored-only skip rate 0%); scorer `profile_needs_sponsorship = true`; 14/14 offline tests pass; mutant (blank → 0) caught by 2 tests.
- **Gate decisions:** none cleared by a human yet. G0 passed on its automated checks; G1–G3 outcomes are listed per posting in the report, awaiting the student's review. No gate cleared itself.
- **Open issues:**
  - One Apply is a "Remote – Ireland" role: no location gate (`[TODO: DEV]`).
  - Keyword false positive (Solutions Architect – Data Engineering).
  - Multi-URL `ats:liveness` calls interrupt each other (10/12 `uncertain`). Maintained script not patched; reported for the maintainer.
  - Scorer regex at `scripts/score/role-scorer.mjs:60` reads "not yet authorized" as authorized. Guarded by exit 3; maintainer decision.
  - Fit and start dates are placeholders.
  - `npm run verify` manifest step fails locally (Python `yaml` module missing).
