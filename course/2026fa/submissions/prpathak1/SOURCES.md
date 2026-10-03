# SOURCES — network-eng-h1b (prpathak1)

## Executive summary

This file credits everything this submission builds on: the repository and its rules, the data files, the existing engine scripts, the essay that frames the job-search day, and the two AI tools used. It also states plainly what the AI did, and what the student decided, checked, changed, or rejected. Each claim points to an entry in FRICTIONAL.md.

## Repository and governing documents

- **The Reallocation Engine** — `nikbearbrown/the-reallocation-engine` (fork `prpathak1/the-reallocation-engine`), base `main` @ `015843d`.
- `SNICKERDOODLE.md` — the constitution. Principles P1–P9, the recipe lifecycle (which kept this recipe at DRAFT; FRICTIONAL F26), the attestation format.
- `DOMAIN.md` — layout, runnable commands, known gaps.
- `CONTRIBUTING.md` — namespaces, branch name, "do not re-implement the scorer", `BROKEN-*` fixtures.
- `DATA_CONTRACT.md` §Zero-Conditions — fictional `@example.com` personas only.
- `recipes/_shared.md` (run-log template), `recipes/scan.md` and `recipes/local-wage-adjustment.md` / `.card.md` (style models).
- `search/examples/` personas — profile shape only; my persona is my own fictional one.

## Data (all tracked in the repository; read only, never modified)

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — the 80 Days to Stay dataset (Humanitarians AI). Company-level H-1B approvals, denials, approval rate, sponsored titles. Five columns read; `phone`, `executive_officers`, `board_directors` never read into outputs.
- `data/sec/form-d/processed/sample/companies-sec-2025q2-d.sample.json`, `…2025q3…`, `…2025q4…`, `…2026q1…` — SEC Form D **samples** (200 entries).
- `data/bls/compact/soc_occupation_compact.csv` — BLS OEWS 2024 / O\*NET compact extract, row 15-1241.00.

## Engine code used (never copied)

- `scripts/score/role-scorer.mjs` — the Bayesian role scorer (book Ch. 11), run as a CLI (`npm run score`).
- `scripts/ats/liveness-core.mjs` → `classifyLiveness()` — used in the offline 404 test.
- `scripts/sec/entity-resolution.py` → `normalize_company_name()` — imported by `normalize_names.py`.
- `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/manifest-check.mjs`, `scripts/pii-scan.mjs` — checks.

## Ideas

- Nik Bear Brown, *The 3-3-2 Split: Why Your Job Search Is Probably Backwards* (essay, as described in the assignment): 3 hours networking, 3 building credibility, 2 researching and applying. No figure from the essay is cited as a record here.
- INFO 7375 assignment "The Reallocation Engine — Recipe Design Assignment" (Fall 2026).

## Tools

- Node v24.19.0 (`node:test`), Python 3.11.9 (+ PyYAML 6.0.3), Git for Windows (Git Bash, used through a `bash.cmd` shim), Windows 11 CMD.
- **Claude Code** (Anthropic, model `claude-opus-5-5`) — this session. It ran commands, read the repository, probed the scorer, drafted the brief, recipe, card, prototype, tests and these documents, and kept the friction log.
- **Claude chat** (Anthropic) — a separate session the student used to plan the prompts given to Claude Code, to draft the CHANGE-BRIEF §6 predictions, and to think through decisions. Its output reached this work only through the student.

## What AI contributed vs what the student decided, checked, changed, or rejected

| Area | AI (Claude Code unless noted) | Student (prpathak1) |
|---|---|---|
| Situation | — | chose F-1, pre-OPT, Network Engineer, SOC 15-1241, and the slug (F14 context; branch) |
| Data reality | found no SOC column, company-level counts only, 0 Form D matches (F14) | decided the crosswalk becomes a DATA SOURCE TODO; hid three personal columns (F14 decisions) |
| Engine behavior | read and probed `role-scorer.mjs`: no funding term, fail-open gates, "authorized" regex, no exports (F16) | decided the responses: funding as context, stop before scoring, G0 pre-check (F16 decisions) |
| Predictions §6 | Claude **chat** drafted candidates | **selected** which to keep and wrote them in (F19) |
| Sponsorship labels | probe showed supplied labels are kept, disproving the student's instruction and P3 (F20) | rejected reverting to the wrong wording; kept P3 as a recorded wrong prediction (F20) |
| Sponsorship mapping | flagged the missing Proven/Likely criterion (F20) | dropped the Proven tier: network match = Likely 0.6 (F20 r3) |
| Rules and dates | computed consequences (slack 271/272 days, 0.51 cap) | set the keyword rule, dates, lag, slack factors, OPT validity window (F19, F20) |
| Recipe, card, prototype, tests | drafted all code and text; 5 design choices beyond the brief (F22) | accepted the five choices; accepted the fit values (F24); approved every commit |
| Failures | diagnosed python3, WSL bash, the Node 24 test glob (F3, F13, F23); fixed break-attempt defects (F25) | made the PATH and PyYAML changes; approved the shims (F12, F15, F17) |
| Honesty calls | flagged the placeholder email (F1), the label claim (F20), the RUNNABLE-SAMPLE claim (F26) | chose DRAFT over RUNNABLE-SAMPLE (F26); asked for one real liveness check later (F22 cont.) |
| AI mistakes | corrupted shim via `printf` (F15); false CRLF claim (F21 → F22 cont.); run-log G1 miscount (F27) | — (caught by the AI's own re-checks and logged) |
| Estimates and reflection | proposed the time-saved estimate; drafted the Reflection | accepted the estimate label; the Reflection is marked for human review and editing |
