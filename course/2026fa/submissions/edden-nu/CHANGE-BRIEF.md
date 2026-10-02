# Change brief — sponsorship evidence triage

## Executive summary

Build a small offline recipe that reads company evidence and turns fictional opening inputs into an auditable research queue. It addresses the mismatch between historical company sponsorship and individual early-career opportunities. The program will stop rather than invent missing evidence.

## Prediction record, before this revision's implementation

Date: 2026-09-30. Author: AI assistant, awaiting student review. Namespace `student-pending` is temporary until the student supplies a GitHub handle.

Earlier work followed a different 25-point assignment and already tested synthetic page classification. In particular, insufficient-content expiry is a KNOWN finding, not a new prediction. This document precedes the new integrated prototype only; it does not claim to precede all exploration.

Target situation: early-career Information Systems applicants comparing software engineering, analytics, and design opportunities where role-specific sponsorship evidence is unclear. Demonstration data will use the repository's fictional Aarav Patel persona rather than the student's personal history or immigration information. The persona is a method demonstration, not a claim that its circumstances equal the student's.

Reuse: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`; `scripts/ats/liveness-core.mjs`; `scripts/score/role-scorer.mjs` via CLI (its current file calls main unconditionally); fictional `search/examples/aarav-patel/resume.example.json` and `profile.yml`. No resume copy or personal data will be committed.

Build: one Python runner using the standard library for CSV and validation, invoking a small Node adapter for the existing liveness classifier. It will write labeled JSON plus a human Markdown report into a new run directory. It will not compute sponsorship probabilities. Instead, it will explain why the aggregate scorer is not used for the triage recommendation, and run the existing scorer separately as the required engine familiarization exercise.

Gates: required source/schema checks; explicit synthetic liveness and timeline inputs; human review of source identity, page status, timeline assumptions, and adequacy before any real application. Unknown timing must BLOCK, not default to 1. A closed page or impossible timeline must SKIP. Machine output never invents human clearance.

Predicted failure cases to exercise:

1. Exact employer absent from CSV → blocked row, no historical count or numeric probability invented.
2. Blank approval field → explicit unknown, not zero or a non-sponsor label.
3. Timeline deadline absent → blocked row, no implicit healthy gate.
4. Earliest assumed start after deadline → Skip independent of other positive evidence.
5. HTTP 404 snapshot → Skip independent of company history.
6. Missing required CSV column / malformed date → clear failure, no successful result files.

First-pass coverage prediction: the prototype will not distinguish genuine corporate aliases or determine whether a specific historical title is equivalent to a target role. Exact matching will block some otherwise plausible leads. Test an absent/alias key and document that limitation instead of adding fuzzy matching.

Planned offline verification: golden semantic assertions for the above cases; poison missing gates and corrupt input schema; recursively check source labels; compare one emitted company field to its source row; ensure existing run directories cannot be overwritten. Store real terminal output.

## Later revisions

Append findings here after execution; do not rewrite the prediction record.

- Student supplied handle `edden-nu`; temporary namespace was renamed before committing.
- The integrated run exercised nine sample cases. Exact-key absence and missing timing correctly blocked; blank approvals stayed unknown.
- A further break attempt, not an original prediction, used HTTP 403 with an Apply control. The initial wrapper returned Apply. Added an HTTP-status guard; non-2xx responses other than explicit 404/410 now block. The maintained classifier was not edited. The failing transcript is retained with only the local path prefix redacted.
- First-pass prediction confirmed as a limitation: no aliases or semantic occupational equivalence are resolved.
