# SOURCES

## Executive summary

**What this is.** Credits for everything this submission builds on (repository, rules, data, tools), plus a plain account of what the AI contributed and what I decided.

**Why read it.** To check that nothing here is presented as more original, or more verified, than it is.

**What it says.** The engine, its rules, its data and its scorer are the course repository's. The recipe, prototype and documents were drafted and run by an AI agent in my session, and I made the scoping decisions. No figure from the 3-3-2 essay is cited as a record.

## Repository and governing documents

- *The Reallocation Engine*, Nik Bear Brown: `github.com/nikbearbrown/the-reallocation-engine`, cloned at commit `015843d` (2026-09-23).
- `SNICKERDOODLE.md` (constitution: gates, provenance, lifecycle, attestation format), `DOMAIN.md` (known gaps 3 and 9), `CONTRIBUTING.md` (namespaces, engine API, BROKEN-* mutants), `DATA_CONTRACT.md` §Zero-Conditions, `recipes/_shared.md` (run-log template), `recipes/scan.md` and `recipes/local-wage-adjustment.md` + `.card.md` (style models).
- Book chapters used: 7 (sponsorship tiers; Unknown ≠ Avoid), 8 (liveness), 10 (timeline factor and its three cases), 11 (scorer).

## Code reused (imported or run, never copied)

- `scripts/score/role-scorer.mjs`: the Ch.11 scorer, run unmodified as a child process.
- `scripts/ats/liveness-core.mjs`: `classifyLiveness`, imported.
- `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/pii-scan.mjs`: checks.

## Data (all shipped in the repo; nothing fetched by the prototype)

- 80 Days to Stay, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: SEC Form D + DOL/USCIS H-1B mapping, Humanitarians AI. sha256 `eccdee2a…`, which matches `SEC_DOL_H1b_data_mapped-audit.md`.
- SEC Form D processed samples, `data/sec/form-d/processed/sample/` (2025Q2–2026Q1).
- BLS OEWS May 2024 + O*NET, `data/bls/compact/soc_occupation_compact.csv`.
- Persona fields modeled on the four fictional personas in `search/examples/`. The new persona `neel-kapoor` is fictional.
- The 3-3-2 split is from Nik Bear Brown's essay *The 3-3-2 Split*. It's used only as a frame for the time allocation. None of its figures (ghost-job shares, referral rates, wage premium) are cited, so none needed tracing.
- Immigration facts (90-day OPT unemployment ceiling, 150 days on STEM OPT, E-Verify required for the STEM extension) are taken from the book's Ch.10 as written. **Not independently verified against 8 CFR 214.2(f) or SEVP guidance. Your DSO is the authority.**

## Tools

- Node 24.14 locally (CI uses Node 20); `node:test`; `js-yaml` (repo dependency); Playwright 1.62.1 (only for the engine's own `ats:liveness`, not the prototype).
- **Claude Code** (Anthropic), model **Claude Opus 5.5**, as the agent in my terminal session. Commits carry a `Co-Authored-By: Claude Opus 5.5` trailer.
- Collaborators: none.

## What the AI contributed vs. what I decided

| AI (Claude Code) | Me (Shubham) |
|---|---|
| Read the repo and extracted the facts that bite, including three it found by running commands (the scorer authorization trap, the absent `data/bls/local-wage/`, the missing CI harness scripts) | Chose the career situation (MS CS/SWE, F-1 OPT, 15-1252) over the AI's recommended data-science variant |
| Proposed the narrower "unemployed, 90-day ceiling binds" framing and the new-grad title rule | Chose my handle and the GitHub plan (I fork, push and open the PR myself) |
| Wrote all code, tests, fixtures, the persona, the recipe and card, and these documents | Review, re-run, and sign the attestation (pending; see WORKED-RUN) |
| Ran every command whose output is pasted; found and fixed three of its own defects | Present it in class |
| Authored the fictional inputs (fit, time-to-start, snapshots) and committed them before the first run | Accept or change the DRAFT status and the placeholder thresholds |

<!-- STUDENT: once you've reviewed and re-run, add a line here naming anything you changed, checked
     by hand, or rejected. Every row above must stay true. -->
