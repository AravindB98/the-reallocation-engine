# Frictional — observed work, not invented effort

## Executive summary

The work changed substantially after a newer assignment was supplied. This record separates assistant actions from student actions and records actual environment failures, a failing test, and the remaining human review. It does not claim the student executed commands they have not executed.

## Contributions

- Student: supplied the original and updated assignment, chose the career context, supplied a teaching-video link, requested revision, and supplied GitHub handle `edden-nu`.
- AI assistant: inspected the repository, proposed the workflow, wrote the prototype/tests/documents, executed local commands, diagnosed failures, and prepared the handoff.
- Student decisions/checks still pending: review of the code and evidence, independent clean-checkout execution, adequacy judgment, presentation practice, and final course-policy/submission review. No acceptance of individual design choices or human attestation has been fabricated.

## Actual attempts and responses

| Attempt / expectation | Observed difficulty or check | Response / learning | Trace |
|---|---|---|---|
| Follow the first assignment | It allowed design without implementation; a later file required a working prototype, PR, and 100-point rubric | Retained old work outside this branch; wrote a new prediction record before integrated implementation | `CHANGE-BRIEF.md`; supplied assignment |
| Run repository verification | Initial `npm run verify` failed because Python lacked PyYAML | Installed PyYAML in a temporary virtual environment; later verification passes with upstream warnings | `TEST-REPORT.md`, `evidence/baseline-verify.txt` |
| Install npm dependencies | First sandboxed install failed with npm exit-handler/cache errors | Retried with an allowed temporary cache; restored only the lockfile changes made by this install, preserving upstream dependency versions | Session command history; no package-lock diff |
| Run ATS onboarding | Dry scan lacked `portals.yml`; browser CLI lacked Chromium executable | Recorded failures; do not claim live ATS verification. Offline prototype imports deterministic classifier and needs no browser | `evidence/ats-dry-run.txt`, `evidence/liveness-onboarding.txt` |
| Break an apparently healthy role | HTTP 403 plus Apply control yielded Apply in the first wrapper | Added a status guard; report Blocked, retain raw classifier result; all nine tests pass | `evidence/break-before-fix.txt`, `evidence/offline-tests.txt` |
| Repeat a saved run | Existing output directory rejected with exit 2 | Use new run IDs to preserve audit history | `evidence/overwrite-block.txt` |
| Prepare GitHub delivery | CLI unavailable and browser not logged in | Local work prepared; no PR, CI-green, or Canvas claim | `SUBMISSION.md` |

## Unresolved questions

Do exact-name matches correspond to the actual hiring entity? Does role policy vary by seniority? What real timeline evidence would a human accept? Can a student explain why a record of classifier output is different from a record of a live job? These are not solved by successful parsing or a passing test.

The revised prototype preserves the previous short-page finding as prior knowledge. It does not call that an original prediction. The 403 failure is a new observed correction in this revision.
