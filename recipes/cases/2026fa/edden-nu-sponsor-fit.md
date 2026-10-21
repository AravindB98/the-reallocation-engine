---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "sample-review, 2026-10-21, course/2026fa/submissions/edden-nu/build-20261019/HUMAN-REVIEW.md"
attestation: null
recipe_version: 1.1.0
---

# Sponsorship evidence triage for early-career Information Systems roles

## Executive summary

This recipe helps early-career applicants distinguish company sponsorship history from the policy of an individual software, analytics, or design opening. A working offline prototype produces a research queue from actual company records and fictional role inputs. It blocks missing evidence and stops before a person authorizes application work. The student accepted the sample results on 2026-10-21. The recipe is RUNNABLE-SAMPLE; live use remains unapproved.

## Sample review

The student accepted the sample results as reasonable with no questions on 2026-10-21. See `course/2026fa/submissions/edden-nu/build-20261019/HUMAN-REVIEW.md` for the scope and lifecycle evidence. This does not assert independent student execution or live gate clearance. Original run outputs retain their historical pending status.

## Current build evidence

Version 1.1.0 reran the sample on 2026-10-19 UTC (2026-10-18 America/New_York). See `course/2026fa/submissions/edden-nu/build-20261019/WORKED-RUN.md`. The maintained H-1B audit was also executed directly on the shipped v3 CSV, independently cross-checked, and preserved verbatim. This version adds documentation and verification; the triage runner is unchanged.

## Purpose and sources

Designed for a hypothetical early-career Information Systems applicant choosing among Java/backend, SQL/analytics, and design openings while needing role-specific sponsorship clarification. These are classroom assumptions, not claims about the submitting student. The demonstration uses the existing fictional Aarav Patel persona; it does not publish the student's own résumé or immigration details. Location filtering and graduation-window eligibility are not implemented in this deliberately small sample.

| Source | Exact path | Use and limitation |
|---|---|---|
| Company CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | Exact-name lookup; blank approvals stay unknown |
| Join limitations | `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md` | Related mapped-data audit warns that original employer identifiers are unavailable; do not treat aggregate data as confirmed identity |
| Fictional evidence | `search/examples/aarav-patel/resume.example.json` | Skill-list contents, not independent skill verification; no copied profile |
| Persona context | `search/examples/aarav-patel/profile.yml` | Read for fictional context; not used to infer real authorization |
| Scenario fixture | `scripts/contrib/2026fa/edden-nu-sponsor-fit/fixtures/cases.json` | Nine invented openings, policy labels, page snapshots, and timing assumptions |
| Maintained tool | `scripts/ats/liveness-core.mjs` | Actual classifier, imported by the adapter |
| Prototype | `scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py` | One offline end-to-end path; new implementation, not a proposed command |
| Tests | `scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py` | Offline break attempts and decision checks |

New contribution: the prototype and adapter integrate these sources into one workflow. No additional data source or unimplemented command is required for this sample, so no open development TODO is claimed. Live collection and deeper CV matching are out of scope, not pretending to be implemented.

## One-command run

