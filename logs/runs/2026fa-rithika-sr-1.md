## 2026-10-03 — ds-newgrad-h1b-15-2051 triage (worked run, real CSV)

- **Recipe:** recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md v0.1.0 (RUNNABLE-SAMPLE)
- **Inputs:** `course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json` (fictional persona Sasha Jones, 8 roles); `--today 2026-10-03`; `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`; `data/bls/compact/soc_occupation_compact.csv`; liveness from `npm run ats:liveness` on 5 URLs (3 active, 1 expired, 1 uncertain)
- **Outputs:** `course/2026fa/submissions/rithika-sr/worked-run/out/` → `triage-log.json`, `triage-report.md`, `roles.json`, `role-scores.json`, `role-scores.md`
- **Result:** 8 roles → 4 scored, 4 held. Scorer: Apply 3, Skip 1 (Airbnb posting 404 → gated). Held: "Airbnb" and "Instacart" at G1 (name mismatch), $AVY INC at G1 (blank record, not zero), Figma at G2 (checker uncertain). 17/17 offline tests pass.
- **Open issues:** MAPLEBEAR INC Apply is a **false positive**: the builtin.com page states the job was removed Jun 11, 2025, but `ats:liveness` reported it active (confirmed by hand). Two Applies (Airbnb Staff, Nextdoor Senior) come from sponsorship, not fit (flagged ⚠). SOC-specific sponsorship counts are not in repo data.
