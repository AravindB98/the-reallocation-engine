# TEST-REPORT — swe-h1b-15-1252

## Executive summary
**What:** test record for the swe-h1b-15-1252 prototype (F-1 OPT, Software Engineer roles).
**Why:** to show it runs from a clean checkout, fails clearly on its named cases, and touches only my paths.
**Found:** runs from a clean clone; 7/7 offline tests pass; every named failure case stops without inventing a value; one deliberate code sabotage was caught by 2 tests.
**Did not do:** test against full (gitignored) SEC data, re-check liveness after 2026-10-01, or test on Linux/Windows.

## 1. Toolchain baseline

| When | `npm run doctor` | `npm run verify` |
|---|---|---|
| Before (fresh fork, 2026-10-01) | environment ✓ runnable; 33 recipes tracked | conformance 158 files all conform; manifest passed, 3 warnings |
| After (clean clone of my branch, commit 8f0ea70) | environment ✓ runnable; 33 recipes tracked | manifest passed, same 3 warnings |

The 3 warnings are pre-existing (W1 `archive/`, W2 `private/`, W2 `data/ats/`). W2 contradicts the assignment's statement that `private/` and `data/ats/` are gitignored, so I used only fictional personas.
Doctor counts 33 recipes before and after: it does not scan `recipes/cases/`, so my recipe is not doctor-checked. I ran `node scripts/conformance.mjs recipes/cases/2026fa/` instead (2 files conform).

## 2. Sample run (clean clone)

`python3 scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/run.py` → 8 roles: score 2 · network 3 · held 3 · skip 0. The scorer ran (`returncode: 0` in run.json). Raw output is in Appendix A.

## 3. Failure cases exercised

| Case | How | Observed | Expected |
|---|---|---|---|
| Company not in CSV | sample run, "Nonexistent Robotics Co" | held, reason names normalized key | held, no score |
| Blank approvals | sample run, `$AVY INC` | held: "blank is not zero" | held, never p = 0 |
| Brand name ≠ legal name (predicted) | sample run, "6sense" | held as not found | miss (prediction confirmed) |
| Ambiguous match | fixture "Twin" (TWIN CO + TWIN INC) | held: ambiguous | held |
| Liveness uncertain | fixture | held | held |
| No live posting, sponsor evidence | sample run, Abacus / 1upHealth / 317 Labs | network_target | network_target |
| OPT date past | `--today 2027-04-01` on real data | ERROR, exit 2, no output folder | stop, no outputs |
| CSV missing | `--csv data/does-not-exist.csv` | ERROR, no output folder | stop |
| Output over tracked path | test: `--out-dir data/examples` | exit 2 | refuse |
| **Deliberate sabotage** | liveness made to always return 1.0 | 2 tests FAILED (route + "3 != 2" scored roles) | tests catch it |
| Sabotage reverted | `git checkout -- run.py` | 7 tests OK, tree clean | OK |

## 4. A check that misled me
The first past-OPT break printed `exit: 0`. In a pipe, `$?` is `tee`'s exit code, not Python's. Re-run without the pipe printed `exit: 2`.

## 5. Only my paths changed
`git diff --stat origin/main...HEAD`: 17 files, all under `course/2026fa/submissions/jayant-majji-14/`, `scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/`, `recipes/cases/2026fa/`, and `logs/runs/2026fa-jayant-majji-14-1.md`. Full listing is in Appendix A. `npm install` rewrote `package-lock.json` twice; I restored it with `git checkout -- package-lock.json` each time.

## 6. PII scan
`node scripts/pii-scan.mjs`: 1 finding, `package-lock.json` (`i@izs.me`). It is pre-existing on `origin/main` (commit d08afdd, line 606, the npm `glob` deprecation notice), not introduced by this branch, and left untouched because it is outside my namespace. My files have none; the test `test_personal_columns_are_never_copied` checks the prototype never copies the CSV's `phone` column.

