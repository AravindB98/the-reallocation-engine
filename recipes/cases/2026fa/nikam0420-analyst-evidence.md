---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "sample-adequacy; 2026-10-18T15:01:03.693594+00:00; logs/runs/2026fa-nikam0420-1.md"
attestation: null
recipe_version: 0.1.0
---

## Executive summary

This mode helps an international early-career data or business intelligence analyst examine historical employer evidence before spending time on applications. The executed sample found 61 company records with analyst-related title strings. None is an application recommendation: employer identity, posting liveness, and visa timing remain unverified. The student executed and reviewed the sample; its lifecycle is RUNNABLE-SAMPLE.

# Analyst-specific sponsorship evidence mode

## Purpose and exact situation

Use before shortlisting employers for a fictional international master's graduate targeting entry-level SQL reporting, dashboard validation, data analyst, and BI analyst work. The public demonstration is a domain scenario, not a copy or paraphrase of a real student's profile, immigration dates, résumé, applications, or contacts. It does not represent the 61 companies as current entry-level opportunities.

Question: does the local mapped company record contain analyst-related historical sponsored-title strings, or only general company sponsorship fields? The output helps the applicant decide which evidence to investigate next, never whether they are legally eligible or should apply.

## Source inventory and provenance

| Source / command | Exact role | Verification boundary |
|---|---|---|
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | Local real company records; exact SHA-256 in JSON and human report | Snapshot only; underlying identity joins not independently verified |
| `scripts/sec/validate-h1b-join-sample.py` | Maintained repo audit; executed by wrapper on a temporary safe-column projection of every source row | Counts populated fields and selects a seeded sample; cannot establish true join accuracy |
| `scripts/contrib/2026fa/nikam0420-analyst-evidence/run.py` | New local-only wrapper; structured title parsing, source references, separate outputs | Substring filter, not SOC classifier or sponsorship probability |
| `scripts/contrib/2026fa/nikam0420-analyst-evidence/test_run.py` | Tests real source traceability, repeatability, refusal behavior | Does not establish current market or immigration truth |
| `npm run verify` and `npm run doctor` | Existing conformance and environment/privacy checks | Machine checks do not clear human gates |
| `npm run ats:liveness -- <job-url>` | Existing future live-check command after an exact posting is supplied | Not run in this sample; result must be reviewed by a human |

Repository commit: `015843d5047dbadff05068495e4c5db5cd9945f4`. The original upstream filing dates/coverage and join quality are not established by this run. Do not label the CSV a verified raw DOL dataset. The wrapper writes only business evidence; contact columns are excluded before invoking the maintained validator. No network calls occur in this mode.

## Algorithm and decisions

1. Require the source file, eight exact columns, and at least one company row; refuse otherwise.
2. Count a row as H-1B-populated when any of Total Approvals, Total Denials, Approval_Rate, median_salary_offered, or top_job_titles_sponsored is non-null. This means populated fields, not proven sponsorship.
3. Parse title lists as Python literals; reject malformed lists. Match case-insensitive substrings `data analyst`, `business intelligence`, `analytics engineer`, or `bi analyst`. This deliberately broad rule surfaces records for human review. Senior titles can match; no entry-level eligibility is inferred.
4. Execute the maintained H-1B join validator against all rows, reduced to safe columns, with sample size 20, review count 0, seed 80. Zero review rows avoids copying unrelated titles; it does not mean a human reviewed 20 joins.
5. Emit separate machine log, human table, and join audit. Never compute an Apply score in this stage. Preserve all unresolved gates as HOLD.

## Execute from repository root

```bash
npm install
npm run verify
python3 scripts/contrib/2026fa/nikam0420-analyst-evidence/run.py --out-dir course/2026fa/submissions/nikam0420/evidence
python3 scripts/contrib/2026fa/nikam0420-analyst-evidence/test_run.py
npm run doctor
```

The wrapper invokes the maintained script with an actual temporary CSV path. The exact invoked command and stdout are in the worked run. It does not alter upstream data.

## Phase gates: hard stops

