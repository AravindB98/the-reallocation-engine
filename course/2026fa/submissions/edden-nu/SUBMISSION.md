# Submission — sponsorship evidence triage

## Executive summary

This submission contains a working offline prototype, a recipe/card, tests, and recorded sample outputs. The student personally ran the prototype and nine passing tests on October 2. It remains DRAFT: human adequacy attestation is unsigned, remote CI requires action, and the inherited full-tree privacy-scan finding remains unresolved. These limitations may affect grading.

Assignment: The Reallocation Engine — Recipe Design Assignment

Student: edden-nu (Canvas identifies the enrolled student)

GitHub handle: edden-nu

Domain / situation: early-career Information Systems sponsorship evidence triage using a fictional demonstration persona.

Recipe path: `recipes/cases/2026fa/edden-nu-sponsor-fit.md`

Setup: Node 20+, Python 3; run `npm install`. Repository verification also requires PyYAML (`python3 -m pip install PyYAML` in a suitable virtual environment).

Prototype command (from repository root; use a new output directory each time):

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/grader-run-01
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py
```

GitHub repository: https://github.com/edden-nu/the-reallocation-engine-fall-2026

Branch: `contrib/2026fa-edden-nu-sponsor-fit`

PR URL: https://github.com/nikbearbrown/the-reallocation-engine/pull/9

Submitted commit SHA: recorded in the archive-root SUBMISSION.md packaging receipt and Git archive metadata. The receipt is generated after committing to avoid a self-referential commit hash.

Lifecycle stage claimed: DRAFT (working offline sample; human adequacy review pending).

Summary of my changes: Python runner, adapter to the maintained liveness classifier, nine fictional cases, offline tests, labeled JSON/Markdown reports, recipe/card, predictions, domain justification, worked run and transparent AI attribution. Codex authored the implementation and initial documents; the student supplied context, completed GitHub setup, and personally ran the sample and tests.

Known limitations: no live employer verification; exact-name matching; simple skill tokens; assumed timing; no legal eligibility computation or probability model. The inherited package-lock privacy finding remains. Remote verify and Contrib Gate showed action_required on October 3, not green. Student independent clean-checkout execution, signed adequacy attestation, full policy review confirmation, and classroom presentation are not claimed complete.

## Current submission

The finalized Mode Build deliverables are in `assignments/submissions/edden-nu/`; the synchronized execution-path copy is `course/2026fa/submissions/edden-nu/build-20261019/`. Earlier records in this folder remain historical evidence.
