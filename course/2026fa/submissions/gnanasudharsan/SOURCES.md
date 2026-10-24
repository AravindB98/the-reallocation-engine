# SOURCES — de-mlops-h1b

## Executive summary

**What this is:** credits for everything this submission builds on: the repository and its
rules, the data files, the outside data source, the tools, and the AI assistant.

**Why read it:** it separates what came from others from what this submission added, and
what the AI did from what the student decided.

**What it says:** all data is from the course repository's shipped files plus a public job
board. All code ran locally. Most code and drafting was done by an AI coding agent, under
the student's direction and approval. Final judgment and sign-off belong to the student.

## Repository and governing documents

- *The Reallocation Engine* repository, Nik Bear Brown (`nikbearbrown/the-reallocation-engine`), forked as `Gnanasudharsan/the-reallocation-engine`.
- `SNICKERDOODLE.md` (constitution), `DOMAIN.md`, `AGENTS.md`, `CONTRIBUTING.md`, `scripts/contrib/README.md`, `recipes/cases/README.md`, `recipes/_shared.md` (run-log template).
- Style models: `recipes/local-wage-adjustment.md`, `recipes/local-wage-adjustment.card.md`.
- Course assignment: "The Reallocation Engine — Recipe Design Assignment", INFO 7375, Fall 2026.

## Code reused (unchanged)

- `scripts/score/role-scorer.mjs`: the Ch.11 combiner; spawned by the prototype, never copied.
- `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`): posting liveness.
- Company-name normalization rule ported from `normalize_company_name()` in `scripts/sec/sec-all-quarters.py` (suffix list and stripping rule), so CSV and Form D names join by the same rule.

## Data

| Source | Path | Notes |
|---|---|---|
| 80 Days to Stay company table (H-1B approvals/denials, top sponsored titles, funding) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | shipped with the repo; 13 rows copied into `fixtures/companies.sample.csv` (officer, director, phone columns dropped) |
| SEC Form D processed samples | `data/sec/form-d/processed/sample/*.sample.json` | 50 companies per quarter; 3 records copied into `fixtures/formd/` with related persons and addresses removed |
| BLS OEWS / O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | context only |
| Greenhouse public job boards | `https://boards-api.greenhouse.io/v1/boards/<board>/jobs` (databricks, twilio, instacart, roku, robinhood, roblox, upstart) | read-only GET, 2026-10-01; titles, URLs, locations of 11 public postings in `sample/postings.json` |
| Persona | `fixtures/persona*.json` | **fictional** (`@example.com`); no real dates or personal data |

No file from `private/`, `data/ats/`, or `search/resume.json` was read or committed.

## Tools

Node.js v26.8.2 (built-in `node:test`), Python 3.14 (data inspection only), git, Claude Code
desktop app.

## AI contribution

**AI:** Claude Code (model Claude Opus 5.5, Anthropic), used as a coding agent in this repository on 2026-10-01.

- **The AI did:** profiled the data; drafted CHANGE-BRIEF §1–§4; wrote the recipe, card, README, prototype, tests, and fixtures; fetched the public postings; ran liveness, the scorer, tests, conformance, and the PII scan; ran the break attempts; drafted this file, the worked run, the run log, and the AI-attributed entries in FRICTIONAL.md.
- **The student decided:** the career situation and scope (rejecting the earlier Data Scientist scope); the CHANGE-BRIEF §5 prediction (written by the student); approval of the implementation plan; the file paths and commands to use.
- **The AI also did (2026-10-02):** re-ran every check from a clean checkout of commit `506e773` (results in TEST-REPORT.md); corrected factual items in SUBMISSION.md, SOURCES.md, TEST-REPORT.md, and FRICTIONAL.md entries 2 and the header.
- **The student wrote:** the domain justification (`domain-justification.md`), the first version of TEST-REPORT.md and SUBMISSION.md, and the "Student Reflection" section of FRICTIONAL.md.
- **The AI also did (2026-10-03):** organized the FRICTIONAL reflection from the student's answers and runs; drafted the two "hardest to catch for" lines in the domain justification, approved by the student; wrote the attestation wording from the student's re-run results.
- **The student decided (2026-10-02/03):** accepted the tier values as provisional; kept the placeholder fit ratings and start dates, disclosed; accepted the file placement; re-ran four attestation rows and signed.
- **Still open:** the visa-timeline assumptions are unverified; the hand-check row was not re-confirmed by the student.
