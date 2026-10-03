# SOURCES — data-role-sponsor-match

## Repository and governing documents

- *The Reallocation Engine*, Nik Bear Brown: https://github.com/nikbearbrown/the-reallocation-engine (forked at upstream commit `015843d`).
- `SNICKERDOODLE.md` (lifecycle gates, prime directive), `DOMAIN.md` (Known gaps 3 and 9), `CONTRIBUTING.md` (namespaces, engine API), `DATA_CONTRACT.md` §Zero-Conditions, `recipes/_shared.md` (run-log template), `recipes/local-wage-adjustment.{md,card.md}` and `recipes/scan.md` (style models).
- Book chapters 7, 8, 10 and 11 (`book/chapters/`), which define the sponsorship, liveness, timeline and scorer terms.

## Data (all shipped in the repo; nothing downloaded except live posting checks)

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: 80 Days to Stay company/sponsorship/funding table.
- `data/sec/form-d/processed/sample/companies-sec-2025q{2,3,4}-d.sample.json`, `companies-sec-2026q1-d.sample.json`: SEC Form D samples (first 50 companies per quarter).
- `data/bls/compact/soc_occupation_compact.csv`: BLS OEWS (2024) + O*NET compact extract.
- Public job postings: Greenhouse job-board API (`boards-api.greenhouse.io`) and the companies' careers pages, observed 2026-10-03 through `ats:scan`, `ats:liveness` and `greenhouse-check.mjs`. These are public data. Nothing personal.

## Code reused (called, not copied)

- `scripts/score/role-scorer.mjs` (Ch.11 scorer), run as a subprocess.
- `scripts/ats/scan.mjs`, `scripts/ats/check-liveness.mjs` (via `npm run ats:scan` / `ats:liveness`).
- `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/pii-scan.mjs`.

## Personas

The profile in `fixtures/worked-run/candidates.json` is fictional and contains no name or contact data. It is modelled on the student's situation (program type, graduation term, target role family). All dates are invented.

## Tools and AI contribution

- **Claude Code (Anthropic, Claude Opus 5.5)** was used throughout this session. It:
  - read the repo docs and data;
  - fixed the local Windows environment (a `python3` shim outside the repo; re-checkout with LF line endings);
  - ran the baseline commands;
  - found the two upstream defects (the scorer's authorization regex and the liveness redirect false positive);
  - wrote all prototype code, tests and fixtures, and drafted the recipe, card, brief, justification, worked run, test report and run log;
  - ran the break attempts and the mutation tests.
- **What the student decided, checked, changed or rejected:** [STUDENT: fill this in honestly. For example: whether the persona matches your real situation, whether you agree that "Senior Credit Risk Analyst" is not a data title, whether you accept DRAFT as the claimed stage, what you re-ran yourself, and anything you changed. Misrepresenting authorship is an academic-integrity matter under the course AI policy.]
- Node.js 24.14.0, Python 3.13.2, Playwright headless Chromium (installed via `npx playwright install chromium-headless-shell`), Git for Windows.
