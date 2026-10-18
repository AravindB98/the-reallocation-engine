## Executive summary

The implementation and submission documents passed their syntax checks, and the workflow passed eight behavior checks. Environment checks passed. Three pre-existing manifest warnings and a pre-existing whole-tree dependency-metadata privacy finding remain visible; the contribution history scan is clean. No GitHub PR or LMS upload has been performed.

# Validation record

## npm run verify — actual output

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 162 files (87 md · 38 py · 30 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

## Submission document conformance — actual output

```text
conformance: 8 files (6 md · 2 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

## npm run doctor — actual output

```text
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

## Privacy distinction

`node scripts/pii-scan.mjs` returned exit 1 for an existing dependency funding contact in the unchanged upstream package-lock.json. The address is omitted here to avoid republishing it into a new namespace. `git diff HEAD -- package-lock.json` was empty after restoring the cloned lockfile. This was not introduced by the contribution and no privacy rule was weakened.

`node scripts/pii-scan.mjs --diff 015843d5047dbadff05068495e4c5db5cd9945f4` checks the contribution's complete commit history. Actual result:

```text
pii-scan: clean ✓
```

The upstream contribution CI may still flag the full-tree dependency contact. Report it to the maintainer if it blocks your PR; do not claim every upstream CI job is green. Three existing manifest warnings also remain; `npm run verify` still exited 0.

## Scope

Only the student's recipe/card, script/test, submission documents/evidence, and namespaced run log are changed. The protected shared log, source datasets, constitution, configuration, and other students' files are unchanged. The wrapper executes the existing maintained audit via subprocess. It makes no network requests.
