# Test report

## Executive summary

The integrated prototype runs offline and nine tests pass. Repository conformance and manifest checks pass with three inherited warnings. The full-tree PII scanner fails on an email already present in the unchanged upstream package lockfile. PR #9 is open and the student ran the sample and nine passing tests in their working checkout. Remote CI still requires action; independent student clean-checkout execution and adequacy attestation remain incomplete.

## Environment and baseline

Node v24.11.0 and Python 3.11.7 were available. Initial repository verification failed because PyYAML was missing. PyYAML was installed in an isolated temporary environment, matching the dependency installed by upstream CI. npm dependencies were installed; installation edits to the lockfile were restored to the original upstream bytes.

The saved baseline-doctor and baseline-verify transcripts were captured after dependency repair and after initial prototype implementation, before final documentation and the HTTP-status correction. They must not be represented as pristine pre-build captures. Initial missing-PyYAML failure was observed in the assistant session but was not independently saved as a raw terminal transcript.

## Actual checks

| Check | Observed result | Evidence |
|---|---|---|
| Repository doctor after dependency installation | Exit 0; optional tooling limits remain | evidence/baseline-doctor.txt |
| Repository verify before final correction/docs | Exit 0 with three manifest warnings | evidence/baseline-verify.txt |
| ATS dry scan | Exit 1, missing portals configuration | evidence/ats-dry-run.txt |
| Browser liveness onboarding | Exit 1, missing browser executable; placeholder URL was not checked | evidence/liveness-onboarding.txt |
| Maintained composite scorer on shipped fixture | Exit 0; five roles, Apply 2 / Consider 1 / Skip 2 | evidence/engine-score.txt |
| Integrated sample after correction | Exit 0; nine cases; both outputs written | evidence/sample-run.txt |
| Offline suite | Nine tests pass | evidence/offline-tests.txt |
| 403 with visible Apply control, before correction | Test failed: Apply instead of Blocked | evidence/break-before-fix.txt |
| Repeat output-directory write | Exit 2, refused overwrite | evidence/overwrite-block.txt |
| Namespaced code conformance | Exit 0 | evidence/after-conformance.txt |
| Repository verify after correction | Exit 0; inherited warnings about archive/private/data paths | evidence/after-verify.txt |
| Repository doctor after correction | Exit 0 | evidence/after-doctor.txt |
| Full-tree PII scan | Exit 1; upstream package-lock author email | evidence/after-pii.txt |

The package-lock bytes were compared with the original base commit and are identical. No scanner rule was weakened and no protected file was changed. The PII transcript redacts the third-party email; local path prefixes in error traces are also explicitly redacted. This is an unresolved repository-wide grading prerequisite, not a clean scan.

## Named failures covered

Absent company, blank approval fields, missing timeline, impossible timeline, HTTP 404, insufficient page content, invalid date, missing required input key, missing CSV columns, and HTTP-error content with an Apply control. These checks use fixtures with no network. Policy mutation confirms that output changes when an input changes; a direct CSV comparison checks a reported company field.

## Human gate

The machine can demonstrate successful execution, source labels, and invariants. The student must still judge source adequacy, explain each rule, review the personally executed prototype, and sign only the work they actually reviewed. No human approval has been fabricated. DRAFT status remains appropriate.

## Clean-checkout and scope evidence

See clean-checkout.txt and scope-stat.txt after packaging validation. The checkout used for these checks has no private student profile. A local check is not GitHub CI, and the prototype's network-free tests do not establish live ATS functionality.