| Gate | Testable clearance condition | Human / record | On failure |
|---|---|---|---|
| G0 Source structure | File, columns, nonempty rows, valid title lists; audit produced | Machine detects; student reviews counts | Exit 2, no new output |
| G1 Sample adequacy | Read report + audit; explain one matched record and one limitation; log name/date | Student author; append-only run entry | Remain DRAFT; no lifecycle promotion |
| G2 Employer identity | Raw employer evidence matches exact legal company; conflicting joins resolved | Applicant with source citation and date | HOLD; no sponsorship certainty |
| G3 Liveness | Exact role URL currently shows an active matching employer/title; scripted result and named human review recorded | Applicant, source URL, timestamp | HOLD if unknown; closed posting is a hard stop |
| G4 Timeline | Required start date and private work-authorization timeline reviewed; explicit compatible/incompatible result | Applicant and appropriate university advisor; real details remain private | HOLD if unknown; incompatible timing is a hard stop |
| G5 Release | G2–G4 cleared, title seniority/tasks reviewed, employer-specific policy checked | Named applicant records decision privately | No Apply recommendation |

No score, historical approval count, or funding amount can compensate for G3 or G4. No human gate was cleared by this automated execution. Human gates are specification requirements, not new unimplemented scripts.

## What it can and cannot verify

**Established locally:** exact record counts, raw stored company/title fields, selected source record numbers (one-based data records excluding header), file digest, exit codes, generated files, reproducibility, refusal behavior.

**Bounded judgment:** these four title substrings are useful discovery terms for analyst work. This is a design choice, not an occupational classification or measured predictive model.

**Cannot establish:** true SEC–DOL employer matching, current sponsorship policy, title-specific approvals (the count is company-level), unique employer count, entry-level suitability, SOC eligibility, offer salary, live jobs, individual visa eligibility, hiring budget from Form D, or resilience to AI. A non-match or blank value is unknown, not a refusal to sponsor. No funding or cognitive-quality score is produced.

## Output contract: two separate readers

Machine artifact `agent-log.json`: recipe/version, execution timestamp, source path/digest/kind, counts, matching rule, every matched record number/company/state/raw approvals/title list, existing-script provenance/exit code, three gate states, judgments, `recommendation: HOLD_FOR_VERIFICATION`, `score: null`.

Human artifact `human-report.md`: plain-language summary; three-count evidence table; complete table with Source record / Company / State / Approvals (raw) / Matched titles; gate table; decision and limits. Reader: analyst applicant. Decision enabled: which historical evidence to investigate, with uncertainty visible.

`source-join-audit.md` is a separate diagnostic from the maintained validator, with a clearly identified plain-language preface. Original validator text is preserved. Counts are rows, not deduplicated companies. JSON never substitutes for the human report.

## Proposed additions and typed work

Closed APPROVE item: Siddhesh Nikam reviewed the executed sample and its limitations. Evidence: `logs/runs/2026fa-nikam0420-1.md`, student sample adequacy review. No live application gate was cleared.

Future optional scope, excluded from v0.1.0: a validated raw DOL identity/SOC crosswalk would resolve employer/title ambiguity; timestamped posting and employer-policy evidence would support live gates. Those sources have not been acquired, and no outputs from them are claimed. They require a new version with typed DATA SOURCE/DEV items before implementation.

## Stop conditions

Refuse and exit 2 for absent source, missing columns, empty source, malformed title evidence, or maintained-script failure. Do not reuse stale output as a fresh run after failure; use a new output directory. For missing/ambiguous live or timeline evidence, generate an evidence-only HOLD report, never a score. Reject requests to interpret stored company approvals as title-specific approvals or as a sponsorship guarantee. Never publish artifacts derived from private student data.

## RUN_LOG template

```markdown
Date/time (UTC): <actual execution time>
Recipe/version: analyst-evidence 0.1.0
Executor: <actual executor; distinguish AI execution from student review>
Source: <public dataset path + digest; no private inputs>
Commands/output: <worked-run evidence link>
Artifacts: <JSON / human report / join audit>
Result: HOLD_FOR_VERIFICATION; score null
Checks: <count cross-check, rerun, deliberate break + observed exit>
Human gates: <named/date/evidence or explicitly NOT CLEARED>
Open issues: <identity match, liveness, timeline, lifecycle review>
```

For the LMS include a standalone `RUN_LOG.md` entry; for the PR use `logs/runs/2026fa-nikam0420-1.md` because the current contribution contract protects the shared log. The assignment requests branch `mode/nikam0420-analyst-evidence`; this package uses that branch and documents the difference from the repository's `contrib/` naming recommendation.
