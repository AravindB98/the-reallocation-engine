# Mode Build Assignment — submission guide

## Executive summary

This submission reruns an existing sponsorship-evidence prototype against real repository company data, adds a direct maintained-script audit and independent verification, and records an honest sample result. It includes the recipe, justification, worked run, machine log, human report, run log, and presentation notes. The user accepted the sample results on 2026-10-21; live use remains unapproved.

## Latest files

- Mode: `recipes/cases/2026fa/edden-nu-sponsor-fit.md`, version 1.1.0, RUNNABLE-SAMPLE.
- `HUMAN-REVIEW.md` and `human-review.json`: later sample review and lifecycle evidence.
- `DOMAIN-JUSTIFICATION.md`: one-page-length justification.
- `WORKED-RUN.md`: exact commands, pasted terminal output, evidence distinctions, attestation, reflection.
- `run/run.json` and `run/report.md`: machine and human outputs.
- `RUN_LOG.md`: real entry, also stored in the repository's student log namespace.
- `PRESENTATION.md`: five-minute speaking guide.
- `commands.json`, `evidence/`, `PROVENANCE.json`: actual execution and reproducibility evidence.

## Reproduce

Use Node 20+ and Python 3.9+. Install `npm install`; repository conformance also requires PyYAML (use an isolated Python environment and activate it). Run from repository root, using a NEW output directory:

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/your-new-run-id
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py
npm run verify
npm run doctor
```

The source CSV and fictional persona ship with the pinned repository. The sample makes no live employer or immigration claims. No personal records are included.

## Submission paths and existing PR

The assignment requests `assignments/submissions/<name>/`; this checkout's Fall 2026 contribution contract instead requires `course/2026fa/submissions/<handle>/` and prohibits shared-log edits. The ZIP includes the requested assignment layout plus the executable repository paths. The existing PR uses the repository's accepted student namespace. This path conflict is disclosed rather than treated as a silent change to the assignment. Existing PR: https://github.com/nikbearbrown/the-reallocation-engine/pull/9 . The LMS ZIP still needs uploading by the student.

## Review status and lifecycle

The user accepted the sample results as reasonable and reported no questions. No independent student rerun, class presentation, or live gate clearance is claimed. The original pending-review outputs are preserved as historical evidence; the later review is recorded separately. The recipe is RUNNABLE-SAMPLE, not RUNNABLE-LIVE or VERIFIED.
