# Test report — actual assistant environment

## Executive summary
The sample prototype and nine offline tests pass, and its source conforms. The repository verification also exits successfully with inherited warnings. Setup checks expose upstream blockers for live ATS use and the full-tree PII scan; these are recorded instead of hidden, and student-local checks remain necessary.

## Baseline before implementation

```text
$ npm run doctor
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.19.0
  ✓ python3    Python 3.12.14

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.1.3
  ✓ libreoffice present
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

```text
$ npm run verify
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

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

```text
$ npm run ats:scan -- --dry-run
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
```

```text
$ npm run ats:liveness -- https://example.com/job/123
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://example.com/job/123

Checking 1 URL(s)...

Fatal: browserType.launch: Executable doesn't exist at /root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/nikam0420/baseline-runs
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/nikam0420/baseline-runs

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/nikam0420/baseline-runs/role-scores.json  +  course/2026fa/submissions/nikam0420/baseline-runs/role-scores.md
```

The ATS scan exited 1 because portals.yml is absent. The liveness command exited 1 because Playwright Chromium is not installed; no posting status was established and the URL was only a demonstration. The baseline scorer exited 0.

## Prototype, failure exercises and after checks

```text
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py
✓ scored 3 roles → Apply 0 · Consider 1 · Skip 2 (skip 67%)
  course/2026fa/submissions/nikam0420/runs/role-scores.json  +  course/2026fa/submissions/nikam0420/runs/role-scores.md
Sample-only; current liveness NOT verified; human gate PENDING.
enough-time: Consider composite=0.56 days_left=44
closed-posting: Skip composite=0 days_left=44
too-little-time: Skip composite=0 days_left=8
Outputs: course/2026fa/submissions/nikam0420/runs/agent-log.json + human-report.md

```

```text
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/test_prototype.py
test_bad_date (__main__.TestAdapter.test_bad_date) ... ok
test_duplicate_company (__main__.TestAdapter.test_duplicate_company) ... ok
test_existing_scorer_gates_and_labels (__main__.TestAdapter.test_existing_scorer_gates_and_labels) ... ✓ scored 3 roles → Apply 0 · Consider 1 · Skip 2 (skip 67%)
  course/2026fa/submissions/nikam0420/runs/tmpj3vsgig3/role-scores.json  +  course/2026fa/submissions/nikam0420/runs/tmpj3vsgig3/role-scores.md
ok
test_invalid_lag (__main__.TestAdapter.test_invalid_lag) ... ok
test_missing_approval_not_zero (__main__.TestAdapter.test_missing_approval_not_zero) ... ok
test_missing_company (__main__.TestAdapter.test_missing_company) ... ok
test_missing_liveness (__main__.TestAdapter.test_missing_liveness) ... ok
test_output_path_guard (__main__.TestAdapter.test_output_path_guard) ... ok
test_past_deadline (__main__.TestAdapter.test_past_deadline) ... ok

----------------------------------------------------------------------
Ran 9 tests in 0.193s

OK
Sample-only; current liveness NOT verified; human gate PENDING.
enough-time: Consider composite=0.56 days_left=44
closed-posting: Skip composite=0 days_left=44
too-little-time: Skip composite=0 days_left=8
Outputs: course/2026fa/submissions/nikam0420/runs/tmpj3vsgig3/agent-log.json + human-report.md
```

```text
$ node scripts/conformance.mjs scripts/contrib/2026fa/nikam0420-analyst-opt-triage
conformance: 5 files (1 md · 2 json · 2 py)
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

```text
$ npm run verify
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

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

```text
$ npm run doctor
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.19.0
  ✓ python3    Python 3.12.14

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.1.3
  ✓ libreoffice present
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

```text
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — [REDACTED upstream dependency email]

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
```

## Failure interpretation
Missing company, missing approval, duplicate company, missing liveness, malformed date, invalid lag and unsafe output path raise errors without guessed replacement values. An elapsed or too-short deadline closes the timeline gate; a supplied closed posting closes liveness. The integration test uses the actual maintained scorer and verifies both output artifacts, evidence labels and pending human approval.

## Unresolved upstream blocker
The full-tree PII scanner exits 1 on a public dependency maintainer email already present in upstream package-lock.json, outside this student's diff. We did not weaken the scanner or edit the protected/shared project surface to make the result look clean. The student's branch-diff scan must be clean, but that does not replace the required full-tree check. Report this exact inherited finding in the PR and seek instructor/maintainer resolution; do not claim green CI. The existing manifest checker also reports three warnings and exits 0.

## Clean-checkout and diff evidence
Evidence will be appended below after a committed isolated checkout run. Output changes, code, logs and documents are restricted to this student's four namespaces. A human must judge row interpretation, realism of assumptions and whether the sample meaningfully addresses the proposed career situation; no software check substitutes for that judgment.

Privacy note: the public dependency email in the failed PII output is redacted; the finding and exit status are unchanged.

## Isolated clean-checkout result

The implementation commit was checked out into a separate git worktree before these commands. No source changes remained after execution. These are assistant-environment observations, not a student signature.

```text
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py
✓ scored 3 roles → Apply 0 · Consider 1 · Skip 2 (skip 67%)
  course/2026fa/submissions/nikam0420/runs/role-scores.json  +  course/2026fa/submissions/nikam0420/runs/role-scores.md
