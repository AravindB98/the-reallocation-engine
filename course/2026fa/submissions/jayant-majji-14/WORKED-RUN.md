# Worked run — swe-h1b-15-1252 v0.1.0

## Executive summary
**What:** one full run of the prototype on the shipped CSV, for a fictional F-1 OPT Software Engineer persona.
**Why:** to show real output and draw the line between what was verified and what was assumed.
**Found:** 8 roles → 2 Apply, 3 network targets, 3 held. Looking closely at the output turned up one labeling error, which I fixed (commit c5ec21d), and one real case of my own predicted failure mode (6sense).
**Did not do:** re-check postings after 2026-10-01, verify SOC-level sponsorship, or get a human sign-off at the review gate.

## Inputs
Persona (fictional, `sample-input.json`): F-1 OPT, target SOC 15-1252, OPT end 2027-03-31, assumed hiring lag 60 days. No real personal data.

| Role | Company (as entered) | Why it's in the run |
|---|---|---|
| 6sense-sse | 6SENSE INSIGHTS INC | live Greenhouse posting |
| a10-sse-systems | A10 NETWORKS INC | live Workday posting |
| abacus / 1uphealth | ABACUS INSIGHTS INC, 1UPHEALTH INC | sponsors, no open posting found 2026-10-01 |
| 317labs-likely | 317 LABS INC | 2 approvals, ambiguous title |
| avy-blank | $AVY INC | in CSV, approvals blank |
| brand-name-miss | 6sense | brand name, not legal name |
| not-in-csv | Nonexistent Robotics Co | fictional |

## Commands (word for word)
npm run ats:liveness -- "https://job-boards.greenhouse.io/6sense/jobs/7834739?gh_jid=7834739" "https://osv-a10networks.wd503.myworkdayjobs.com/en-US/A10CareerSite/job/San-Jose-California/Senior-Software-Engineer--Systems-Platform_R-101319"
python3 scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/run.py
python3 -m unittest discover -s scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252 -p "test_*.py" -v

The real terminal output for each command, plus the generated `report.md` and `role-scores.md`, is pasted in Appendix B.

## Verified vs inferred — line by line (6sense role)

| Value | Label | Basis |
|---|---|---|
| CSV row = `6SENSE INSIGHTS INC` | record | exact normalized match, one row |
| Total Approvals = 62 | record | hand-checked against CSV |
| Total Denials = 0, Approval rate = 100.0 | record | hand-checked against CSV |
| Sponsored titles contain "software" = true | your-input | my substring rule applied to record text |
| Tier = Proven | your-input | my rule: ≥ 10 approvals and a software title |
| Sponsorship p = 0.9 | your-input | convention copied from `data/examples/ch11-roles.json` |
| Fit p = 0.5 | your-input | my judgment: Senior title vs MS-level persona |
| Liveness = active (2026-10-01) → 1.0 | record | `npm run ats:liveness` output |
| OPT end 2027-03-31, hiring lag 60 days | your-input | fictional persona |
| Timeline factor = 1.0 (180 days ≥ 2 × 60) | your-input | my rule |
| Composite = 0.465, decision = Apply | scorer output | computed from the above by `role-scorer.mjs` |

The other routed roles follow the same pattern: approvals are **record**, tiers are **your-input**. Held roles have no tier and no score. **No model-judgment values appear in this run.**

## Verification
1. **Hand cross-check against the source CSV,** read with a separate script, not my prototype. 6sense 62 / A10 106 / $AVY blank all match the `run.json` values, and no CSV row exists under "6sense." Both outputs are in Appendix B.
2. **Arithmetic by hand:** (0.35 × 0.9 + 0.30 × 0.5) × 1 × 1 = 0.315 + 0.150 = 0.465, which matches the scorer.
3. **Tests:** 7/7 pass offline on fixtures (Appendix B).
4. **Deliberate breaks:** past OPT date, missing CSV, and code sabotage. All are recorded in `TEST-REPORT.md` §3.

