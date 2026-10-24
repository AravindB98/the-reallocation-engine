# SOURCES — opt-countdown (salonimathure20)

## Summary

This file credits everything the submission was built from (the repository, its rules, its data, outside services and tools) and states plainly what an AI agent did versus what I, the student, decided. Most of the code and prose was drafted by an AI coding agent working under my direction. The choices of situation, recipe and scope, and the approvals, were mine.

## Repository and governing documents

- *The Reallocation Engine*: https://github.com/nikbearbrown/the-reallocation-engine (Nik Bear Brown), forked at commit `015843d`.
- `SNICKERDOODLE.md` (lifecycle, gates, attestation format), `DOMAIN.md` (known gaps 3 and 9), `CONTRIBUTING.md` (namespaces, engine API rule), `DATA_CONTRACT.md` §Zero-Conditions (fictional personas only), `recipes/_shared.md` (run-log template), `recipes/local-wage-adjustment.{md,card.md}` and `recipes/scan.md` (style models).
- `docs/chapter-research-map.md` §Ch.5: the sponsorship tier cut-offs (Proven ≥ 0.65, Likely ≥ 0.35) reused in the sponsorship mapping.
- `search/examples/priya-nair/profile.yml`: the shape of the persona's `visa` block.
- *The 3-3-2 Split* essay (Nik Bear Brown), cited for the time split only. No figures from it are reused.

## Code reused (called, not copied)

- `scripts/score/role-scorer.mjs`: every Apply/Consider/Skip decision.
- `scripts/ats/check-liveness.mjs` via `npm run ats:liveness`: browser liveness.
- `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/pii-scan.mjs`, `scripts/manifest-check.mjs`: checks.

## Data

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (80 Days to Stay, Humanitarians AI): SEC Form D × DOL/USCIS H-1B join. The test fixture `fixtures/test/sponsors-mini.csv` is three rows copied from it with the phone and officer columns removed.
- `data/bls/compact/soc_occupation_compact.csv`: BLS OEWS 2024 wages + O*NET. The test fixture `soc-mini.csv` is two rows copied from it.
- `data/sec/form-d/processed/sample/`: read but **not used** (it does not cover the target companies).

## External services (network, run by hand, never by the prototype)

- Public job postings on Klaviyo, PathAI, Toast, Formlabs and Iterative Health careers sites, observed 2026-10-03.
- Greenhouse Job Board API, `https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>`: public, no key. Used for liveness (step 3).
- Playwright headless Chromium, downloaded with `npx playwright install chromium` (approved by me) so `ats:liveness` could run.

## Personas

`ananya-rao-example` (worked run) and `test-persona-example` (tests) are **fictional**, using `@example.com` and 555 numbers. They describe the target situation this recipe is designed for and contain no real person's data: no dates, résumé, contacts or immigration details.

## Tools

- Claude Code (Anthropic, model Claude Opus 5.5), the AI agent, in the Claude desktop app.
- Node 20.20.2, Python 3.13 (with a throwaway virtualenv for `pyyaml`), git, curl.

## What the AI contributed versus what I decided

| Part | AI agent (Claude Code) | Me (salonimathure20) |
|---|---|---|
| Career situation | turned my choice into a concrete persona (dates, SOC codes, clock numbers) | chose "MS student, data/SWE roles, F-1" |
| Recipe idea | offered three options with a recommendation | chose *opt-countdown* |
| GitHub workflow | built the branch locally; prepared the PR text | chose to fork on github.com and open the PR myself |
| Downloads | asked before downloading Playwright Chromium | approved it |
| Data exploration, company selection, postings | did it (picked real CSV sponsors with live Greenhouse postings, plus the HubSpot/DraftKings gaps) | — |
| Prototype code, tests, fixtures | wrote all of it | — |
| Formulas (runway, timeline factor, sponsorship mapping, hiring-lag bands) | proposed them | — *(review pending)* |
| Fit values (model-judgment) | proposed them from posting titles | — *(review pending)* |
| Recipe, card, brief, justification, worked run, test report, run log | drafted all of them | — *(review pending)* |
| Finding the liveness false positive and the even-counts pattern | found them while testing | — |
| Self-corrections | caught a wrong break-even number (0.59 → 0.559), a silent fallback, a persona date inconsistency | — |
| G4 sign-off, attestation | not done; an AI cannot sign the human gate | **still to do** |

Rows marked *review pending* are drafts I am responsible for checking before I present this work. Anything I change after review will be committed on this branch and noted in `FRICTIONAL.md`.
