# Worked run — assistant execution, student review pending

## Executive summary
This is an actual offline run performed by Codex while preparing the submission starter. It shows one conditional Consider and two Skip results using a stored company record and fictional posting/timing assumptions. It is evidence of assistant execution; the student must add their own run and named review before claiming personal verification.

## Inputs
Company: SOFAR SOUNDS LTD, exact name in the shipped CSV. Target: a fictional Data Analyst posting, not an advertised vacancy. As-of date: fictional frozen 2026-10-02. One scenario has fictional deadline 2026-11-15, one has 2026-10-10. Assumed hiring lag: 21 calendar days. Simulated liveness: 1, 0, 1. Fictional self-rated fit: 0.7.

## Commands and real pasted terminal output

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
$ python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py --fixture scripts/contrib/2026fa/nikam0420-analyst-opt-triage/fixtures/missing-company.json
BLOCKED: company-missing: exact name not found
Exit code: 2
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

## Line-by-line verified versus assumed
| Value | Label | What the run establishes |
|---|---|---|
| Company SOFAR SOUNDS LTD | record | Exact company_name match in local CSV |
| Total Approvals 2.0 | record | Stored aggregate field; not independently revalidated DOL data |
| Listed titles include Data Analyst | record | Stored descriptive title list; not proof about this fictional vacancy |
| Sponsorship signal 1, tier Likely | your-input | Declared binary evidence-presence policy, not an empirical probability |
| Fit 0.7 | your-input | Fictional self-rating |
| Liveness 1 / 0 / 1 | your-input | Simulated posting states, not checked ATS records |
| Dates and 21-day hiring lag | your-input | Fictional scenario and unmeasured lag assumption |
| 44 days / 8 days left | your-input | Subtraction of supplied dates |
| Timeline factors 1 / 1 / 0 | your-input | Declared feasibility policy on those assumptions |
| Composite 0.56 / 0 / 0 | your-input | Existing scorer arithmetic: (1 × 0.35 + 0.7 × 0.30) × liveness × timeline |
| Consider / Skip / Skip | your-input | Conditional policy result; no live decision authorized |
| No generated model term | model-judgment | This version does not call a model to score a role |

## Hand-check reproducibility
Open the CSV in a text editor and locate SOFAR SOUNDS LTD; check the company_name, Total Approvals and top_job_titles_sponsored columns. The adapter records the full CSV SHA-256 in agent-log.json. The offline integration test reads real repo data and invokes the real scorer. The deliberate missing-company CLI run exits 2 without fabricating a replacement. Do not treat old output files as a new failed run's results.

## Reflection and correction
Worked: the three scenarios isolate gate effects while keeping company evidence constant. Missed: the first interpretation of sponsorship presence could imply a calibrated probability; implementation labels the binary policy your-input and uses Likely rather than Proven. Next improvement: add role-specific sponsorship evidence and a reviewed current-posting observation. No current employer promise, live vacancy or legal deadline was verified.

## Attestation — personal sample execution
- Recipe: Analyst OPT triage v0.1.0
- By: Siddhesh Nikam · 2026-10-02

### Tested
| Ran | Saw | Expected |
|---|---|---|
| Prototype command | Consider 0.56; Skip 0; Skip 0 | One conditional Consider and two Skip on frozen sample |
| Missing-company break command | BLOCKED: company-missing; exit 2 | BLOCKED and exit 2 |
| Offline tests and direct CSV check | Nine tests passed; 2.0 stored approvals; Data Analyst in title list | Nine tests pass; stored row agrees |

### Did not test
- Current vacancy/liveness, role-specific sponsorship willingness, independent underlying DOL join accuracy, real legal OPT dates, hiring-lag accuracy, live ingestion, funding/wage scoring, or legal advice.

### Broke during testing, fixed
- Initial cloning and copying failed; creating the fork and locating the extracted folder resolved them. The full-tree dependency-email finding remains unresolved. No scanner rule was weakened.

### Human gate decision
Pending. After review, record reviewer name, date, what evidence was examined, and the precise scope cleared (sample demonstration only). This is not permission for a real application. Keep recipe attestation null unless a named human has actually signed; assignment lifecycle never exceeds RUNNABLE-SAMPLE.

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
