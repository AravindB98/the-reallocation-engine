# SOURCES

## Executive summary

This page credits everything my submission is built on (the repository, its governing documents, its data, and the tools I used) and says plainly what the AI assistant did versus what I decided, checked, changed, or rejected.

## Repository and governing documents

- `nikbearbrown/the-reallocation-engine`, forked as `yudanzhou/the-reallocation-engine`.
- `SNICKERDOODLE.md`, `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md` (§Zero-Conditions), `recipes/README.md`, `recipes/_shared.md`.
- Style references: `recipes/local-wage-adjustment.md`, `recipes/local-wage-adjustment.card.md`, `recipes/scan.md`.
- Nik Bear Brown, *The 3-3-2 Split: Why Your Job Search Is Probably Backwards* (the framing for the next-action table). I cite none of its statistics.

## Data

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: per `data/80-days-to-stay/README.md`, SEC startup list mapped to DOL LCA disclosure data and the USCIS H-1B Employer Data Hub.
- `data/sec/form-d/processed/sample/*.sample.json`: SEC Form D samples (first 50 companies per quarter).
- `data/examples/ch11-roles.json`: shape reference for `roles.json`.

## Code reused (not modified)

- `scripts/score/role-scorer.mjs` (the scorer my prototype calls).
- `scripts/ats/check-liveness.mjs` (named in the recipe; run by a human).
- `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/manifest-check.mjs`, `scripts/pii-scan.mjs`.

## Tools

- Python 3.14 (standard library only), Node 24, git, Windows 11.
- **Claude Code (Anthropic, model Claude Opus 5.5)**: AI assistant used as tutor and pair programmer.

## What the AI did vs. what I did

| Area | AI (Claude Code) | Me (yudanzhou) |
|---|---|---|
| Setup | Cloned, installed, diagnosed the `pyyaml` / `python3` and CRLF failures | Forked the repo, chose the folder, accepted the fixes |
| Direction | Counted funded vs. sponsoring companies in the CSV and proposed this recipe direction | Chose the direction, my preference for funded companies, and the four role families |
| CHANGE-BRIEF | Drafted the structure and §5–6 failure predictions from the data | Supplied my situation (degree, CIP, graduation, preferences) and wrote my own prediction (no H-1B record ≠ won't hire OPT students); approved committing it before building |
| Prototype + tests | Wrote `triage.py`, `test_triage.py`, `config.json`, fixtures | Self-rated fit values are placeholders I must confirm; I accepted the "hold out, don't guess" design |
| Reports | Drafted the recipe, card, TEST-REPORT, DOMAIN-JUSTIFICATION, WORKED-RUN, run log | Reviewed them; the time-saved estimate is mine to confirm |
| Rejected / changed | — | Corrected my own wording "no OPT record" to "no H-1B record" after the AI explained OPT needs no employer sponsorship |

I am responsible for being able to explain every gate, number, and line. See `FRICTIONAL.md` for the step-by-step record.
