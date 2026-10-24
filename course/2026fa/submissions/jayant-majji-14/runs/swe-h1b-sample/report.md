# SWE H-1B triage report (SOC 15-1252 target)

Run date 2026-10-02 · rule v0.1.0 · data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (shipped CSV)
Labels: [record] = from repo data · [your-input] = my assumption or rule · [model-judgment] = a guess

## Executive summary
**What:** sponsor triage for an F-1 OPT student targeting Software Engineer roles; 8 candidate roles checked.
**Why:** on an OPT clock, a confident guess about sponsorship or a dead posting costs days; this sorts roles by recorded evidence instead.
**Found:** 2 scored by the engine, 3 to network into, 3 held for a human, 0 skipped.
**Did not do:** verify SOC 15-1252 directly, match brand names to legal names, re-check postings, or let funding affect a decision (see the last section).

## Timeline gate
OPT ends 2027-03-31 [your-input], 180 days left; assumed hiring lag 60 days [your-input] → factor 1.0 [your-input rule: 0 if days_left < lag; 1 if days_left >= 2*lag; linear in between]

## 1. Scored by the engine → tailor an application (the '2' research-and-apply hours)
| Role | Company | Tier | Approvals [record] | Fit | Liveness [record] |
|---|---|---|---|---|---|
| Senior Software Engineer | 6SENSE INSIGHTS INC | Proven | 62 | 0.5 [your-input] | active (2026-10-01) |
| Senior Software Engineer, Systems Platform | A10 NETWORKS INC | Proven | 106 | 0.5 [your-input] | active (2026-10-01) |

Scorer: `npm run score -- course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/roles.json --out-dir course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample`

```
> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/roles.json --out-dir course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample

✓ scored 2 roles → Apply 2 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/role-scores.json  +  course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/role-scores.md
```
Decisions and per-term audit: see `role-scores.md` in this folder (written by the scorer).
Note: the scorer's skip rate counts only roles that reached it. This prototype routed 6 of 8 roles away before scoring.

## 2. Network targets → informational interview before a role opens (the '3' networking hours)
| Company | Tier | Approvals [record] | Approval rate [record] | Latest funding [record] |
|---|---|---|---|---|
| ABACUS INSIGHTS INC | Proven | 22 | 100.0 | 2024-10-01 |
| 1UPHEALTH INC | Proven | 12 | 100.0 | 2023-04-03 |
| 317 LABS INC | Likely | 2 | 100.0 | 2021-01-19 |

## 3. Held for a human, or skipped
| Role | Company | Route | Reason |
|---|---|---|---|
| avy-blank | $AVY INC | held | company is in CSV but 'Total Approvals' is blank (blank is not zero) |
| brand-name-miss | 6sense | held | '6sense' not found in CSV (normalized key '6SENSE'; exact match after suffix strip only) |
| not-in-csv | Nonexistent Robotics Co | held | 'Nonexistent Robotics Co' not found in CSV (normalized key 'NONEXISTENT ROBOTICS'; exact match after suffix strip only) |

## What this run did NOT verify
- SOC 15-1252: the CSV has no SOC column; 'software' in sponsored job titles is a proxy.
- Company names: normalized exact match only; a brand name (e.g. '6sense') misses the legal name.
- Liveness: pasted from one `npm run ats:liveness` run on the date shown; not re-checked. Workday is not one of the four ATS the engine claims to detect.
- Funding: CSV columns only; Form D samples not joined [TODO: DATA SOURCE]; the scorer has no funding term.
- Approval counts: as shipped in the CSV; not re-checked against the USCIS H-1B Employer Data Hub.
- Tier thresholds and the timeline rule are my assumptions [VERIFY].