Sample-only; current liveness NOT verified; human gate PENDING.
enough-time: Consider composite=0.56 days_left=44
closed-posting: Skip composite=0 days_left=44
too-little-time: Skip composite=0 days_left=8
Outputs: course/2026fa/submissions/nikam0420/runs/agent-log.json + human-report.md
```

```text
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/test_prototype.py
test_bad_date (__main__.TestAdapter.test_bad_date) ... ok
test_duplicate_company (__main__.TestAdapter.test_duplicate_company) ... ok
test_existing_scorer_gates_and_labels (__main__.TestAdapter.test_existing_scorer_gates_and_labels) ... ✓ scored 3 roles → Apply 0 · Consider 1 · Skip 2 (skip 67%)
  course/2026fa/submissions/nikam0420/runs/tmpjo2r7wr3/role-scores.json  +  course/2026fa/submissions/nikam0420/runs/tmpjo2r7wr3/role-scores.md
ok
test_invalid_lag (__main__.TestAdapter.test_invalid_lag) ... ok
test_missing_approval_not_zero (__main__.TestAdapter.test_missing_approval_not_zero) ... ok
test_missing_company (__main__.TestAdapter.test_missing_company) ... ok
test_missing_liveness (__main__.TestAdapter.test_missing_liveness) ... ok
test_output_path_guard (__main__.TestAdapter.test_output_path_guard) ... ok
test_past_deadline (__main__.TestAdapter.test_past_deadline) ... ok

----------------------------------------------------------------------
Ran 9 tests in 0.196s