## 7. What the gate still requires a human to judge
Both scored roles are "Senior" titles for an MS-level persona; the scorer has no seniority term. A human must also decide whether "6sense" should be re-run under its legal name, and whether a 2026-10-01 liveness check still holds.
## Appendix A — raw output (pasted by command; home and temp paths redacted)

### doctor-before
```

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v23.7.0
  ✓ python3    Python 3.14.6

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.8
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
  ✓ verify         scripts/conformance.mjs
  ✓ manifest-check scripts/manifest-check.mjs
  ✓ eval:score     scripts/eval/score-run.mjs
  ✓ eval:report    scripts/eval/report.mjs
  ✓ doctor         scripts/doctor.mjs
  ✓ bls:local-wage scripts/bls/local-wage-adjustment.py
  ✓ build-instructions scripts/build-instructions.mjs
  ✓ to-markdown    scripts/to-markdown.mjs
  ✓ score          scripts/score/role-scorer.mjs
  ✓ score:gates    scripts/score/gate-harness.mjs
  ✓ ats:dedup      scripts/ats/dedup-tracker.mjs
  ✓ ats:liveness   scripts/ats/check-liveness.mjs
  ✓ ats:merge      scripts/ats/merge-tracker.mjs
  ✓ ats:normalize  scripts/ats/normalize-statuses.mjs
  ✓ ats:scan       scripts/ats/scan.mjs
  ✓ ats:verify     scripts/ats/verify-pipeline.mjs
  ✓ resumes:pdf    scripts/resumes/generate-pdf.mjs
  ✓ svg-to-png     scripts/svg-to-png.mjs
  ✓ audit:layout   scripts/svg-layout-audit.mjs
  ✓ postsvg-to-png scripts/svg-layout-audit.mjs
  ✓ skill-demand   scripts/score/skill-demand-monitor.mjs
  ✓ skill-demand:test scripts/score/skill-demand-monitor.test.mjs
  ✓ fetch-postings scripts/ats/fetch-real-postings.py
  ✓ pii-scan       scripts/pii-scan.mjs

DOMAIN DIRECTORIES
  ✓ data/sec
  ✓ data/bls
  ✓ data/ats
  ✓ data/80-days-to-stay
  ✓ scripts/sec
  ✓ scripts/bls
  ✓ scripts/ats
  ✓ scripts/resumes

PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

### verify-before
```

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

