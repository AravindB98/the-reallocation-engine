# Sponsorship evidence triage sample run

## Executive summary

The integrated offline prototype reads real company data and fictional openings and produces labeled JSON and Markdown. A deliberate HTTP-error test exposed a first-pass failure, now corrected. Human adequacy review and live verification remain pending.

## 2026-09-30 — sponsor-fit

- **Recipe:** `recipes/cases/2026fa/edden-nu-sponsor-fit.md`, v1.0.0, DRAFT.
- **Inputs:** shipped v3 company CSV, sanctioned fictional Aarav Patel skills, nine synthetic scenarios in the prototype folder.
- **Commands:** `python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/sample-02`; `python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py`.
- **Outputs:** `course/2026fa/submissions/edden-nu/runs/sample-02/run.json` and `report.md`; terminal evidence in the student's `evidence/` directory.
- **Result:** 30,369 source rows read; nine synthetic cases; Apply 1, Consider 2, Skip 3, Blocked 3. Nine offline tests pass after the HTTP-status correction. Blocked is not counted as Skip.
- **Verification:** source-field comparison; schema/date break attempts; closed/missing gates; unknown history; source labels; policy mutation. Previous failure output retained with local path redaction.
- **Open issues:** human review pending; no original H-1B join verification, actual job policy or live URL evidence, or real eligibility assessment. No private student profile committed. GitHub/Canvas handoff pending.
- **Execution attribution:** assistant ran commands; no human clearance or student-run attestation claimed. This separate entry follows the Fall 2026 namespace rule; shared `logs/RUN_LOG.md` unchanged.

## October 2–3 follow-up

The student ran the prototype into runs/student-first-run, opened the report, and ran nine passing tests (0.465s). See the submission worked-run document for transcribed evidence and attribution. PR #9 is open. October 3 remote checks remain action_required. Human adequacy attestation, independent student clean-checkout execution and classroom demonstration are not claimed complete.
