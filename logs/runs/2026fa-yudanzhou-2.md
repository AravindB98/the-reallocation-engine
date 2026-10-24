# Run log: 2026fa-yudanzhou-2

## Executive summary

First real-data run of the da-sponsor-triage mode (v0.2). The repo's job-board scanner and liveness checker were run against 14 funded Data Analyst sponsors. Of 17 real analyst-titled openings, none was worth applying to for a new-graduate F-1 persona once the location and seniority gates applied. The run exposed two wrong board matches and a liveness misread on a JavaScript careers site.

## 2026-10-20 — da-sponsor-triage live-postings run

- **Mode:** recipes/cases/2026fa/yudanzhou-da-sponsor-triage.md v0.2.0 (status RUNNABLE-SAMPLE after this run; audits read by yudanzhou 2026-10-20)
- **Inputs:** 80-Days CSV · Form D samples · fixtures/portals.da.yml (14 companies) · fixtures/postings.real-2026-10-20.json (17 real postings, captured 2026-10-20) · runs/01-ats-liveness-2026-10-20.txt · gate-decisions-2026-10-20.json · persona is-ms-2027-da-focus (fictional)
- **Commands:** find_da_boards.py · npm run ats:scan -- --dry-run · npm run ats:liveness -- --file … · triage.py (pass 1, pass 2, final) · sensitivity.py (real + demo)
- **Outputs:** assignments/submissions/yudanzhou/runs/{pass1,pass2,final,sensitivity-real,sensitivity-demo}/ and runs/00–06 terminal captures
- **Result:** 38 funded DA sponsors → 14 boards → 380 jobs → 17 analyst-titled → pass 1 Apply 3 (one in India, two senior) → with new gates 0 scored → final Apply 0. Sensitivity: 0 of 30 variants change a decision (demo baseline 5 scored).
- **Gates:** GL 1 non-US, 1 unclear · GS 1 · G2 13 active / 4 expired (conflict with board API, Pinterest) · G3 factor 1.0 · G1b: 2 of 9 Greenhouse boards belong to other companies · decisions logged by yudanzhou (r13, r15 rejected)
- **Open issues:** keyword families miss some analyst titles · 24 of 38 sponsors have no public board found · 5 Lever boards' ownership unconfirmed · no OPT-hiring/E-Verify data · upstream role-scorer prints `skip NaN%` with zero roles
