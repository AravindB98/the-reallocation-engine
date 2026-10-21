# Worked run — early-career sponsorship evidence triage

## Executive summary

A real repository audit and the sample workflow read 30,369 company records. The audit found 1,557 rows with at least one H-1B field, independently recounted. Nine explicitly fictional openings yielded one Apply candidate pending human review, two Consider, three Skip, and three Blocked. Nine tests passed, and an independent rerun produced identical JSON. These results establish local computation, not current hiring or immigration eligibility.

## Later sample review — 2026-10-21

The user accepted the sample results as reasonable with no questions. See `HUMAN-REVIEW.md`. The recipe is now RUNNABLE-SAMPLE; no independent student rerun or live gate clearance is claimed. The execution record below is preserved as it stood on 2026-10-19, so its DRAFT and pending-review statements are historical.

## Run identity and inputs

- Recipe: `recipes/cases/2026fa/edden-nu-sponsor-fit.md`, version 1.1.0, DRAFT.
- Executed on 2026-10-19 UTC (2026-10-18 in New York), using existing code and public repository data. This is not a student-signed attestation.
- Scenario date: 2026-09-30, deliberately frozen rather than presented as today's vacancy evidence.
- Real data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`.
- Fictional persona: repository Aarav Patel skill lists; synthetic postings, policies, page snapshots, and timing from `scripts/contrib/2026fa/edden-nu-sponsor-fit/fixtures/cases.json`.
- Versions, source hashes, and repository revisions: `PROVENANCE.json`.
- Setup: `npm install --no-audit --no-fund`; isolated Python environment with PyYAML. npm's incidental lockfile metadata changes were restored; no dependencies were changed in the submission.

## Exact commands and actual terminal output

All commands below ran from repository root with the isolated Python environment on PATH. Output blocks are read directly from captured transcripts; they are not reconstructed. The maintained audit writes its report to a file, so the complete generated report is separately preserved as `evidence/h1b-audit-report.txt` without changing its text. That upstream report does not open with an executive summary; this wrapper supplies one rather than altering evidence.

### baseline-verify — exit 0

```bash
npm run verify
```

```text

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 165 files (88 md · 38 py · 31 js · 4 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

### h1b-audit — exit 0

```bash
python3 scripts/sec/validate-h1b-join-sample.py data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --sample-size 5 --review-count 5 --seed 80
```

```text
/Users/edden/Documents/ChatGPT/The Reallocation Engine — Mode Design Assignment/mode-build-20261018/data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3-join-validation-audit.md
```

### sample-run — exit 0

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/build-20261019/run
```

```text
Read 30369 CSV rows; processed 9 synthetic cases.
S1: Skip — explicit-policy-restriction
S2: Consider — role-policy-unknown
S3: Consider — skill-evidence-gap
S4: Apply — candidate-for-human-review
S5: Blocked — missing-or-uncertain-evidence
S6: Skip — closed-liveness-gate
S7: Blocked — missing-or-uncertain-evidence
S8: Skip — closed-timeline-gate
S9: Blocked — missing-or-uncertain-evidence
Wrote course/2026fa/submissions/edden-nu/build-20261019/run/run.json and report.md; human clearance pending.
```

### offline-tests — exit 0

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py
```

```text
test_blank_is_not_zero_or_a_veto (__main__.OfflineTests.test_blank_is_not_zero_or_a_veto) ... ok
test_error_page_with_apply_button_does_not_pass (__main__.OfflineTests.test_error_page_with_apply_button_does_not_pass) ... ok
test_every_fact_has_source_and_evidence (__main__.OfflineTests.test_every_fact_has_source_and_evidence) ... ok
test_fit_and_policy_are_separate (__main__.OfflineTests.test_fit_and_policy_are_separate) ... ok
test_hard_gates_override_positive_signals (__main__.OfflineTests.test_hard_gates_override_positive_signals) ... ok
test_missing_date_key_and_invalid_date_are_errors (__main__.OfflineTests.test_missing_date_key_and_invalid_date_are_errors) ... ok
test_missing_evidence_fails_closed (__main__.OfflineTests.test_missing_evidence_fails_closed) ... ok
test_schema_break_is_explicit (__main__.OfflineTests.test_schema_break_is_explicit) ... ok
test_source_value_and_invariant_under_policy_change (__main__.OfflineTests.test_source_value_and_invariant_under_policy_change) ... ok

----------------------------------------------------------------------
Ran 9 tests in 0.315s

OK
```

### overwrite-break — exit 2

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/build-20261019/run
```

```text
ERROR: output directory already exists; use a new run ID (no overwrite)
```

### repeat-run — exit 0

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/build-20261019/repeat
```

```text
Read 30369 CSV rows; processed 9 synthetic cases.
S1: Skip — explicit-policy-restriction
S2: Consider — role-policy-unknown
S3: Consider — skill-evidence-gap
S4: Apply — candidate-for-human-review
S5: Blocked — missing-or-uncertain-evidence
S6: Skip — closed-liveness-gate
S7: Blocked — missing-or-uncertain-evidence
S8: Skip — closed-timeline-gate
S9: Blocked — missing-or-uncertain-evidence
Wrote course/2026fa/submissions/edden-nu/build-20261019/repeat/run.json and report.md; human clearance pending.
```

### doctor — exit 0

```bash
npm run doctor
```

```text

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.11.0
  ✓ python3    Python 3.11.7

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
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

### independent-verification — exit 0

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/verify_build.py course/2026fa/submissions/edden-nu/build-20261019
```

```text
CSV rows independently counted: 30369
Rows with any H-1B field populated: 1557; matches maintained audit
All exact-name lookups and raw approval values agree with source CSV
SHA-256 source hash verified; independent rerun JSON identical
Unknown gates never recommend Apply; human clearance remains pending
Outcome counts: {"Apply": 1, "Blocked": 3, "Consider": 2, "Skip": 3}
```

## Line-by-line evidence boundary

| Output field or case | Established by actual execution | Inferred, synthetic, or not established |
|---|---|---|
| Dataset row count and hash | 30,369 parsed rows; source bytes hashed and recounted | Dataset completeness and original identity joins are not verified |
| Audit H-1B populated count | 1,557 rows contain at least one specified H-1B value | Not 1,557 currently sponsoring companies; not a personal success rate |
| Employer match / historical values | Exact CSV keys and raw values checked independently | Exact text match is not proof of original employer identity |
| S1 → Skip | Rule honors synthetic negative role policy despite history | The named company has not made this policy statement |
| S2 → Consider | Unknown policy is routed to investigation | No actual employer policy checked |
| S3 → Consider | Requested token absent from fictional skill list | Absence does not prove lack of proficiency |
| S4 → Apply | Blank history stays unknown, other synthetic conditions pass | Only a review candidate; no current opening or authorization verified |
| S5 → Blocked | Upstream short-page result is preserved, wrapper treats it as unknown | A short page does not prove closure |
| S6 → Skip | Supplied 404 triggers the liveness gate | No live HTTP request was made |
| S7 → Blocked | Exact employer key absent from this CSV | Does not establish the employer does not exist |
| S8 → Skip | Fictional earliest start is after fictional deadline | Not an immigration eligibility calculation |
| S9 → Blocked | Null deadline remains unknown | No visa deadline inferred |
| `action`, `reason`, `next_step` | Deterministic rule execution observed | Designed judgments, labeled `model-judgment`, not measured outcomes |
| `human_clearance` | Still pending | No human approval invented |

## Verification method

The maintained H-1B validator ran directly on the real shipped CSV, rather than only on invented scoring values. A separate CSV reader recounted its main results. The new verification script compared each sampled employer's raw approval value with the source, checked the dataset hash, parsed both JSON outputs, checked equality across independent runs, and confirmed unknown gates never lead to Apply. Existing unit tests mutate real inputs to exercise missing columns, impossible dates, HTTP error pages, and policy changes. The deliberate overwrite attempt exited 2; the independent verification afterward confirmed the preserved output still matched the repeat run.

## Attestation

- Recipe: edden-nu-sponsor-fit v1.1.0
- Record: automated execution · 2026-10-19 UTC. Student review and human attestation remain pending; this record does not promote the recipe.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| Maintained H-1B validator on v3 CSV | Audit generated, 30,369 rows / 1,557 populated | Real input accepted; missing original-source evidence explicitly disclosed |
| Sample runner | 9 cases; 1 Apply, 2 Consider, 3 Skip, 3 Blocked | Ordered gates and distinct unknown state |
| 403 response with Apply control (unit-test mutation) | Blocked | HTTP error cannot become a healthy liveness gate |
| Missing CSV columns and invalid/missing date key | Explicit exceptions caught by tests | Bad schemas/dates halt rather than guess |
| Repeat same output-directory command | Exit 2, refusal to overwrite | Preserve prior evidence |
| Independent recount / rerun / JSON parsing | All assertions pass; outputs identical | Reproducible local computation |
| Repository verify and doctor | Exit 0; verify has three inherited manifest warnings | Conformance and environment checked, warnings retained |

### Did not test

- Current employer policy, live URLs, funded headcount, or successful application submission.
- Raw original DOL/USCIS identity joins; the maintained audit states the needed evidence is absent.
- Actual visa eligibility or a real candidate's timeline.
- Semantic skill matching, proficiency, geographic suitability, or graduation-window eligibility.
- Cross-platform execution in a fresh Linux environment or remote CI success.
- Independent student comprehension and adequacy review.

### Broke during testing, fixed

- No new runner defect was discovered or fixed in this rerun. Bad-input and overwrite failures were intentional and handled as expected.
- The inherited first version had a 403-with-Apply failure, corrected before this run. Its current regression test passed. Historical evidence remains under the earlier submission's `evidence/break-before-fix.txt`; this is not presented as a newly discovered fix.
- The initial environment lacked PyYAML. An isolated environment was created and PyYAML installed; conformance then passed. No checker was disabled.

## Reflection and next steps

The most useful finding is the difference between an unknown and a negative: the source has broad missing H-1B coverage, so treating blanks as zero would mislead the research queue. The sample shows that historical approvals also cannot overrule a role-specific restriction. Repeatability and field-level labels make the result inspectable.

The workflow is limited by synthetic role evidence and simplistic skill-token matching. A company record can be real while its original join remains unverified, and a classifier can execute correctly without proving a vacancy is open. The next step is a human-reviewed live requisition with explicit policy and timeline evidence, followed by a logged adequacy decision. No real action proceeds through an uncleared gate. No numerical job-success score is emitted.

## Conformance and contribution caveats

The assignment's shared log / assignments folder differs from the Fall 2026 contribution contract. The PR keeps the required student namespaces; the ZIP includes `RUN_LOG.md` and an `assignments/submissions/edden-nu/` mirror. This discrepancy is recorded in the log. Verify's three inherited manifest warnings are not silently dismissed. The unchanged upstream lockfile also causes the full-tree privacy scanner to flag a package-author address; branch-history scanning is checked separately. Neither a clean full-tree privacy scan nor remote CI success is claimed.
