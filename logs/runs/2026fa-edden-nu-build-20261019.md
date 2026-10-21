# Run record — sponsorship evidence triage build

## Executive summary

The sponsorship sample and a maintained company-data audit ran on real repository data. Independent checks confirmed counts, source values, and repeatability; intentional malformed-input and overwrite tests behaved as expected. Sample review was pending at execution time; the dated review entry below records its completion.

## 2026-10-19 UTC — edden-nu-sponsor-fit v1.1.0

- Local date: 2026-10-18 America/New_York.
- Inputs: shipped v3 company CSV, sanctioned fictional persona, nine synthetic cases dated 2026-09-30. Exact paths and hashes: `course/2026fa/submissions/edden-nu/build-20261019/PROVENANCE.json`.
- Commands and real outputs: `course/2026fa/submissions/edden-nu/build-20261019/commands.json`, `evidence/`, and `WORKED-RUN.md`.
- Outputs: separate `run/run.json` and `run/report.md`, maintained H-1B audit, repeat output, independent verification, updated recipe and card, justification and presentation guide.
- Results: 30,369 CSV rows; 1,557 H-1B-populated rows; 9 cases → Apply 1 / Consider 2 / Skip 3 / Blocked 3. Apply is a pending review suggestion. Nine tests pass; overwrite refusal exits 2; independent rerun matches.
- Governance discrepancy: assignment and constitution request shared RUN_LOG; Fall 2026 contribution rules prohibit editing it. This namespaced entry plus the submission's RUN_LOG copy preserves the requested record without changing a protected shared file. Assignment folder layout is mirrored in the ZIP; PR uses course namespace.
- No human gates cleared, lifecycle promotion, live application, or legal eligibility claim. DRAFT retained. No open TODO closures claimed.
- Verification limits: original employer join, live posting status, real authorization, skill proficiency, human adequacy and remote CI remain unverified. Verify passes with inherited manifest warnings. Full-tree privacy scan has an inherited lockfile finding; branch-only scan is reported separately.
- Changes in this build: documentation v1.1.0, fresh execution evidence, independent verification script. Existing triage implementation and classifier unchanged.

## 2026-10-21 — sample review recorded

Reviewer: edden-nu. Sample review outcome: reasonable; no questions. Scope is sample acceptance, not independent execution or live gate clearance. See `course/2026fa/submissions/edden-nu/build-20261019/HUMAN-REVIEW.md`. Recipe v1.1.0 is now RUNNABLE-SAMPLE based on the existing complete sample run, conformance, audit inspection, and this acceptance. Original run evidence is unchanged.

## 2026-10-21 — submission format reconciliation

- The supplied Mode Build assignment takes precedence for branch naming and document placement: `mode/edden-nu-sponsor-fit` and `assignments/submissions/edden-nu/`. Matching course-namespace copies retain reproducibility of already recorded commands. No shared governance file or protected shared log is changed.
- The Worked Run now includes the required By/name/date line, scoped to the recorded sample review; independent execution is not attributed to the reviewer.
- The domain justification is rendered as a one-page PDF alongside its Markdown source.
- Current submission documents are synchronized from the reviewed ZIP. The extra Chinese reading guide is removed from the active submission; a local copy remains outside the submission. Original terminal outputs, synthetic inputs, and source-data hashes remain unchanged.