### clean-doctor
```

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v23.7.0
  ✓ python3    Python 3.14.6

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.8
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
  ✓ verify         scripts/conformance.mjs
  ✓ manifest-check scripts/manifest-check.mjs
  ✓ eval:score     scripts/eval/score-run.mjs
  ✓ eval:report    scripts/eval/report.mjs
  ✓ doctor         scripts/doctor.mjs
  ✓ bls:local-wage scripts/bls/local-wage-adjustment.py
  ✓ build-instructions scripts/build-instructions.mjs
  ✓ to-markdown    scripts/to-markdown.mjs
  ✓ score          scripts/score/role-scorer.mjs
  ✓ score:gates    scripts/score/gate-harness.mjs
  ✓ ats:dedup      scripts/ats/dedup-tracker.mjs
  ✓ ats:liveness   scripts/ats/check-liveness.mjs
  ✓ ats:merge      scripts/ats/merge-tracker.mjs
  ✓ ats:normalize  scripts/ats/normalize-statuses.mjs
  ✓ ats:scan       scripts/ats/scan.mjs
  ✓ ats:verify     scripts/ats/verify-pipeline.mjs
  ✓ resumes:pdf    scripts/resumes/generate-pdf.mjs
  ✓ svg-to-png     scripts/svg-to-png.mjs
  ✓ audit:layout   scripts/svg-layout-audit.mjs
  ✓ postsvg-to-png scripts/svg-layout-audit.mjs
  ✓ skill-demand   scripts/score/skill-demand-monitor.mjs
  ✓ skill-demand:test scripts/score/skill-demand-monitor.test.mjs
  ✓ fetch-postings scripts/ats/fetch-real-postings.py
  ✓ pii-scan       scripts/pii-scan.mjs

DOMAIN DIRECTORIES
  ✓ data/sec
  ✓ data/bls
  ✓ data/ats
  ✓ data/80-days-to-stay
  ✓ scripts/sec
  ✓ scripts/bls
  ✓ scripts/ats
  ✓ scripts/resumes

PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

### clean-verify
```

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 165 files (88 md · 38 py · 30 js · 5 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

### clean-run
```
✓ 8 roles → score 2 · network 3 · held 3 · skip 0
  course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/run.json  +  course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/report.md
```

### test-1
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
Ran 7 tests in 0.007s

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

### break-1
```
ERROR: OPT end date 2027-03-31 is not after today (2027-04-01); refusing to score, no timeline factor is invented
```

### break-2
```
ERROR: CSV not found: data/does-not-exist.csv
```

### break-3
```
    ~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^
AssertionError: 3 != 2

----------------------------------------------------------------------
Ran 7 tests in 0.007s

FAILED (failures=2)
✓ 9 roles → score 3 · network 1 · held 4 · skip 1
  <tmp>  +  <tmp>
✓ 9 roles → score 3 · network 1 · held 4 · skip 1
  <tmp>  +  <tmp>
✓ 9 roles → score 3 · network 1 · held 4 · skip 1
  <tmp>  +  <tmp>
✓ 9 roles → score 3 · network 1 · held 4 · skip 1
  <tmp>  +  <tmp>
```

### liveness-1
```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/6sense/jobs/7834739?gh_jid=7834739 https://osv-a10networks.wd503.myworkdayjobs.com/en-US/A10CareerSite/job/San-Jose-California/Senior-Software-Engineer--Systems-Platform_R-101319

Checking 2 URL(s)...

✅ active     https://job-boards.greenhouse.io/6sense/jobs/7834739?gh_jid=7834739
✅ active     https://osv-a10networks.wd503.myworkdayjobs.com/en-US/A10CareerSite/job/San-Jose-California/Senior-Software-Engineer--Systems-Platform_R-101319

Results: 2 active  0 expired  0 uncertain
```

### pii-scan-1
```
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — i@izs.me

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
```

### git diff --stat origin/main...HEAD
```
 .../submissions/jayant-majji-14/CHANGE-BRIEF.md    |  49 +++
 .../jayant-majji-14/runs/role-scores.json          | 241 ++++++++++++++
 .../jayant-majji-14/runs/role-scores.md            |  15 +
 .../jayant-majji-14/runs/swe-h1b-sample/report.md  |  53 +++
 .../runs/swe-h1b-sample/role-scores.json           | 109 +++++++
 .../runs/swe-h1b-sample/role-scores.md             |  12 +
 .../jayant-majji-14/runs/swe-h1b-sample/roles.json |  48 +++
 .../jayant-majji-14/runs/swe-h1b-sample/run.json   | 361 +++++++++++++++++++++
 logs/runs/2026fa-jayant-majji-14-1.md              |  32 ++
 .../2026fa/jayant-majji-14-swe-h1b-15-1252.card.md |  68 ++++
 .../2026fa/jayant-majji-14-swe-h1b-15-1252.md      | 151 +++++++++
 .../jayant-majji-14-swe-h1b-15-1252/README.md      |  60 ++++
 .../fixtures/fixture-companies.csv                 |   8 +
 .../fixtures/fixture-input.json                    |  23 ++
 .../2026fa/jayant-majji-14-swe-h1b-15-1252/run.py  | 324 ++++++++++++++++++
 .../sample-input.json                              |  77 +++++
 .../jayant-majji-14-swe-h1b-15-1252/test_run.py    | 101 ++++++
 17 files changed, 1732 insertions(+)
```
