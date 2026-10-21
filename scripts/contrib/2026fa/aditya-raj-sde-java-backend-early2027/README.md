---
owner: aditya-raj-sde
term: 2026fa
component: java-backend-early2027
status: sample          # offline on fixtures + committed real-posting excerpts; live collection is a separate, explicit step
promoted_to: null
---

# java-backend-early2027 — Experienced Java Backend Opening Triage (Early-2027 Start)

## Executive summary

This folder holds the code for a screening procedure that checks real job postings for an
experienced Java/Spring backend candidate with an early-2027 start date. It looks at experience
requirements, start dates, stack evidence, sponsorship wording in the posting itself, and whether
the posting is still listed. It builds on the Assignment 1 component next door by importing it,
not copying it. Everything runs offline except `collect.mjs`, `page-probe.mjs`, and the
maintained `npm run ats:liveness`.
Contract: `recipes/cases/2026fa/aditya-raj-sde-java-backend-early2027.md`.

## Files

| File | Role | Network |
|---|---|---|
| `collect.mjs` | sample collection per `SAMPLE-PROTOCOL.md`: employer order from the sponsorship CSV, board identity probe, capture via the maintained greenhouse-watch fetcher; raw responses go to `private/` | **yes** |
| `page-probe.mjs` | supplementary read-only browser probe (status, title, length) | **yes** |
| `text.mjs` | posting HTML → plain-text lines with headings | no |
| `checks.mjs` | rules v0.3: experience/degree/graduation, stack, start window, vacancy wording (Assignment 1 classifier + extensions) | no |
| `triage.mjs` | `run` (gates G1–G8 → `triage.json` + `triage.md`), `extract`, `compare`, `a1-input` | no |
| `triage.test.mjs` | 45 offline tests | no |
| `break-test.mjs` | applies each `fixtures/BROKEN-*.json` mutant in a temporary worktree under `private/a2-break/` and runs the suite and the real replay | no |
| `config/candidate.tariq-lindqvist.json` | fictional candidate; availability 2027-02-01 | — |
| `fixtures/synthetic-cases.json` (+ `build-synthetic.mjs`) | 29 invented failure cases | — |
| `fixtures/real-sample-expected-v0.3.json` | regression lock (audited by Claude, not human ground truth) | — |

## The one documented command (offline)

```bash
node scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.mjs run \
  --input course/2026fa/submissions/aditya-raj-sde/assignment-2/real-sample/observations.json \
  --candidate scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/config/candidate.tariq-lindqvist.json \
  --out-dir course/2026fa/submissions/aditya-raj-sde/assignment-2/runs/<name>
```

Tests: `node --test scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.test.mjs`.
`--out-dir` must be inside `course/2026fa/submissions/aditya-raj-sde/assignment-2/runs/`,
`private/a2/`, or the system temp directory.

## Reuse (imported, never copied)

- `../aditya-raj-sde-sponsor-live-jan2027/reality-check.mjs`: `companyKey`, `loadSponsorCsv`,
  `matchCompany`, `classifyVacancy`, `evaluateLiveness`, `ContractError`.
- `scripts/ats/liveness-core.mjs`, through `evaluateLiveness`.
- `scripts/ats/providers/_http.mjs` `fetchJson`.
- `.claude/skills/greenhouse-watch/scripts/greenhouse_watch.py`, as the capture subprocess.
- The maintained composite scorer is **not** called. See the recipe, "Why no score".
