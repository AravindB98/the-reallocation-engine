# Run log — 2026fa · jayant-majji-14 · run 1

## Executive summary
**What:** first sample run of recipe `swe-h1b-15-1252` v0.1.0 (F-1 OPT, Software Engineer roles, SOC 15-1252 target).
**Why:** to show the prototype runs end to end on shipped repo data and feeds the existing scorer.
**Found:** 8 roles → 2 scored (both Apply), 3 network targets, 3 held, 0 skipped.
**Did not do:** verify SOC-level sponsorship, re-check postings after 2026-10-01, join Form D samples, or get a human sign-off.

*Format note: `logs/RUN_LOG.md` points to an entry template in `recipes/_shared.md`; no such template exists there (checked with `grep -n -i "template" recipes/_shared.md`, no match). This entry mirrors the maintainer entries in `logs/RUN_LOG.md`.*

### 2026-10-02 — swe-h1b-15-1252 v0.1.0 · sample run · RUNNABLE-SAMPLE (human gate NOT signed)

Command: `python3 scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/run.py` (defaults).
Data: shipped CSV `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` only;
no full Form D quarters, no live USCIS lookup. Input: `sample-input.json` (fictional persona,
OPT end 2027-03-31, hiring lag 60 days — both your-input). Timeline: 180 days left → factor 1.0.
Liveness: two postings checked by hand with `npm run ats:liveness` on 2026-10-01, both `active`
(one is Workday, outside the four ATS the engine claims). Routes: score 2 (6SENSE INSIGHTS INC,
A10 NETWORKS INC, both Proven, 62 and 106 approvals), network_target 3 (ABACUS INSIGHTS INC,
1UPHEALTH INC, 317 LABS INC), held 3 ($AVY INC blank approvals; "6sense" brand-name miss;
a fictional not-in-CSV company). Scorer: Apply 2 · Consider 0 · Skip 0, composite 0.465 each,
hand-checked as (0.35×0.9 + 0.30×0.5) × 1 × 1. Scorer's 0% skip rate counts only the 2 roles
that reached it; 6 of 8 were routed away before scoring.

Gates that stopped roles: G1 company match (2), G2 sponsorship evidence (1), G4 liveness → network (3).
Human judgment still needed: both scored roles are Senior titles for an MS-level persona; the
scorer has no seniority term. Broke during testing: none in this run (break attempts recorded
in `course/2026fa/submissions/jayant-majji-14/TEST-REPORT.md`). Next step: alias table for
brand vs legal names (recipe proposed addition 5).

Outputs: `course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/` (run.json, report.md,
roles.json, role-scores.json, role-scores.md).