## Reflection
**What worked.** The gates kept every role without evidence away from the scorer, so nothing was scored on a guess. Sponsors without postings became a networking list instead of disappearing.

**What it got wrong (and what I fixed).** My first version sent sponsorship to the scorer labeled `record`. No record says "0.9"; the record says "62 approvals," and 0.9 comes from my tier rule. The scorer's audit trace was therefore presenting my rule as data. I fixed it to `your-input` in commit c5ec21d and added a test so it can't silently return. The repo's own `ch11-roles.json` uses the same pattern; I noted it rather than editing it.

**What it missed.**
- 6sense's sponsored titles are "Senior Software Engineer" and "Principal Customer Success Manager." With 62 approvals but only top titles listed, I cannot tell how many were software roles, yet the rule says Proven. That is my predicted title-proxy failure, showing up on real data.
- Both Apply roles are Senior titles for an MS-level persona, and nothing in the scorer objects.
- The scorer reports a 0% skip rate because it only sees the 2 roles that cleared my gates; 6 of 8 were routed away first.
- In `run.json`, a held role's tier is JSON `null`, while a zero-approval company's tier is the string `"None"`. Those are easy to confuse.

**Next improvement (concrete).** Add a seniority flag: if a scored title contains Senior, Staff, Principal, or Lead and the persona is MS-level, change the next action from "tailor" to "human review first," and say so in the report. It needs no new data, only the title already in the input.

## Attestation
- Recipe: swe-h1b-15-1252 v0.1.0
- By: Pavan Jayant Majji · 2026-10-02

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `run.py` on shipped CSV (sample persona) | score 2 · network 3 · held 3 · skip 0; scorer returncode 0 | each role routed by its evidence |
| Same, from a clean clone of the branch | identical routes; 7/7 tests OK | runs without local leftovers |
| Hand cross-check of 3 companies vs CSV | values match run.json exactly | match |
| `--today 2027-04-01` (OPT already past) | ERROR, exit 2, no output folder | stop without inventing a factor |
| `--csv data/does-not-exist.csv` | ERROR, no output folder | stop |
| **Break attempt:** liveness code changed to always return 1.0 | 2 tests FAILED | tests catch a broken gate |
| Unit tests after revert | 7/7 OK, tree clean | OK |

### Did not test
- Full SEC Form D quarters (gitignored); only the CSV's funding columns were read.
- Liveness after 2026-10-01; whether Workday detection is reliable.
- Whether the 62 / 106 approval counts match the current USCIS Employer Data Hub.
- Any company with punctuation-heavy or non-ASCII names.
- Linux or Windows; only macOS with Python 3.14 and Node 23.
- Whether the 10-approval threshold or 60-day lag is realistic.
- A human sign-off at the G6 review gate.

### Broke during testing, fixed
- Sponsorship labeled `record` when p came from my rule → relabeled `your-input`, test added (`run.py`, `test_run.py`, commit c5ec21d).
- Absolute paths exposed my home folder in outputs → repo-relative paths via `rel()` (`run.py`, before commit 4832e93).
- `report.md` lacked the P9 executive summary → added (commit daeeb35).
- Playwright browser missing → `npx playwright install chromium`.
- `package-lock.json` rewritten by `npm install` → restored with `git checkout`.
- A past-OPT break showed `exit: 0` because `$?` read `tee` → re-ran without the pipe: exit 2.
- `DOMAIN-JUSTIFICATION.md` saved outside my namespace → moved before committing.

## Appendix B — raw output (pasted by command; home and temp paths redacted)

