# SOURCES

## Executive summary

This page credits everything this submission is built on: the repository and its rules, the data files, the external facts, and the tools, including the AI agent. It also says what the AI contributed and what is mine to decide and defend. No figure in the submission comes from an AI's general knowledge. Each number traces to one of the files or pages below.

## Repository and governing documents

- *The Reallocation Engine*, `nikbearbrown/the-reallocation-engine`, cloned at commit `015843d` (2026-10-01). MIT (code) / CC BY 4.0 (book).
- `SNICKERDOODLE.md` (constitution: P1–P9, lifecycle, TODO closure, attestation format), `DOMAIN.md` (Known gaps 3 and 9), `CONTRIBUTING.md` (namespaces, engine API rule), `DATA_CONTRACT.md` §Zero-Conditions, `recipes/README.md`, `recipes/_shared.md` (log template), `recipes/scan.md`, `recipes/local-wage-adjustment.md` and `.card.md` (style references), `recipes/cases/README.md`, `scripts/contrib/README.md`, `.github/workflows/contrib-gate.yml`.
- Maintained scripts used unchanged: `scripts/score/role-scorer.mjs` (Ch.11 composite, override rule), `scripts/ats/check-liveness.mjs` + `liveness-browser.mjs`, `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/pii-scan.mjs`.
- Example input shape: `data/examples/ch11-roles.json` (the source of the Proven 0.9 / Likely 0.6 / None 0.0 tier values).

## Data (all shipped with the repo; nothing downloaded into `data/`)

| Data | Path | Provenance as stated in the repo |
|---|---|---|
| 80 Days to Stay master CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | SEC startup list mapped to DOL LCA disclosure data and the USCIS H-1B Employer Data Hub (`data/80-days-to-stay/README.md`). Fiscal-year range not stated; that is an open question. |
| SEC Form D samples | `data/sec/form-d/processed/sample/companies-sec-{2025q2,2025q3,2025q4,2026q1}-d.sample.json` | samples only; full quarters gitignored (`DATA.md`) |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv`, row 15-1252 | OEWS 2024 national estimates |

## External sources

- **Job postings** (public, read 2026-10-01): Greenhouse job-board API (`boards-api.greenhouse.io/v1/boards/<board>/jobs[/<id>]`) and the posting pages for PathAI, Klaviyo, Cohere Health, Vestmark, Formlabs, Ginkgo Bioworks, Databento, and Lexington Medical. The Ginkgo no-sponsorship sentence and the Formlabs "4+ years" requirement are quoted from these.
- **OPT unemployment limit:** 8 CFR 214.2(f)(10)(ii)(E). The 90-day figure is used as a your-input constant. It should be checked against the current eCFR text; I did not fetch the regulation in this session.
- **The 3-3-2 split:** Nik Bear Brown, *The 3-3-2 Split: Why Your Job Search Is Probably Backwards* (assignment reading). No figure from the essay is cited as a record in this submission.

## Tools

- Node.js 22.16.0 locally (CI uses 20); npm; Python 3.14 (for hand cross-checks only); Playwright Chromium (for `ats:liveness`); `git`, `curl`, the GitHub CLI (read-only repository lookups).
- **Claude Code, an AI coding agent (model: Claude Opus 5.5, Anthropic)**, used in the session of 2026-10-01.

## What the AI contributed and what is mine

- **AI (Claude Code):**
  - Read the repo and the rules.
  - Proposed the recipe's framing from my stated situation.
  - Wrote all the prototype code, tests, and fixtures, and drafted the recipe, card, and every document in this folder.
  - Selected postings from public boards and transcribed posting fields.
  - Ran every command recorded here.
  - Found and fixed three defects in its own code.
  - Contributed **no** value labeled `model-judgment` to any output.
- **Mine:**
  - The career situation itself, and the decision to build for it.
  - The instruction to proceed step by step under the repo's rules and not to commit or push without my go-ahead.
  - Everything in `FRICTIONAL.md` §4 (to be completed).
  - The G1/G3/G4/G5 gate decisions in `logs/runs/2026fa-o7580-1.md` (pending).
  - The attestation signature (pending).
  - The lifecycle claim.
- Before submitting, I need to be able to explain every gate, every number in the worked run, and every line of `triage.mjs` and `lib.mjs`. The course AI policy treats misrepresenting what the agent did as an integrity matter, so this page and `FRICTIONAL.md` are written to be literal about it.

## Collaborators

None besides the AI agent named above.
