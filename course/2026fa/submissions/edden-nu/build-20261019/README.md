# Mode Build Assignment — submission guide

## Executive summary

This submission reruns an existing sponsorship-evidence prototype against real repository company data, adds a direct maintained-script audit and independent verification, and records an honest sample result. It includes the recipe, justification, worked run, machine log, human report, run log, and presentation notes. Sample review completed on 2026-10-21; live use remains unapproved.

## Latest files

- Mode: `recipes/cases/2026fa/edden-nu-sponsor-fit.md`, version 1.1.0, RUNNABLE-SAMPLE.
- `HUMAN-REVIEW.md` and `human-review.json`: later sample review and lifecycle evidence.
- `DOMAIN-JUSTIFICATION.pdf`: one-page justification; `DOMAIN-JUSTIFICATION.md`: matching editable text.
- `WORKED-RUN.md`: exact commands, pasted terminal output, evidence distinctions, attestation, reflection.
- `run/run.json` and `run/report.md`: machine and human outputs.
- `RUN_LOG.md`: real entry, also stored in the repository contribution log namespace.
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

## Submission paths

The assignment submission is under `assignments/submissions/edden-nu/` on branch `mode/edden-nu-sponsor-fit`. Identical copies under `course/2026fa/submissions/edden-nu/build-20261019/` preserve the existing reproducible command paths. The mode is under `recipes/`. The included RUN_LOG entry satisfies the assignment's option to include it in the submission rather than editing the protected shared log. This follows the supplied assignment's specific branch and path requirements; the repository's older contribution convention is documented in the run log.

## Review status and lifecycle

Sample review outcome: reasonable; no questions. Independent execution by the reviewer and live gate clearance are outside the scope of this record. The original pending-review outputs are preserved as historical evidence; the later review is recorded separately. The recipe is RUNNABLE-SAMPLE, not RUNNABLE-LIVE or VERIFIED.