From repository root:

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/demo-new
```

Python standard library and Node 20+ suffice. Choose a new directory name for repeat runs. The process exits 2 with an explicit message for schema errors, invalid dates, missing files, classifier failures, or existing output directories. It makes no network calls.

## Phase gates and workflow

1. **Source/shape gate:** the source paths above must exist; the parser checks required columns and fixture keys. Failure halts without successful output. Human review checks that the inputs are the declared source files and synthetic cases.
2. **Evidence gate:** exact employer match and liveness interpretation must be available. The maintained classifier's short-content expiry is treated as unknown; absent/duplicate employer keys also block. Review `run.json` fields `exact_company_match`, `liveness_result`, `liveness_reason`, and `liveness_gate` before relying on a role.
   HTTP errors other than explicit 404/410 closures also block, even if a synthetic page contains an Apply control. This guard corrects a demonstrated first-pass wrapper failure while preserving the original classifier output.
3. **Timeline gate:** compare explicit fictional earliest start and deadline plus the fixture date. Missing dates produce null and Blocked; an impossible start or passed deadline produces Skip. The dates are assumptions, not a computed immigration eligibility window. A human must verify actual timeline evidence outside sample mode.
4. **Recommendation:** known closed liveness/timeline gates → Skip; unresolved gates/identity → Blocked; negative role policy → Skip; missing skill-list evidence or unclear policy → Consider; otherwise Apply, still pending human review. Historic count never overrides a hard gate or policy restriction. No score can compensate for a closed gate.
5. **Human decision gate:** the report and log must exist and be readable. The student must inspect the evidence and record their own dated decision before acting. `human_clearance=pending` remains in all automated outputs; the program cannot approve itself, apply, publish, or send a message.

The sample runner performs checks and proposes outcomes up to the human handoff. It does not claim a human cleared the scope, evidence, timeline, or adequacy gates. Demonstrating synthetic cases does not authorize live action.

## Stop conditions and numeric scores

This mode never emits a numerical employment probability. Refuse scoring when employer identity, current role policy, liveness, or timing is absent or ambiguous. Unknown evidence produces Blocked or Consider as specified above, never a fabricated zero approval count. A human-cleared research queue is the output, not an immigration determination.

Before LIVE use, a named reviewer must log: (1) inspected source version and exact employer identity; (2) a current opening URL, observation time, and confirmation it is a specific open requisition; (3) explicit start/deadline evidence and qualified review of any real authorization question; (4) acceptance of the report with unresolved gaps recorded. Each decision needs reviewer, UTC time, evidence reference, and decision. None is cleared by this sample run. If any is missing, stop before application action.

## What it verifies

Exact source-row presence and stored values; whether the sanctioned fictional skill list contains a requested token; actual classifier outputs on supplied snapshots; deterministic date comparisons; execution of the ordered rules. Source hashes let another reader repeat the same local audit.

## What it cannot verify

Original H-1B entity matching; company-wide or role-level current sponsorship; whether a live URL has funded headcount; future hiring; candidate proficiency; real visa eligibility; geographic or graduation-window fit. Blank history is not a rejection. A past software-engineering title does not prove design-role sponsorship. A stored approval total is not an applicant probability.

## Facts about the engine addressed

- Role quality has weight zero in the composite, and local wage output feeds no decision. This recipe uses neither and makes no AI-resilience claim.
- Full SEC datasets are not shipped. This recipe reads the actual shipped v3 CSV, not full Form D or the full-data join validator.
- Planned `data/raw/`, `data/verified/`, gate-decision directories and the unbuilt `snickerdoodle` CLI are not used.
- The composite scorer is not copied. This rule-based evidence queue avoids inventing probabilities; its familiarization run uses `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/edden-nu/runs/engine-baseline`.
- RUNNABLE-SAMPLE is supported by the recorded sample execution, conformance, audit inspection, and user acceptance. No live or VERIFIED promotion is claimed.

## Output contract

Agent: `<new run directory>/run.json`. Every fact is wrapped as `{value, source, evidence}`, where source is `record`, `model-judgment`, or `your-input`. Structural keys organize the data. The `roles` array contains identity lookup, raw historical count/titles, synthetic policy, required skill, skill-list match, liveness result/reason/gate, timing inputs/gate, action, reason, and next step. Metadata includes sample flag, fixture date, source hash, row count, and pending human clearance.

Human: `<new run directory>/report.md`, with executive summary, action table, and full per-field evidence. This separate file supports the decision: what to investigate, what project evidence to build, or what opening to skip. JSON and Markdown are generated from the same result object.

## Next action and the 3-3-2 day

- Apply: after human review, spend research-and-apply time tailoring; never auto-submit.
- Consider / unknown policy: prepare a role-specific question for networking time; no automatic outreach.
- Consider / missing skill evidence: plan a demonstrable artifact for credibility time; no claim it already exists.
- Skip: retain the reason and redirect effort; an opening-level failure is not a company-wide ban.
- Blocked: resolve the particular evidence gap before ranking or applying.

Do not force a 50% skip target: missing information is Blocked, not a fabricated negative. Report the actual result distribution.

## Run-log template

For this course repository, place the real entry in `logs/runs/2026fa-edden-nu-<n>.md` under its contribution contract. The LMS ZIP also includes that entry as `RUN_LOG.md`, satisfying the assignment's option to include it in the submission. The instructions disagree on the shared-log path; this discrepancy is recorded in the new run entry. No claim is made that the older constitution was amended.

```markdown
# Run title
## Executive summary
What ran, why, and what was learned.
## YYYY-MM-DD — sponsor-fit
- Recipe and version:
- Inputs and source hashes:
- Exact commands / real terminal-output path:
- Outputs (JSON and Markdown):
- Result and verification:
- Open issues / what was not tested:
- Human review: pending, or actual reviewer/date/decision
```
