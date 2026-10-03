# swe-opt-clock — prototype

## Executive summary

**What this is.** A small program for a new-grad software engineer on F-1 OPT who is currently unemployed. It checks a list of jobs against public sponsorship records, each job's posting, and the student's 90-day unemployment clock. Then it hands the evidence to the engine's existing scorer for an Apply / Consider / Skip decision.

**Why read it.** It shows how to run the program with one command, what it reads, what it writes, and how to run its tests.

**What it decides.** Nothing on its own. It recommends, and it marks everything it couldn't verify as held for a person. A human signs off in a decision sheet the program leaves blank.

## Run (from the repo root)

```bash
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02
```

`--as-of` pins the run date so the worked run reproduces exactly. Leave it off to use today's local date. No network and no install beyond `npm install` (it uses `js-yaml` from the repo's dependencies). Node 20+.

Optional flags: `--persona <profile.yml>` (default `search/examples/neel-kapoor/profile.yml`), `--roles <roles.json>` (default `fixtures/sample-roles.json`), `--out-dir <dir>` (default `course/2026fa/submissions/bagwe-shubham1727/runs/<as-of>/`; any other path inside the repo is refused). `--scorer <file>` exists **only** so the break tests can substitute a `fixtures/BROKEN-*` scorer.

## Test (offline, fixtures + local repo data only)

```bash
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs
```

16 tests. They cover the clock math, the stop cases, the tier rules on `fixtures/test-sponsors.csv`, liveness on the snapshot fixtures, the SOC miss, the scorer-output check against two deliberately broken scorers, the namespace guard, and a static check that no source file imports a network module.

## What it reads

| Data | Path | Label in output |
|---|---|---|
| Sponsorship + funding | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` | record |
| Role-quality row | `data/bls/compact/soc_occupation_compact.csv` | record (report-only) |
| Liveness classifier | `scripts/ats/liveness-core.mjs` (imported) | applied to snapshots |
| Persona clock | `search/examples/neel-kapoor/profile.yml` (fictional) | your-input |
| Roles, fit, time-to-start, posting snapshots | `fixtures/sample-roles.json`, `fixtures/snapshots/` | your-input |
| Scorer | `scripts/score/role-scorer.mjs` (run unmodified as a child process) | its own trace |

## What it writes (all in the out-dir)

| File | For | |
|---|---|---|
| `roles.json` | the scorer | labeled input, only the roles that cleared G1–G3 |
| `role-scores.json` / `role-scores.md` | agent / person | written **by the existing scorer** |
| `run-log.json` | agent | gates per role, input sha256s, scorer command + exit, stop conditions, next actions |
| `report.md` | person | executive summary, clock, decisions + next action, verified-vs-inferred per job, what it can't tell you |
| `gate-decisions.md` | person | blank decision sheet; a job is cleared only when a named person fills it in |

## Exit codes

`0` ran · `2` bad invocation or input file (including an out-dir outside the namespace) · `3` stopped at G0, the persona clock (OPT end past, unemployment days used up, count undated or dated in the future, `needs_sponsorship` missing) · `4` halted at G4, the scorer's output doesn't conform · `5` scorer crashed.

Recipe: `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md` (agent) and `.card.md` (person).
