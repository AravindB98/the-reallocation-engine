# SOURCES

## Executive summary

This page credits everything this submission is built on: the repository and its rules, the data files, an earlier related case, and the AI tool used. It also says what the AI contributed and what I decided myself.

## Repository and governing documents

- *The Reallocation Engine*, by Nik Bear Brown: `nikbearbrown/the-reallocation-engine`, forked at commit `015843d` as `arundhatik26/the-reallocation-engine`.
- `SNICKERDOODLE.md` (constitution: labels, gates, lifecycle, attestation format), `DOMAIN.md` (known gaps), `CONTRIBUTING.md` (namespaces, branch name, the scorer API rule), `DATA_CONTRACT.md` §Zero-Conditions (privacy), `recipes/README.md`, `recipes/_shared.md` (run-log template).
- Style models: `recipes/scan.md`, `recipes/local-wage-adjustment.md`, `recipes/local-wage-adjustment.card.md`.
- Related earlier case: `recipes/cases/2026su/case-fullstack-swe-sponsor-triage.md`, an anonymized Summer 2026 DRAFT on pre-OPT full-stack sponsor triage. It has 14 open TODOs and no script. This recipe narrows the idea to co-op conversion, adds software-title matching and two graduation scenarios, and makes it run.

## Code reused (called, not copied)

- `scripts/score/role-scorer.mjs`: the Chapter 11 scorer, run as a subprocess once per scenario.
- `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`): its saved output is parsed.
- `data/examples/ch11-roles.json`: the input shape, and the Proven = 0.9 / Likely = 0.6 values.

## Data

| File | What was used | Notes |
|---|---|---|
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | company rows: approvals, rate, top titles, funding date | 80 Days to Stay / Humanitarians AI; built from SEC Form D × DOL LCA / USCIS data. SHA-256 `eccdee2a…cfdae6270` |
| `data/bls/compact/soc_occupation_compact.csv` | SOC 15-1252 / 15-1254 median wage, OEWS 2024 | BLS OEWS + O*NET |
| Databricks Greenhouse posting `gh_jid=8732364002` | liveness only, 2026-10-02 | public posting; the job list was also read once from the public Greenhouse boards API to find the URL |

No figures from the 3-3-2 essay are cited as records. The 3-3-2 split is used only as the framing for where the tool's time savings go.

## Personas

- "Ananya Rao", `ananya.rao@example.com`: invented for this submission. The program and timeline are shaped like my situation, but contain no identifying details.
- Test fixture companies (Acme Software, SmallCo, NoSoft, BlankCo, Twin Name, Big Bank) are invented.

## Tools

- **Claude Code** (Anthropic, Claude Opus 5.5), desktop app, one session on 2026-10-02.
- Node v25.8.2, Python 3.9 (stdlib only), Playwright Chromium headless shell (installed for `ats:liveness`).

## What the AI contributed vs. what I decided

| | AI (Claude Code) | Me |
|---|---|---|
| Decided | — | the situation (co-op software / full-stack, F-1, MS IS, two graduation dates); dropping "fintech"; BNY Mellon as the main target; no commit or push until finished |
| Drafted | the prototype, tests, fixtures, recipe, card, justification, worked run, test report, this file's tables, the FRICTIONAL timeline | **[Student: list anything you rewrote]** |
| Found | the missing big banks, Visa blank, the SoFi duplicate, the Tamara Mellon trap, the scorer's unknown → Consider behavior, the liveness `uncertain` result, Workday not supported | — |
| Checked | conformance, verify, doctor, pii-scan, 17 tests, a fresh-clone run, a hand cross-check of CSV line 3036 | **[Student: what did you re-run or open yourself?]** |
| Left for me | CHANGE-BRIEF predictions, reflection, attestation signature, the tier-threshold decision, commit, push and PR | |
