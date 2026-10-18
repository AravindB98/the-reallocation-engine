## Executive summary

A real local workflow read the repository's company dataset, ran its maintained H-1B join audit, and produced separate machine and human artifacts. It found 61 records with analyst-related title strings. Eight verification checks passed, including deliberate break attempts. No current application recommendation or sponsorship guarantee was produced.

# Worked run — analyst evidence v0.1.0

## Inputs and provenance

- Base repository commit: `015843d5047dbadff05068495e4c5db5cd9945f4`.
- Real input: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`.
- Source digest: `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`.
- Execution time, exactly as reported by the runtime: `2026-10-18T14:47:44.871342+00:00`. This is the runtime UTC clock; the assignment conversation was dated October 18 in New York. No timestamp was manually backdated.
- Scenario: an illustrative international early-career analyst workflow. No private résumé, visa dates, applications, contacts, or outcomes were used.
- Executor: OpenAI Codex assisted with code, documentation, command execution, and machine-output inspection. Student author: Siddhesh Nikam. A personal student execution or signed human review is NOT claimed.
- Lifecycle: DRAFT, one open human adequacy-review item. The sample executes; a machine PASS is not human attestation.

## Exact commands and actual terminal output

The maintained audit ran as a subprocess of the wrapper. Its exact expanded command and actual stdout appear below; the temporary safe-column CSV is created from every source row and removed after execution. The complete generated audit is retained. Temporary directory names change on reruns.

```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-evidence/run.py --out-dir course/2026fa/submissions/nikam0420/evidence
```

```text
MAINTAINED COMMAND: /opt/codex/runtimes/codex-primary-runtime/dependencies/python/bin/python3 /workspace/scratch/c80994c1f9c9/the-reallocation-engine/scripts/sec/validate-h1b-join-sample.py /tmp/analyst-audit-v37f0b31/company-evidence.csv --sample-size 20 --review-count 0 --seed 80
MAINTAINED SCRIPT STDOUT:
/tmp/analyst-audit-v37f0b31/company-evidence-join-validation-audit.md
EXISTING SCRIPT: scripts/sec/validate-h1b-join-sample.py exit=0 (all rows; safe columns)
COUNTS company_rows=30369 h1b_fields_populated=1557 analyst_title_rows=61 malformed_title_lists=0
OUTPUT agent-log.json + human-report.md + source-join-audit.md
RESULT HOLD_FOR_VERIFICATION; score=null; entity/liveness/timeline gates uncleared
exit_code=0
```

```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-evidence/test_run.py
```

```text
PASS source cross-check: 30369 rows; 61 matches trace to source records
PASS rerun: identical JSON after excluding execution timestamp
PASS safety: no score; all three gates remain on HOLD
PASS deliberate break: absent source exits 2; writes no output
PASS deliberate break: missing columns exits 2; writes no output
PASS deliberate break: malformed title list exits 2; writes no output
PASS maintained validator: audit counts agree with source and JSON
PASS publication contract: match rows expose only allowed evidence fields
8/8 checks passed
exit_code=0
```

```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-evidence/run.py --csv /tmp/analyst-evidence-deliberately-absent.csv --out-dir /tmp/analyst-evidence-break-output
```

```text
BLOCKED: source CSV does not exist; no score or report produced.
exit_code=2
```

## Verified versus inferred: claim-by-claim

| Claim | Kind | Evidence / limit |
|---|---|---|
| Source contains 30,369 company rows | Established locally | CSV reader count; maintained audit; independent test source read. Not unique legal employers. |
| 1,557 rows have H-1B fields populated | Established locally | Same five-field presence definition in wrapper and maintained validator; audit prints 1,557. Not 1,557 proven sponsors. |
| 61 rows match title rule | Established locally | Parsed lists and recorded substring rule; all emitted matches checked against source record positions. |
| A matched title is useful for analyst employer research | Design judgment | Reasonable discovery heuristic; not measured accuracy or job suitability. |
| ACE-UP INC stores Business Intelligence Analyst and approvals 2.0 | Stored record, not external truth | First output match traces to source data record 501; the approvals are company-level, NOT two analyst approvals. |
| Output is repeatable | Tested behavior | Full JSON equals rerun after removing only execution timestamp. |
| Invalid inputs stop | Tested behavior | Missing source, missing columns, and malformed title list each exit 2 and produce no new directory. |
| Employers currently sponsor analyst hires | NOT established | Original join metadata, employer policy, and role-specific source evidence missing. |
| These are live entry-level jobs compatible with a student's timeline | NOT established | No exact live posting or human-cleared private timeline was supplied. |
| Applicant should apply | NOT inferred | Three gates HOLD; score null. |

## Verification and audit reading

The independent test reads the original CSV, checks its row count, and resolves every one of the 61 emitted records back to the source company and original title list. It does not merely check that files exist. A second run checks deterministic evidence output. The existing maintained validator separately counts the same projected source rows. Its audit states that raw DOL/LCA employer names and matching metadata are unavailable locally, so join error rates cannot be established. That limitation is preserved rather than reported as a clean sponsorship result.

The negative tests are genuinely executed through the command-line interface. They cover missing files, missing required columns, and malformed title lists, and assert no output directory was created. The happy path verifies `score: null` and all three HOLD gates. Source fields with business contacts are never copied into the outputs.

## Reflection

**What went well.** The workflow ran on real data, reused a maintained script instead of asking an LLM to invent sponsorship evidence, and made every matched title inspectable. The test suite confirmed traceability, repeatability, and refusal behavior.

**What it missed or can get wrong.** The broad substring rule includes senior and managerial titles and can miss analyst synonyms such as Decision Scientist. Company-level approvals cannot be assigned to individual titles. The source may be stale, duplicate companies, or contain entity-resolution errors. The test proves reported matches exist, not that the filter has perfect recall. No live posting, SOC mapping, funding analysis, or visa check was performed.

**Concrete next steps.** First the student reads the human table and join audit and records an adequacy review. Then validate one legal employer identity against original records and inspect one exact current posting. Clear the timeline privately with appropriate advice. Expand title vocabulary only with labeled source examples and a new version; do not silently change this run's matching rule.

## Attestation

- Recipe: analyst-evidence v0.1.0.
- By: OpenAI Codex — automated execution record on the runtime date above; Siddhesh Nikam's human adequacy review remains pending. This does not promote the recipe to VERIFIED.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| Workflow on real local CSV | 30,369 rows; 1,557 populated; 61 matches; maintained validator exit 0 | Real records and two separate reader artifacts |
| Full source trace checks | All 61 output matches trace to original company/title records | No fabricated company/title evidence |
| Repeat run | Same JSON apart from execution timestamp | Deterministic evidence |
| Deliberate absent-source run | Exit 2; no output | Refuse rather than guess |
| Deliberate missing-column run | Exit 2; no output | Reject invalid schema |
| Deliberate malformed-title run | Exit 2; no output | Do not disguise bad data as a negative match |
| HOLD-output checks | Null score; entity/liveness/timeline HOLD | Missing gates cannot become Apply |

### Did not test

- Actual SEC–DOL entity match correctness or raw SOC records.
- Live ATS access, employer sponsorship policy, specific salaries, or entry-level suitability.
- Any real student's timeline or eligibility.
- Complete title-filter precision or recall, or every possible malformed CSV.
- Human review, GitHub push/PR, LMS upload, or an in-class presentation.

### Broke during testing, fixed

- No implemented behavior test failed in the recorded test run. Deliberately invalid inputs were blocked as expected; they were not repaired into false evidence.
- Initial clone appeared stalled, but completed; no success output was invented while waiting.
- The assignment paths conflict with current repository contribution paths. The ZIP includes assignment aliases; the PR tree uses student namespaces and leaves the protected shared log untouched.

## Student personal execution — 2026-10-18T14:56:24.298933+00:00

Siddhesh Nikam personally executed the following commands on his Mac.
Both exited 0. All eight behavior checks passed, including three deliberate
bad-input attempts. AI assisted with implementation and documentation.
Human adequacy review remains pending; no live application gate is cleared.

The output below is captured terminal output. The local home-directory
prefix has been replaced with `<HOME>` for publication; results are unchanged.

```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-evidence/run.py --out-dir course/2026fa/submissions/nikam0420/evidence
```

```text
MAINTAINED COMMAND: /opt/anaconda3/bin/python3 <HOME>/Downloads/reallocation-mode-submit/scripts/sec/validate-h1b-join-sample.py /var/folders/8t/sh1q144946j5gy8z4x861brr0000gn/T/analyst-audit-4uao7j8u/company-evidence.csv --sample-size 20 --review-count 0 --seed 80
MAINTAINED SCRIPT STDOUT:
/private/var/folders/8t/sh1q144946j5gy8z4x861brr0000gn/T/analyst-audit-4uao7j8u/company-evidence-join-validation-audit.md
EXISTING SCRIPT: scripts/sec/validate-h1b-join-sample.py exit=0 (all rows; safe columns)
COUNTS company_rows=30369 h1b_fields_populated=1557 analyst_title_rows=61 malformed_title_lists=0
OUTPUT agent-log.json + human-report.md + source-join-audit.md
RESULT HOLD_FOR_VERIFICATION; score=null; entity/liveness/timeline gates uncleared
exit_code=0
```

```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-evidence/test_run.py
```

```text
PASS source cross-check: 30369 rows; 61 matches trace to source records
PASS rerun: identical JSON after excluding execution timestamp
PASS safety: no score; all three gates remain on HOLD
PASS deliberate break: absent source exits 2; writes no output
PASS deliberate break: missing columns exits 2; writes no output
PASS deliberate break: malformed title list exits 2; writes no output
PASS maintained validator: audit counts agree with source and JSON
PASS publication contract: match rows expose only allowed evidence fields
8/8 checks passed
exit_code=0
```


## Student sample adequacy review — 2026-10-18T15:01:03.693594+00:00

Reviewer: Siddhesh Nikam.

I ran the workflow and its tests on my Mac; both exited 0 and all eight
checks passed. I reviewed the human report and source audit. I identified
ACE-UP INC and its Business Intelligence Analyst title.

I understand that the stored company-level approvals do not establish
analyst-specific approvals, a current vacancy, or a sponsorship commitment.
The audit also lacks the original employer records needed to validate
the company matching.

I accept this sample as a historical evidence-discovery workflow.
Employer identity, posting liveness, and visa timeline remain HOLD.
No application recommendation or live gate is approved.

This review closes the sample adequacy APPROVE item and supports
RUNNABLE-SAMPLE for recipe version 0.1.0. It supersedes earlier statements
that the student review was pending.
