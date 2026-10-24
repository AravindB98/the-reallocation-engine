# SOURCES — swe-h1b-15-1252

## Executive summary
**What:** credits for everything this submission uses, and what the AI contributed versus what I decided.
**Why:** the assignment requires it, and the engine's own rule is that every input is traceable.
**Found:** one repository, five governing documents, one shipped dataset, one AI assistant.
**Did not do:** cite any figures from the 3-3-2 essay; none are used in this submission.

## Repository and governing documents
- `nikbearbrown/the-reallocation-engine` (Fall 2026 cut, upstream commit d08afdd), forked as `jayant-majji-14/the-reallocation-engine`.
- `SNICKERDOODLE.md` (incl. P9, executive summary first), `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md` (§Zero-Conditions), `recipes/README.md`, `recipes/_shared.md`.
- Style models: `recipes/local-wage-adjustment.md` and `recipes/local-wage-adjustment.card.md`; run-log format mirrored from maintainer entries in `logs/RUN_LOG.md` (not edited).

## Data
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, shipped with the repo (80 Days to Stay). Per its README, mapped against DOL LCA disclosure data and the USCIS H-1B Employer Data Hub; I did not re-check against either.
- `data/examples/ch11-roles.json`: input shape and the tier p-value convention.
- Two public job postings (6sense on Greenhouse, A10 Networks on Workday), checked for liveness on 2026-10-01.
- Not used: Form D samples, BLS/O*NET data.

## Scripts reused (not copied)
- `scripts/score/role-scorer.mjs` via `npm run score`
- `scripts/ats/check-liveness.mjs` via `npm run ats:liveness`
- `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/manifest-check.mjs`, `scripts/pii-scan.mjs`

## Essay
Nik Bear Brown, *The 3-3-2 Split: Why Your Job Search Is Probably Backwards*, used for the 3-3-2 framing only. No figures from it are cited.

## Tools
Node 23.7, Python 3.14 (standard library only), Playwright (Chromium), git, VS Code, macOS.

## AI contribution vs. mine
**Claude (Anthropic), via claude.ai** proposed the recipe design, the tier and timeline rules, and the scope cuts (no live network calls, Form D deferred). It wrote first drafts of all code, tests, fixtures, and documents, gave me each command to run, and pointed out problems in the outputs (home path in files, the `record` label overclaim, the pipe exit-code mistake).

**I** chose the situation (F-1 OPT, Software Engineer roles); ran every command and reported real output; found the job postings and confirmed none were open at Abacus or 1upHealth; set the fit values; kept the 10–15 minute estimate based on my own job search; made the code edits; reviewed each document before saving; and made every commit. Full detail is in `FRICTIONAL.md`.

I can explain every gate, number, and line of the prototype. Where I accepted an AI assumption without validating it (the tier threshold, the 60-day lag), the recipe marks it `[VERIFY]`.