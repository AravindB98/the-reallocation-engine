Drafted by Claude Code; reviewed by Nishant, 2026-10-20.

# Submission index — Reallocation Engine Mode Build (nishant2681)

## Executive summary

This page is a map. It lists where each part of the Mode Build submission
lives, so a grader can find it without searching. The submission is a
job-triage mode for international data-analytics graduates who need visa
sponsorship. It reached "runnable on sample data", with one real run and the
checks behind it. The files sit in the repository's student folders, not
the folders the assignment sheet names, for the reason given at the end.

## Deliverables

| Deliverable | Path |
|---|---|
| Mode file (recipe, agent-facing), v0.2.0, status RUNNABLE-SAMPLE | `recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md` |
| Mode file (human card) | `recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.card.md` |
| Domain justification (one page) | `course/2026fa/submissions/nishant2681/DOMAIN-JUSTIFICATION.md` |
| Worked run (v0.2.0): verbatim output, verified vs inferred, verification, attestation, reflection | `course/2026fa/submissions/nishant2681/MODE-BUILD-WORKED-RUN.md` |
| RUN_LOG entry (v0.2.0): TODO closures, gate decisions, promotions, sample run 3, engine runs | `logs/runs/2026fa-nishant2681-2.md` |
| Earlier RUN_LOG entry (v0.1.0) | `logs/runs/2026fa-nishant2681-1.md` |
| Scripts (prototype, extract builder, report writer) | `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/` (`run_sample.py`, `sponsorship.py`, `gates.py`, `report.py`, `extract_uscis.py`, `README.md`) |
| Tests (58), including the break-attempt mutant | `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests/`, `fixtures/BROKEN-uscis-no-cap.py` |
| Sample data: fictional jobs and personas, a real 10-row CSV fixture, the real USCIS FY2022 extract and its provenance | `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/` |
| Evidence run (v0.2.0) | `course/2026fa/submissions/nishant2681/runs/2026-10-20-sample-3/` |
| Engine runs, 2026-10-20 (`ats:scan`, `ats:liveness` ×3, `score`) | `course/2026fa/submissions/nishant2681/engine-runs/2026-10-20-*` |
| Test, verify, doctor, PII and cross-check outputs, 2026-10-20 | `course/2026fa/submissions/nishant2681/mode-build-evidence/` |
| Design history: change brief, with an append-only §8 revision for v0.2.0 | `course/2026fa/submissions/nishant2681/CHANGE-BRIEF.md` |
| v0.1.0 history (Mode Design): worked run, test report | `WORKED-RUN.md`, `TEST-REPORT.md` in the same folder; git tag `mode-design-submission` |

No personal data is included. The persona and postings are fictional; the
sponsorship rows are public records.

## Why these paths

I followed the repository's `CONTRIBUTING.md` and its CI paths:
`recipes/cases/`, `course/2026fa/submissions/`, `logs/runs/`, and the branch
`contrib/2026fa-nishant2681-data-analytics-opt-h1b` (PR #17). I did not use
the assignment's `recipes/`, `assignments/submissions/` and `mode/…` names,
because the CI contrib gate (`.github/workflows/contrib-gate.yml`) rejects
files outside its allowed paths, and `CONTRIBUTING.md` forbids editing
`logs/RUN_LOG.md`.
