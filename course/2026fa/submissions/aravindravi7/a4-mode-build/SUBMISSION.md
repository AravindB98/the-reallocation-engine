# SUBMISSION — A4 Mode Build

## Executive summary

This cover sheet ties the A4 ZIP to the same branch and pull request as A2 (PR #23), where A4's commits follow A2's. The mode checks whether employers have sponsored or filed H-1B visas for product-manager titles. It now uses the Department of Labor's per-filing records and rule values I set myself, and it ran live on 2026-10-21 with my gate decisions.

- **Assignment:** The Reallocation Engine — Mode Build (A4)
- **Student:** Aravind Ravi · **GitHub:** aravindravi7
- **Situation:** International MS in Information Systems student on F-1 STEM OPT targeting PM / TPM / AI PM roles; H-1B sponsors first.
- **Mode file:** `recipes/cases/2026fa/aravindravi7-pm-sponsor-title-match.md` (+ `.card.md`), v0.2.0
- **Domain justification:** `course/2026fa/submissions/aravindravi7/a4-mode-build/domain-justification.md`
- **Worked run + attestation:** `course/2026fa/submissions/aravindravi7/a4-mode-build/worked-run.md`
- **RUN_LOG entry:** `course/2026fa/submissions/aravindravi7/a4-mode-build/RUN_LOG-entry.md` (also `logs/runs/2026fa-aravindravi7-3.md`)
- **Scripts and data:** `scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/` (triage, liveness-json, ingest_lca, tests, fixtures, DOL extract + index)
- **Lifecycle stage claimed:** RUNNABLE-LIVE (0 open TODOs; the 2026-10-21 live run had every gate decided by me; sample re-run and ingest audit read by me). Not VERIFIED. See the recipe's lifecycle claim.
- **PR:** https://github.com/nikbearbrown/the-reallocation-engine/pull/23 (A2 = 97f0a4a; A4 = the commit recorded in the copy of this file at the ZIP root)

## A4 brief → Fall 2026 repository mapping

| A4 brief (Summer 2026 text) | Used | Why |
|---|---|---|
| branch `mode/<name>-<domain>`, new PR | `contrib/2026fa-aravindravi7-pm-sponsor-title-match`, PR #23 | one open PR per student (CONTRIBUTING) |
| mode under `recipes/` | `recipes/cases/2026fa/` | Fall 2026 contribution namespace |
| `assignments/submissions/<name>/` | `course/2026fa/submissions/aravindravi7/a4-mode-build/` | that path doesn't exist; CI namespace allowlist |
| append to `logs/RUN_LOG.md` | `logs/runs/2026fa-aravindravi7-3.md` + `RUN_LOG-entry.md` | CI hard-fails student edits to RUN_LOG.md; the brief allows "or include it in your submission" |
