---
owner: deepakkts
term: 2026fa
component: aiml-cognitive-floor
status: DRAFT
promoted_to: null
---

# AI/ML cognitive-floor mode: code

## Executive summary

This folder holds the code behind a job-search mode for international students
who are finishing a degree and targeting early-career AI, machine learning and
data roles. For each posting it checks whether the job is still open and
whether the work-start timeline holds. It then asks whether the occupation
behind the role sits above a chosen floor on a reasoning-and-judgment score
built from federal occupational data. Read this file to learn how to run the
code, what it reads and what it refuses to conclude. On the first real run, the
occupation most data-science postings map to had no ratings in the data, so
the mode held those postings instead of scoring them.

## Run record

The one command, run from the repository root:

    node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir assignments/submissions/deepakkts/run

The offline check, which needs no network:

    node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/test.mjs

Both use the Node standard library only. Neither needs `npm ci`.

## Files

| File | Purpose |
|---|---|
| `run.mjs` | Entry point. Writes `run-log.json` (agent log) and `report.md` (human report) into `--out-dir`. |
| `scenario.json` | The real scenario. Every input carries a `source` label: `record`, `model-judgment` or `your-input`. |
| `targets/portals.yml` | Discovery input for `npm run ats:scan -- --dry-run`, read through the `REALLOCATION_ENGINE_PORTALS` environment variable. |
| `test.mjs` | Offline harness. Disables `fetch`, runs the fixture end to end, checks lookups and gates, and runs the break attempt. |
| `fixtures/offline-scenario.json` | Fixture scenario for the fictional persona Priya Nair (priya.nair@example.com). One role per disposition. |
| `fixtures/offline-responses.json` | Recorded board-API responses for fictional jobs, used with `--offline`. |
| `fixtures/BROKEN-number-coercion.mjs` | Mutant that reads a blank rating as zero. |
| `fixtures/BROKEN-sibling-join.mjs` | Mutant that joins on the six-digit BLS code and takes a sibling occupation's score. |

## What it reads

| Input | Path or endpoint | Label |
|---|---|---|
| Occupation scores and rating fields | `data/bls/compact/soc_occupation_compact.csv` | record |
| Sponsorship history | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| Posting status | `https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>` and the board listing | record |
| Closed-posting text patterns | `scripts/ats/liveness-core.mjs` (imported) | record |
| SOC candidates, floor percentile, timeline months | `scenario.json` | model-judgment or your-input |

It never reads `private/` or `data/ats/`.

## Exit codes

- 0: run complete.
- 1: run complete, and at least one stop condition fired. Each is listed on stderr and in `run-log.json`.
- 2: usage, scenario or data-schema error. Nothing is written.

`--out-dir` is required. Inside the repository it must be under
`assignments/submissions/deepakkts/`.

## Dispositions

| Disposition | Meaning |
|---|---|
| `CLEARS_FLOOR` | Gates open; every candidate SOC scores at or above the cutoff. |
| `BELOW_FLOOR` | Gates open; every candidate SOC scores below the cutoff. |
| `SOC_SENSITIVE` | Gates open; the result depends on which SOC the employer files under. |
| `HOLD_MISSING_EVIDENCE` | A candidate SOC has no score, or only part of its rating fields. |
| `HOLD_LIVENESS_UNCERTAIN` | The job endpoint answers, but the board listing does not include the job. |
| `HOLD_TIMELINE_INPUT` | A timeline month was not supplied. |
| `SKIP_GATED_LIVENESS` | The posting is gone, says it is closed, or its deadline passed. |
| `SKIP_GATED_TIMELINE` | The month checks fail. |
| `STOP_LIVENESS_CHECK_FAILED` | The liveness check itself failed. No liveness value is assigned. |
| `STOP_SOC_INPUT` | A SOC code is absent from the table, is a bare BLS code, or its stored score disagrees with its fields. |

## Limits of this code

- It reads Greenhouse boards only.
- The timeline gate applies to the profile, because board postings carry no start date.
- The board API cannot distinguish an always-open "expression of interest" posting from a real opening.
- Sponsorship history is reported and never scored. Name matching strips legal suffixes only and never merges rows.
- The repository's composite scorer gives role quality a weight of 0.0, so this floor runs as a separate gate and does not feed that composite.