OK
Sample-only; current liveness NOT verified; human gate PENDING.
enough-time: Consider composite=0.56 days_left=44
closed-posting: Skip composite=0 days_left=44
too-little-time: Skip composite=0 days_left=8
Outputs: course/2026fa/submissions/nikam0420/runs/tmpjo2r7wr3/agent-log.json + human-report.md
```

```text
$ npm run verify
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 166 files (88 md · 38 py · 30 js · 5 sh · 5 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

```text
$ npm run doctor
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.19.0
  ✓ python3    Python 3.12.14

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.1.3
  ✓ libreoffice present
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

```text
$ node scripts/pii-scan.mjs --diff origin/main
pii-scan: clean ✓
```

```text
$ git status --porcelain
(no output: working tree clean)
```

The diff-only scanner is clean; the full-tree scanner remains blocked as reported above. It is not valid to substitute the diff check for the required full-tree check.

## Namespaced diff

```text
.../2026fa/submissions/nikam0420/CHANGE-BRIEF.md   |  16 +
 .../submissions/nikam0420/DOMAIN-JUSTIFICATION.md  |  12 +
 course/2026fa/submissions/nikam0420/FRICTIONAL.md  |  22 ++
 .../2026fa/submissions/nikam0420/PRESENTATION.md   |  31 ++
 course/2026fa/submissions/nikam0420/SOURCES.md     |  15 +
 course/2026fa/submissions/nikam0420/SUBMISSION.md  |  18 +
 course/2026fa/submissions/nikam0420/TEST-REPORT.md | 293 ++++++++++++++++
 course/2026fa/submissions/nikam0420/WORKED-RUN.md  |  94 +++++
 .../nikam0420/baseline-runs/role-scores.json       | 241 +++++++++++++
 .../nikam0420/baseline-runs/role-scores.md         |  15 +
 .../submissions/nikam0420/runs/agent-log.json      | 385 +++++++++++++++++++++
 .../submissions/nikam0420/runs/human-report.md     |  31 ++
 .../submissions/nikam0420/runs/role-scores.json    | 152 ++++++++
 .../submissions/nikam0420/runs/role-scores.md      |  13 +
 .../2026fa/submissions/nikam0420/runs/roles.json   |  68 ++++
 logs/runs/2026fa-nikam0420-1.md                    |  13 +
 .../2026fa/nikam0420-analyst-opt-triage.card.md    |  24 ++
 .../cases/2026fa/nikam0420-analyst-opt-triage.md   |  66 ++++
 .../2026fa/nikam0420-analyst-opt-triage/README.md  |  29 ++
 .../nikam0420-analyst-opt-triage/capture-checks.sh |  29 ++
 .../fixtures/missing-company.json                  |  11 +
 .../fixtures/scenarios.json                        |   5 +
 .../nikam0420-analyst-opt-triage/prototype.py      | 148 ++++++++
 .../nikam0420-analyst-opt-triage/test_prototype.py |  81 +++++
 24 files changed, 1812 insertions(+)
```

## Personal terminal evidence — 2026-10-02

Captured on my Mac. Email strings were redacted; failures and exit codes remain visible.

```text
$ npm run doctor

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v23.3.0
  ✓ python3    Python 3.12.2

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.5
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

Exit code: 0

```

```text
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 166 files (88 md · 38 py · 30 js · 5 sh · 5 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)

Exit code: 0

```

```text
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py
✓ scored 3 roles → Apply 0 · Consider 1 · Skip 2 (skip 67%)
  course/2026fa/submissions/nikam0420/runs/role-scores.json  +  course/2026fa/submissions/nikam0420/runs/role-scores.md
Sample-only; current liveness NOT verified; human gate PENDING.
enough-time: Consider composite=0.56 days_left=44
closed-posting: Skip composite=0 days_left=44
too-little-time: Skip composite=0 days_left=8
Outputs: course/2026fa/submissions/nikam0420/runs/agent-log.json + human-report.md

Exit code: 0

```

```text
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/test_prototype.py
test_bad_date (__main__.TestAdapter.test_bad_date) ... ok
test_duplicate_company (__main__.TestAdapter.test_duplicate_company) ... ok
test_existing_scorer_gates_and_labels (__main__.TestAdapter.test_existing_scorer_gates_and_labels) ... ✓ scored 3 roles → Apply 0 · Consider 1 · Skip 2 (skip 67%)
  course/2026fa/submissions/nikam0420/runs/tmpcr7u3wjb/role-scores.json  +  course/2026fa/submissions/nikam0420/runs/tmpcr7u3wjb/role-scores.md
ok
test_invalid_lag (__main__.TestAdapter.test_invalid_lag) ... ok
test_missing_approval_not_zero (__main__.TestAdapter.test_missing_approval_not_zero) ... ok
test_missing_company (__main__.TestAdapter.test_missing_company) ... ok
test_missing_liveness (__main__.TestAdapter.test_missing_liveness) ... ok
test_output_path_guard (__main__.TestAdapter.test_output_path_guard) ... ok
test_past_deadline (__main__.TestAdapter.test_past_deadline) ... ok

----------------------------------------------------------------------
Ran 9 tests in 0.136s

OK
Sample-only; current liveness NOT verified; human gate PENDING.
enough-time: Consider composite=0.56 days_left=44
closed-posting: Skip composite=0 days_left=44
too-little-time: Skip composite=0 days_left=8
Outputs: course/2026fa/submissions/nikam0420/runs/tmpcr7u3wjb/agent-log.json + human-report.md

Exit code: 0

```

```text
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — [REDACTED_EMAIL]

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.

Exit code: 1

```

```text
$ Missing-company fixture
BLOCKED: company-missing: exact name not found

Exit code: 2 (expected 2)

```

## Personal clean-checkout verification

```text
$ npm run doctor

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v23.3.0
  ✓ python3    Python 3.12.2

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.5
  — libreoffice not found (PDF fallback)
  — playwright not installed (ats:liveness needs it)

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

Exit code: 0
```

```text
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 166 files (88 md · 38 py · 30 js · 5 sh · 5 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)

Exit code: 0
```

```text
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py
✓ scored 3 roles → Apply 0 · Consider 1 · Skip 2 (skip 67%)
  course/2026fa/submissions/nikam0420/runs/role-scores.json  +  course/2026fa/submissions/nikam0420/runs/role-scores.md
Sample-only; current liveness NOT verified; human gate PENDING.
enough-time: Consider composite=0.56 days_left=44
closed-posting: Skip composite=0 days_left=44
too-little-time: Skip composite=0 days_left=8
Outputs: course/2026fa/submissions/nikam0420/runs/agent-log.json + human-report.md

Exit code: 0
```

```text
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/test_prototype.py
✓ scored 3 roles → Apply 0 · Consider 1 · Skip 2 (skip 67%)
  course/2026fa/submissions/nikam0420/runs/tmpb1hzdmah/role-scores.json  +  course/2026fa/submissions/nikam0420/runs/tmpb1hzdmah/role-scores.md
Sample-only; current liveness NOT verified; human gate PENDING.
enough-time: Consider composite=0.56 days_left=44
closed-posting: Skip composite=0 days_left=44
too-little-time: Skip composite=0 days_left=8
Outputs: course/2026fa/submissions/nikam0420/runs/tmpb1hzdmah/agent-log.json + human-report.md
test_bad_date (__main__.TestAdapter.test_bad_date) ... ok
test_duplicate_company (__main__.TestAdapter.test_duplicate_company) ... ok
test_existing_scorer_gates_and_labels (__main__.TestAdapter.test_existing_scorer_gates_and_labels) ... ok
test_invalid_lag (__main__.TestAdapter.test_invalid_lag) ... ok
test_missing_approval_not_zero (__main__.TestAdapter.test_missing_approval_not_zero) ... ok
test_missing_company (__main__.TestAdapter.test_missing_company) ... ok
test_missing_liveness (__main__.TestAdapter.test_missing_liveness) ... ok
test_output_path_guard (__main__.TestAdapter.test_output_path_guard) ... ok
test_past_deadline (__main__.TestAdapter.test_past_deadline) ... ok

----------------------------------------------------------------------
Ran 9 tests in 0.131s

OK

Exit code: 0
```

```text
$ git status --porcelain

Exit code: 0
```
