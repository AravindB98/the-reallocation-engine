## 2026-10-02 — ms-is-swe-opt-shortlist run 1 (sample data, real postings)

This entry records one run of the shortlist prototype for an entry-level software engineer search on F-1 OPT. It scored 3 of 12 entries, checked 1 on the OPT-bridge track, and left the rest unscored with reasons. No human has cleared the liveness gate.

- **Recipe:** ms-is-swe-opt-shortlist v0.1.0 (status DRAFT, 4 open TODOs)
- **Inputs:** `course/2026fa/submissions/Vrajesh-works/real-run-postings.json`; `--as-of 2026-10-03 --opt-start 2027-01-15` (placeholder dates, not the student's real ones); `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` (30,369 rows, newest funding date 2025-09-26)
- **Outputs:** `course/2026fa/submissions/Vrajesh-works/runs/shortlist-log.json`, `shortlist-report.md`, `roles.json`, and the scorer's `role-scores.json` / `role-scores.md`
- **Command:** `node scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.mjs --postings course/2026fa/submissions/Vrajesh-works/real-run-postings.json --as-of 2026-10-03 --opt-start 2027-01-15 --out-dir course/2026fa/submissions/Vrajesh-works/runs`
- **Result:** `3/12 scored · Apply 1 · Consider 1 · Skip 1 (skip 33%)`. Not scored: 2 excluded by a human (citizenship required; TS/SCI clearance required), 2 not in the dataset, 4 networking targets with no posting URL. 1 posting was checked on the OPT-bridge track (`opt-bridge-open`, no sponsorship score).
- **Liveness:** `npm run ats:liveness` printed `active` for 7 URLs on 2026-10-02 and 2026-10-03 (Verkada, Cohere Health, Talent Vine, Intuit, Confido, Motion Recruitment, Boeing). The program did not check liveness itself.
- **Gate:** G4 (human) **not cleared**. No named human has reviewed the postings.
- **Defect found and fixed:** `--as-of 2026-02-30` was accepted (date rolled over to March 2); now rejected with exit 2. Regression assertions added.
- **Open issues:** funding recency is old (data ends 372 days before the as-of date); "entry-level" is not verifiable from the data; Intuit is absent from the dataset; Confido's Skip may be a false negative; funding is not a scorer input and liveness is not automated (TODOs in the recipe); the OPT-bridge track cannot see seniority or fit (the Motion Recruitment row is live but a senior role needing 6+ years); no real expired posting was tested.
- **Not edited:** `logs/RUN_LOG.md`.
