# Worked run and attestation handoff

## Executive summary

The actual prototype read real repository data and processed nine fictional openings. It produced one Apply, two Consider, three Skip, and three Blocked recommendations, all pending human review. These are sample decisions, not real employer recommendations. The assistant executed the initial run below. The student subsequently ran the sample and tests on October 2; the observed evidence is recorded below. Adequacy attestation remains unsigned.

## Inputs and command output

Inputs: shipped v3 company CSV, the sanctioned fictional Aarav Patel skill lists, and `scripts/contrib/2026fa/edden-nu-sponsor-fit/fixtures/cases.json`. All posting content, role policies, and dates are synthetic. Company identities are exact local keys, not independently authenticated hiring entities.

```text
$ python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/sample-02
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
Wrote course/2026fa/submissions/edden-nu/runs/sample-02/run.json and report.md; human clearance pending.

exit=0
```

## Verified versus inferred, field by field

| Output field | Label | What the label means |
|---|---|---|
| company/title/policy/policy_quote/required_skill | your-input | Fictional opening assumptions, never an employer quote |
| earliest_start/deadline/as_of | your-input | Invented timing scenario, not actual visa dates |
| exact_company_match/historical_approvals_raw/historical_titles/historical_state | record | Actual lookup/contents of the CSV; blanks remain null |
| dataset_rows/dataset_sha256 | record | Actual parser count and input-byte hash |
| skill_list_match | record | Exact token comparison to fictional persona; not verified proficiency |
| liveness_result/liveness_reason | record | Existing classifier's actual output for a synthetic snapshot, not a live-page finding |
| liveness_gate/timeline_gate | model-judgment | Designed interpretation and date rules applied to inputs |
| action/reason/next_step | model-judgment | Proposed research allocation, not human clearance |
| sample_only | your-input | Run explicitly configured as synthetic |
| human_clearance | record | Pending; no approval collected |

The JSON wraps every fact with a label and evidence note; the Markdown report repeats all fields for inspection. There is no unlabeled sponsorship likelihood or confidence score.

## Verification and deliberate break

The test reads the DATADOG INC source row directly and compares its raw approval field with the report. It also changes a policy input and confirms the output changes. Missing timing, absent companies, closed gates, invalid dates and schema corruption are exercised offline.

A new HTTP 403 fixture retaining an Apply control caused the first wrapper to return Apply. The retained failure transcript is `evidence/break-before-fix.txt`. A guard now routes non-2xx responses (other than explicit 404/410 closures) to Blocked; the raw upstream classifier result stays visible. This is a correction to the wrapper, not an unreported change to maintained code.

```text
$ python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py
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
Ran 9 tests in 0.344s

OK

exit=0
```

## Reflection

The useful result is the distinction between blank history and a negative role policy. Neither historical totals nor a visible button supplies current sponsorship proof. The run exposed an error-page weakness and confirmed that exact-name absence loses some plausible alias matches. Next improvement: review a small set of actual employer identities and captured postings with a person, then design an auditable alias map. Do not add fuzzy matching without evidence.

No savings estimate, actual vacancy, legal eligibility, live employer policy, or underlying sponsorship source record was verified. The known short-content classifier behavior was discovered before this revision, so it is not presented as a new prediction.

## Attestation

- Recipe: sponsor-fit v1.0.0
- By: **PENDING — student must run and sign with actual name/date.**
- Execution record: AI assistant ran the commands above on 2026-09-30. This is not a human attestation.

### Tested (assistant execution; student must independently review)

| Ran | Saw | Expected |
|---|---|---|
| Integrated sample command | Nine actions plus both report files | Both outputs with source labels |
| Offline suite after fix | Nine tests pass | No missing gate treated as healthy |
| 403 + Apply control break | Initial Apply, then Blocked after correction | Unknown/error evidence must block |
| Repeat output path | Exit 2, no overwrite | Preserve run evidence |

### Did not test

- Current employer pages or sponsorship policy.
- Real student authorization, availability, geographic/graduate eligibility.
- Original company-to-H-1B entity join.
- Semantic equivalence of job titles, depth of skills, or portfolio quality.
- Remote PR CI or classroom execution by the student.

### Broke during testing, fixed

HTTP 403 with an Apply control incorrectly passed the original wrapper. Added a status guard in `run.py` and retained the regression test. Initial environment verification lacked PyYAML; installed it in an isolated environment. Missing ATS portal config and browser executable remain documented limitations rather than fabricated successful runs.

## Student execution observed — October 2, 2026

The student supplied terminal screenshots and pasted the generated report in the assistance conversation. Screenshots themselves are not committed because they contain local account details. The following is a transcription of visible output, not a new assistant run.

```text
$ python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/student-first-run
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
Wrote course/2026fa/submissions/edden-nu/runs/student-first-run/run.json and report.md; human clearance pending.
```

The student then opened report.md in TextEdit and ran:

```text
$ python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py
Ran 9 tests in 0.465s

OK
```

The test excerpt is the visible summary; all nine test lines showed ok. The suite includes deliberate malformed-input and HTTP-error cases, but the student did not independently design those cases or reproduce the original pre-fix bug. Execution was in the existing working checkout, not an independently prepared clean checkout. The student requested foundational explanation and did not confirm understanding of the decision rules. This records execution only; it is not a signed statement of adequacy or understanding.
