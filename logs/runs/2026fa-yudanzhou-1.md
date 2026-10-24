# Run log: 2026fa-yudanzhou-1

## Executive summary

First sample run of the is-funded-sponsor-triage recipe on shipped data with a fictional persona and demo postings. It ran end to end through the existing scorer. Four of nine postings were held out for missing or unchecked evidence rather than guessed. The run surfaced one upstream scorer bug and one recipe weakness (large consultancies pass as "funded").

## 2026-10-02 — is-funded-sponsor-triage sample run

- **Recipe:** recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.md v0.1.0 (RUNNABLE-SAMPLE)
- **Inputs:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` · `data/sec/form-d/processed/sample/*.sample.json` · `search/examples/is-ms-2027-funded-undecided/persona.example.json` (fictional) · `.../fixtures/postings.sample.json` (demo) · `--today 2026-10-02`
- **Command:** `python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py --today 2026-10-02`
- **Outputs:** `course/2026fa/submissions/yudanzhou/runs/triage/{roles.json, role-scores.json, role-scores.md, triage-log.json, triage-report.md}`
- **Result:** 9 postings → 5 scored, 4 held out. Scorer: Apply 4 · Consider 0 · Skip 1 (skip 20%). Tests: 11/11 pass offline.
- **Gates:** G1 pass · G2: 1 held out `liveness-unchecked`; 1 expired → factor 0 · G3 factor 1.0 (window ends 2027-08-30) · G4 reviewed by yudanzhou
- **Open issues:** demo liveness is `your-input`, not a real check · no OPT-hiring/E-Verify data · DELOITTE CONSULTING LLP passes as "funded" (Series C label) and scores Apply · skip rate below the healthy ~50% because demo postings were hand-picked · upstream `role-scorer.mjs` `applyProfile` treats "work authorized" text as not needing sponsorship (not changed; outside namespace)
- **Correction 2026-10-20:** the status above was overclaimed. With 4 open TODOs the honest stage was DRAFT (review of 2026-10-12); the recipe's frontmatter now says DRAFT. Successor: `recipes/cases/2026fa/yudanzhou-da-sponsor-triage.md` v0.2.0.