### liveness-1
```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/6sense/jobs/7834739?gh_jid=7834739 https://osv-a10networks.wd503.myworkdayjobs.com/en-US/A10CareerSite/job/San-Jose-California/Senior-Software-Engineer--Systems-Platform_R-101319

Checking 2 URL(s)...

✅ active     https://job-boards.greenhouse.io/6sense/jobs/7834739?gh_jid=7834739
✅ active     https://osv-a10networks.wd503.myworkdayjobs.com/en-US/A10CareerSite/job/San-Jose-California/Senior-Software-Engineer--Systems-Platform_R-101319

Results: 2 active  0 expired  0 uncertain
```

### run-4
```
✓ 8 roles → score 2 · network 3 · held 3 · skip 0
  course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/run.json  +  course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/report.md
```

### crosscheck-csv
```
'$AVY INC' | approvals '' | denials '' | rate '' | 
'6SENSE INSIGHTS INC' | approvals '62.0' | denials '0.0' | rate '100.0' | ['Senior Software Engineer', 'Principal Customer Success Manager, Strategic']
'A10 NETWORKS INC' | approvals '106.0' | denials '4.0' | rate '96.36363636363636' | ['Solutions Architect', 'Staff Software Engineer', 'Senior Software Engineer', '
```

### crosscheck-run
```
6sense-sse | score | Proven | 62.0 | 
a10-sse-systems | score | Proven | 106.0 | 
abacus-no-posting | network_target | Proven | 22.0 | 
1uphealth-no-posting | network_target | Proven | 12.0 | 
317labs-likely | network_target | Likely | 2.0 | 
avy-blank | held | None | None | company is in CSV but 'Total Approvals' is blank (blank is not zero)
brand-name-miss | held | None | None | '6sense' not found in CSV (normalized key '6SENSE'; exact match after suffix strip only)
not-in-csv | held | None | None | 'Nonexistent Robotics Co' not found in CSV (normalized key 'NONEXISTENT ROBOTICS'; exact match after suffix strip only)
```

### test-2
```
test_blank_approvals_are_not_treated_as_zero (test_run.PrototypeTests.test_blank_approvals_are_not_treated_as_zero) ... ok
test_every_role_gets_the_expected_route (test_run.PrototypeTests.test_every_role_gets_the_expected_route) ... ok
test_every_term_sent_to_scorer_is_labeled (test_run.PrototypeTests.test_every_term_sent_to_scorer_is_labeled) ... ok
test_past_opt_date_fails_without_writing_outputs (test_run.PrototypeTests.test_past_opt_date_fails_without_writing_outputs) ... ERROR: OPT end date 2026-09-01 is not after today (2026-10-01); refusing to score, no timeline factor is invented
ok
test_personal_columns_are_never_copied (test_run.PrototypeTests.test_personal_columns_are_never_copied) ... ok
test_refuses_to_write_over_tracked_repo_paths (test_run.PrototypeTests.test_refuses_to_write_over_tracked_repo_paths) ... ERROR: --out-dir <home>/Desktop/the-reallocation-engine/data/examples is inside the repo but outside my namespaced folders; refusing to write
ok
test_timeline_factor_linear_band (test_run.PrototypeTests.test_timeline_factor_linear_band) ... ok

----------------------------------------------------------------------
Ran 7 tests in 0.012s

OK
✓ 9 roles → score 2 · network 1 · held 5 · skip 1
  <tmp>  +  <tmp>
✓ 9 roles → score 2 · network 1 · held 5 · skip 1
  <tmp>  +  <tmp>
✓ 9 roles → score 2 · network 1 · held 5 · skip 1
  <tmp>  +  <tmp>
✓ 9 roles → score 2 · network 1 · held 5 · skip 1
  <tmp>  +  <tmp>
```

### generated report.md
````
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
````

### generated role-scores.md
````
# Role Scorer report — 2026-10-02

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 2 roles → Apply 2 · Consider 0 · Skip 0. **Skip rate 0%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| 6SENSE INSIGHTS INC — Senior Software Engineer | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.5·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| A10 NETWORKS INC — Senior Software Engineer, Systems Platform | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.5·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
````
