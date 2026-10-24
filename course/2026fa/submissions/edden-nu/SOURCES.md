# Sources and AI contribution

## Executive summary

This submission uses the engine's company data and actual liveness classifier, plus a sanctioned fictional persona. The assistant authored and ran the initial implementation; student review is still pending. Synthetic job inputs are explicitly invented and do not represent employer statements.

## Repository sources

Upstream base: `015843d5047dbadff05068495e4c5db5cd9945f4`, [The Reallocation Engine](https://github.com/nikbearbrown/the-reallocation-engine/tree/015843d5047dbadff05068495e4c5db5cd9945f4).

- Governance: `SNICKERDOODLE.md`, `DOMAIN.md`, `_MANIFEST.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md`, `recipes/README.md`, `recipes/_shared.md`.
- Style: `recipes/scan.md`, `recipes/local-wage-adjustment.card.md`.
- Data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`. Its hash appears in each run; no public-company phone/contact fields are copied.
- Source limitations: `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md`. This is a related dataset audit, not an independently verified claim about every v3 record.
- Fictional persona: `search/examples/aarav-patel/resume.example.json` and `profile.yml`; skill tokens are read directly. The persona is not the student and its immigration dates are not transferred to the student.
- Maintained code: `scripts/ats/liveness-core.mjs`, `check-liveness.mjs`, `liveness-browser.mjs`; `scripts/score/role-scorer.mjs`, `data/examples/ch11-roles.json` for a separate engine demonstration.
- Validation: `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/manifest-check.mjs`, `scripts/pii-scan.mjs`.

## Assignment and teaching references

- User-supplied **The Reallocation Engine — Recipe Design Assignment**, INFO 7375, Fall 2026, 100 points. It supersedes the earlier 25-point text. The relative linked policy file was not included in the attachment and was not found locally; full policy-file review remains pending.
- [AI Policy for Professor Bear's Courses](https://www.youtube.com/watch?v=8Ut0Cdl6vMw): the publisher description was reviewed; full video/transcript not claimed. It permits AI assistance with citation and expects students to explain their work. Student must read/watch the assigned policy materials personally before submission.
- [Job-Hunting in Public, Without Needing a Job](https://www.youtube.com/watch?v=U6UdCOMBuUI): expanded publisher description/chapter labels reviewed earlier; transcript unavailable. Informs separation of evidence and judgment, not a new grading rule.

## Attribution and unresolved human review

AI assistant (Codex): repository inspection, code and test authoring, fixture design, local execution, failure diagnosis, documentation drafts, and packaging. Runtime prototype: no AI API calls, only deterministic code. `model-judgment` labels disclose designed interpretations rather than imply a model ran during execution.

Student: provided the assignment and context, requested correction to the new requirements, and supplied the GitHub namespace. No claim is made that the student has personally tested or approved the current implementation. They must update this statement with actual accepted, modified, or rejected choices after review, not invent a contribution history.
