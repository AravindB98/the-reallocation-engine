# SOURCES — SmitPatel-31

## Executive summary

What this submission was built on, and who did what. The repository, its rules and its shipped data are Nik Bear
Brown's and contributors'. Most of the code and writing in this submission was produced by an AI coding agent
(Claude Code) in one session with me. I made the decisions listed below. I'm responsible for being able to
explain every part.

## Repository and governing documents

- *The Reallocation Engine*, `nikbearbrown/the-reallocation-engine`, forked as `SmitPatel-31/the-reallocation-engine` at `015843d` (2026-09-30).
- Read and followed: `SNICKERDOODLE.md` (lifecycle, TODO closure, attestation format), `DOMAIN.md` (layout, Known gaps 3 and 9), `CONTRIBUTING.md` (namespaces, "don't re-implement the scorer"), `DATA_CONTRACT.md §Zero-Conditions`, `recipes/README.md`, `recipes/_shared.md` (run-log format), and the model pair `recipes/local-wage-adjustment.md` + `.card.md`.
- Engine code used unmodified: `scripts/score/role-scorer.mjs` (run as a CLI), `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/pii-scan.mjs`.

## Data (shipped with the repo, unmodified)

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, from the 80 Days to Stay project (Humanitarians AI). Per `data/80-days-to-stay/README.md`, built from SEC Form D filers mapped to DOL LCA disclosure data and the USCIS H-1B Employer Data Hub.
- `data/bls/compact/soc_occupation_compact.csv`, BLS OEWS (2024) and O*NET extract, row 15-1252 Software Developers.
- `data/examples/ch11-roles.json`, used only as the shape and label convention for `roles.json`.
- The fictional persona and postings in `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/` are invented. Company names in the postings are real CSV row names, but the postings themselves are not real.

## Tools

- Claude Code (Anthropic, model Claude Opus 5.5), the AI coding agent, used throughout.
- Node.js v22.16.0 (`node:test`), Python 3.12.7 (stdlib `csv` for hand cross-checks), git, `gh` (fork only).

## Who did what

| Part | AI (Claude Code) | Me (Smit) |
|---|---|---|
| Career situation (degree, STEM, December graduation, January OPT start, target role and company type) | asked | **provided** |
| Recipe angle "entry-level titles at big sponsors + December-grad timeline" | proposed it from queries it ran on the CSV | **accepted** |
| Finding that Google/Amazon/Meta etc. are absent and why | ran the queries, read the dataset README | accepted |
| Keeping real dates private (gitignored) and using a fictional persona in commits | proposed | **accepted** |
| Prototype code, tests, fixtures, README | **wrote all of it** | reviewed the design as it was explained in chat |
| Tier → p values, 100-approval threshold, 14-day buffer, 45-day hiring lag | proposed values with one-line reasons and alternatives | **chose** to keep each proposed value over the alternative |
| Lifecycle status DRAFT rather than RUNNABLE-SAMPLE | explained the zero-TODO conflict, recommended DRAFT | **chose DRAFT** |
| Not committing or pushing yet | asked | **decided** |
| Gate decisions G2, G3, G4 in the run log | offered choices | **chose** (G2 sample-only, G3 confirm first, G4 accept as scored) |
| Gate decision G1 | **decided** (keep excluded as Unknown), because Smit delegated it | delegated |
| CHANGE-BRIEF, recipe, card, domain justification, worked run, TEST-REPORT, run log, FRICTIONAL, this file | **drafted** | to review and edit before submitting |
| Running tests, fresh-clone checks, mutation tests, hand cross-checks | **ran them** first (2026-09-30); mutation tests and PII diff scan are Claude-only | **re-ran** the tests, sample run, 3 break cases and the Pinterest CSV check (2026-10-01) |
| Toolchain fixes (PyYAML across two interpreters) | diagnosed | **ran the commands**; my `which python3` check changed the diagnosis |
| Résumé | I offered my résumé; the AI **declined to open it** (zero-condition risk; not needed) | — |

**Rejected or corrected along the way:** pandas for profiling (broken NumPy ABI → stdlib `csv`); suffix-stripping
company matching (would map "Meta" to `META CO`); tuning weights so Deloitte drops out (left as a reported finding).
The AI's first PyYAML diagnosis was wrong for the terminal I was using.

**Not yet done by me, and must be before submission:** rewrite CHANGE-BRIEF §5 in my own words. (Tests re-run by me on 2026-10-01: 13/13 pass, recorded in the attestation.)
