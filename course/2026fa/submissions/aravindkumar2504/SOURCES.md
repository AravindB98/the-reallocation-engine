# Sources and assistance

## Executive summary

This page credits everything the work builds on, and says plainly what an AI assistant did and what the author decided, checked, changed or rejected. It exists so a reviewer can tell whose judgment stands behind each part, and so nothing the assistant produced is passed off as the author's own checking. Where the author has not yet done a check, this page says so.

## Repository and governing documents

- The Reallocation Engine repository (`nikbearbrown/the-reallocation-engine`), forked to `AravindKumar2504/the-reallocation-engine` and worked on from base commit `015843d`. Read first: `SNICKERDOODLE.md`, `DOMAIN.md`, `DATA_CONTRACT.md` (the Zero-Conditions section), `CONTRIBUTING.md`, `recipes/README.md`, `recipes/cases/README.md`, and `recipes/_shared.md` (the run-log shape).
- Style models for the recipe and card: `recipes/local-wage-adjustment.md` and `recipes/local-wage-adjustment.card.md`. The Summer 2026 case recipes in `recipes/cases/2026su/` were surveyed (by a read-only assistant task) only to avoid duplicating one; all 14 are unbuilt drafts and none was reused.
- The decision core, used unmodified and run as a command: `scripts/score/role-scorer.mjs`. Its input shape follows `data/examples/ch11-roles.json`.
- The name-matching rule is a line-for-line port of `normalize_company_name` in `scripts/sec/entity-resolution.py`.
- Book chapters in `book/chapters/`: 7 (the four-tier vocabulary and "Unknown is not Avoid"), 10 (the timeline factor as a number between 0 and 1, computed from dates) and 11 (the scorer). The tier values 0.9 and 0.6 are chapter 11's worked-example values.
- The five personas in `search/examples/`: four existing fictional personas (used for tests and scenario runs) and one new fictional persona added for this work.

## Data

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: the 80 Days to Stay table (Nik Bear Brown, Humanitarians AI), 30,369 companies. Its README and audit were read: `data/80-days-to-stay/data/README.md` and `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`.
- `data/sec/form-d/processed/sample/*.sample.json`: the shipped SEC Form D samples (200 records over four quarters). Only samples ship; full quarters are not committed.
- `data/bls/compact/soc_occupation_compact.csv`: the compact BLS OEWS and O*NET extract (OEWS 2024).

## Course documents

- The assignment page, read through the university's course site with the author signed in.
- The course's Frictional, GitHub posting and Relative Quartile documents were read. **The course AI policy document and its video were not read by the assistant** in this session, at the author's direction. Whether the author has read or watched them is the author's to state: [author to confirm].

## Tools

Node and the repository's `js-yaml` dependency (the prototype and its tests); Python only in checks that compare the prototype with the repository's own Python name rule; the repository's own commands (`npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs`, `npm run score`, `npm run ats:liveness`); Playwright's headless Chromium, downloaded with the author's permission so the liveness command could run once; Claude Code (model: Sonnet 5.5) as the assistant.

## What the assistant did and what the author did

| Work | The assistant (Claude Code) | The author (Aravind Sundaravadivelu) |
|---|---|---|
| Reading the assignment, repository, documents and data | read them, ran the repository's commands, probed the data and the scorer, and reported what it found (including two scorer defects) | signed in so the assignment page could be read; told the assistant not to read the AI policy; approved forking and cloning |
| Choosing the recipe | proposed a design and two alternatives, with reasons | chose "pre-OPT backend sponsor tiers" among three options |
| Attribution | asked first, as the author's notes require | chose no co-author trailer or PR footer, so AI use is disclosed here, in the README, and in `FRICTIONAL.md` |
| Downloads | asked before downloading | approved the Chromium download |
| Predictions, recipe, card, code, tests, run, reports | wrote all of them, ran all of the commands, and recorded the results | **has not yet reviewed the code, the parameters or the reports line by line** [author to complete] |
| Parameters (thresholds, windows, the title rule) | proposed them, each with a sentence of reasoning | **not yet confirmed** [author to confirm or change] |
| Checking | ran the tests, a deliberate-break harness, a name-rule comparison against the Python original, and a hand check of report values against raw rows; labelled 80 titles by hand | **not yet done** [author to add any check the author personally makes] |
| Corrections | found and fixed its own errors (the Form D overlap figure, a gap in its own tests, wrong expected numbers in tests) | not applicable yet |
| Still only the author can do | | read the report and sign the adequacy line in the run log; decide whether to push and open the pull request; present in class; upload to the course site; state what was understood |

Nothing in this work was copied from another student's submission. No real personal data was used: the persona, its dates and its contact details are invented, and the repository's own personal-data scan is run and pasted in the test report.
