# TEST-REPORT — swe-opt-clock

## Executive summary

**What this is.** The record of running the finished prototype from a fresh copy of the branch, plus the repository's own health checks before and after the change.

**Why read it.** It shows the work runs on a fresh clone with one command, touches only this student's folders, leaks no personal data, and leaves the repository's checks exactly as healthy as it found them. It also says plainly which shared checks will fail on GitHub for reasons outside this submission.

**What it found.**
- On a fresh clone the tests passed 18 of 18.
- The sample run reproduced the committed result exactly: only a timestamp changed.
- The repository's checks were unchanged.
- The branch history is free of personal data, but only after one mistake of ours was caught and removed before pushing.
- Two of the repository's automated GitHub checks fail for every student. Those failures don't come from this submission.

## Environment

macOS (Darwin 27), Node v24.14.0 (CI: Node 20), Python 3.14.5, npm. Upstream base: `nikbearbrown/the-reallocation-engine` `main` @ `015843d` (2026-09-23). Branch `contrib/2026fa-bagwe-shubham1727-swe-opt-clock-15-1252`.

## 1. Toolchain baseline: before (fresh clone of upstream `015843d`, 2026-10-02)

`npm install` rewrote the tracked `package-lock.json` (−36 lines). It was reverted with `git checkout -- package-lock.json` before anything else, so it isn't in the diff.

```
$ npm run doctor        (last lines)
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

```
$ npm run verify
conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

## 2. After: fresh clone of the branch at `eaa2f7c` (`git clone --branch contrib/2026fa-bagwe-shubham1727-swe-opt-clock-15-1252`, `npm install`, lockfile reverted)

This is the second clean-checkout pass. The first (at `a24a34d`) caught the PII-quote mistake in §6, and an independent review then led to `6324c8b` and `eaa2f7c`. Everything below was re-run after those.

```
$ npm run doctor        (last lines)
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
exit=0
```

The doctor output is identical, because doctor only counts top-level `recipes/*.md`, and this recipe lives in `recipes/cases/2026fa/`. Its own `todos_open: 4` equals its 4 body markers, checked with `grep -o "\[TODO" … | wc -l`.

```
$ npm run verify
conformance: 179 files (88 md · 36 py · 35 js · 16 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit=0

$ node scripts/conformance.mjs scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/
conformance: 19 files (1 md · 5 js · 13 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
exit=0
```

158 → 179 conformant files: the 21 new files under `recipes/` and `scripts/`. The same 3 manifest warnings as before (pre-existing; the `.gitignore` does block `/private/*` and `/data/ats/*`, and the checker doesn't parse that pattern form).

## 3. The sample run and the tests (same fresh clone)

```
$ node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs
✔ clock: unemployment ceiling binds before OPT end (Neel on 2026-10-02) (3.22025ms)
✔ clock: a count entered earlier is projected forward; the deadline does not drift later (0.455083ms)
✔ clock: stops instead of guessing (named failure cases) (1.547792ms)
✔ timeline factor: 1 inside buffer, linear in buffer, 0 after hard deadline (0.3395ms)
✔ entity + tier rules (0.997209ms)
✔ sponsor index never carries phone or officer columns (0.22725ms)
✔ title parsing handles the CSV's list repr and apostrophes (0.384792ms)
✔ liveness: 404 closes the gate, apply button opens it, uncertain and stale are held (0.893542ms)
✔ role quality: a 2010 SOC code has no row and no number is invented (17.474667ms)
✔ G4 catches the authorization trap and a gate the scorer ignored (0.225541ms)
✔ e2e: sample run uses the real scorer, labels every term, holds what it cannot verify (310.573292ms)
✔ e2e: AI-written inputs reach the scorer labeled model-judgment, never your-input (289.632208ms)
✔ e2e: an out-dir outside the repo leaks no local path into any output (298.448541ms)
✔ e2e: OPT end already past → stop with exit 3, no decisions written (47.628792ms)
✔ break: an additive-gates scorer is caught at G4 (exit 4, no report) (277.06475ms)
✔ break: a scorer that flips needs-sponsorship is caught at G4 (307.941708ms)
✔ refuses to write outside its namespace (36.042667ms)
✔ no prototype source imports a network module (0.561625ms)
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1645.914083
exit=0
```

The run is reproducible from a fresh clone: the only byte that changes is `generated_at`. `role-scores.md` is stamped by the scorer with its own UTC generation date (`2026-10-03`), not the pinned `--as-of`, so it isn't a mismatch.

## 4. Each failure case exercised

Full output is pasted in `WORKED-RUN.md` §4–5. The run logs are committed under `runs/`.

| Named case (CHANGE-BRIEF §4) | How exercised | Result | Exit |
|---|---|---|---|
| Company not in CSV | HubSpot in the sample | held `unresolved-company`; not in `roles.json`; Drop because timeline is closed | 0 |
| SOC with no row | Tulip with `15-1132` | `missing: no-soc-row`, no wage printed; still scored | 0 |
| Posting 404s | Lendbuzz snapshot `status: 404` | `http_gone`, liveness 0 → Skip | 0 |
| OPT date already past | persona `opt_end_date: 2026-09-01` | `STOP at G0 … opt-end-past`; log only | 3 |
| Unemployment days used up | persona 90/90 | `STOP at G0 … unemployment-ceiling-reached` | 3 |
| Stale / undated count | persona without `unemployment_days_as_of` | `STOP at G0 … unemployment-count-undated` | 3 |
| Empty sponsorship fields | CloudZero | held `unknown-sponsorship`; never sent as 0 | 0 |
| Uncertain posting / stale snapshot | Abacus / Nextuple | held for a person | 0 |
| Scorer ignores a gate | `BROKEN-additive-gates-scorer.mjs` | `HALT at G4`, no report | 4 |
| Scorer misreads sponsorship need | `BROKEN-sponsor-flag-scorer.mjs` | `HALT at G4`, no report | 4 |
| Writing over a tracked file | `--out-dir data/examples` | `refusing to write` | 2 |

## 5. Diff scope: only my namespaced paths

```
$ git diff --name-only origin/main...HEAD | grep -vE '^(scripts/contrib/2026fa/bagwe-shubham1727-|recipes/cases/2026fa/bagwe-shubham1727-|logs/runs/2026fa-bagwe-shubham1727-|course/2026fa/submissions/bagwe-shubham1727/|search/examples/neel-kapoor/)' || echo "ALL changed paths are in my namespaces"
ALL changed paths are in my namespaces
```

Full stat at `eaa2f7c` (the last commit before this report's own update; that commit changes only this file):

```
$ git diff --stat=100 origin/main...HEAD
 course/2026fa/submissions/bagwe-shubham1727/CHANGE-BRIEF.md     |  106 ++
 .../submissions/bagwe-shubham1727/DOMAIN-JUSTIFICATION.md       |   36 +
 course/2026fa/submissions/bagwe-shubham1727/FRICTIONAL.md       |   65 ++
 course/2026fa/submissions/bagwe-shubham1727/README.md           |   34 +
 course/2026fa/submissions/bagwe-shubham1727/SOURCES.md          |   50 +
 course/2026fa/submissions/bagwe-shubham1727/TEST-REPORT.md      |  259 +++++
 course/2026fa/submissions/bagwe-shubham1727/WORKED-RUN.md       |  287 ++++++
 .../runs/2026-10-02-break-additive/role-scores.json             |  230 +++++
 .../bagwe-shubham1727/runs/2026-10-02-break-additive/roles.json |  210 ++++
 .../runs/2026-10-02-break-additive/run-log.json                 | 1325 +++++++++++++++++++++++++
 .../runs/2026-10-02-break-sponsor-flag/role-scores.json         |  367 +++++++
 .../runs/2026-10-02-break-sponsor-flag/role-scores.md           |   18 +
 .../runs/2026-10-02-break-sponsor-flag/roles.json               |  210 ++++
 .../runs/2026-10-02-break-sponsor-flag/run-log.json             | 1323 +++++++++++++++++++++++++
 .../bagwe-shubham1727/runs/2026-10-02-fail-ceiling/run-log.json |   76 ++
 .../runs/2026-10-02-fail-opt-past/run-log.json                  |   76 ++
 .../bagwe-shubham1727/runs/2026-10-02-fail-undated/run-log.json |   76 ++
 .../bagwe-shubham1727/runs/2026-10-02/gate-decisions.md         |   27 +
 .../submissions/bagwe-shubham1727/runs/2026-10-02/report.md     |  223 +++++
 .../bagwe-shubham1727/runs/2026-10-02/role-scores.json          |  367 +++++++
 .../bagwe-shubham1727/runs/2026-10-02/role-scores.md            |   18 +
 .../submissions/bagwe-shubham1727/runs/2026-10-02/roles.json    |  210 ++++
 .../submissions/bagwe-shubham1727/runs/2026-10-02/run-log.json  | 1424 +++++++++++++++++++++++++++
 .../bagwe-shubham1727/runs/engine-baseline/role-scores.json     |  241 +++++
 .../bagwe-shubham1727/runs/engine-baseline/role-scores.md       |   15 +
 logs/runs/2026fa-bagwe-shubham1727-1.md                         |    7 +
 .../2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.card.md      |   77 ++
 recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md |  226 +++++
 .../2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/README.md    |   55 ++
 .../fixtures/BROKEN-additive-gates-scorer.mjs                   |   19 +
 .../fixtures/BROKEN-sponsor-flag-scorer.mjs                     |   19 +
 .../fixtures/sample-roles.json                                  |  198 ++++
 .../fixtures/snapshots/r01-cohere-health.json                   |   12 +
 .../fixtures/snapshots/r02-klaviyo.json                         |   12 +
 .../fixtures/snapshots/r03-lendbuzz.json                        |   10 +
 .../fixtures/snapshots/r04-abacus-insights.json                 |   10 +
 .../fixtures/snapshots/r05-nodar.json                           |   12 +
 .../fixtures/snapshots/r06-lookout.json                         |   12 +
 .../fixtures/snapshots/r07-zakipoint-health.json                |   12 +
 .../fixtures/snapshots/r08-vecna-robotics.json                  |   12 +
 .../fixtures/snapshots/r09-cloudzero.json                       |   12 +
 .../fixtures/snapshots/r10-hubspot.json                         |   12 +
 .../fixtures/snapshots/r11-tulip-interfaces.json                |   12 +
 .../fixtures/snapshots/r12-nextuple.json                        |   12 +
 .../fixtures/test-sponsors.csv                                  |    9 +
 .../2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/lib.mjs      |  284 ++++++
 .../2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs      |  360 +++++++
 .../test/swe-opt-clock.test.mjs                                 |  219 ++++
 search/examples/neel-kapoor/profile.yml                         |   39 +
 49 files changed, 8925 insertions(+)
```

**0 deletions**, no modified upstream file. Every path falls under `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/`, `recipes/cases/2026fa/`, `logs/runs/2026fa-bagwe-shubham1727-1.md`, `course/2026fa/submissions/bagwe-shubham1727/`, or `search/examples/neel-kapoor/` (a new fictional persona; `search/examples/` is in CI's allowlist). `logs/RUN_LOG.md`, `package.json`, and `package-lock.json` are untouched.

## 6. Personal data

```
$ node scripts/pii-scan.mjs --diff origin/main
pii-scan: clean ✓
```

- **Branch history: clean.** But on the first clean-checkout run this scan **failed**. FRICTIONAL.md quoted, literally, the address the scanner flags in upstream's lockfile. The commit hadn't been pushed, so it was amended to describe the address without quoting it. The history scan was then clean. Lesson: quoting a PII finding in a doc puts the PII in your history.
- **Working tree: 1 finding, pre-existing upstream.** An npm maintainer's address inside a deprecation notice in `package-lock.json`. It's identical on a clean checkout of `origin/main` @ `015843d`, and it isn't in this diff.
- The persona uses `@example.com` and a 555 number. The prototype drops the CSV's `phone`, `executive_officers` and `board_directors` columns at load (tested). Commits use the GitHub noreply address.

## 7. CI prediction, job by job (`.github/workflows/contrib-gate.yml`)

| Job | Prediction | Why |
|---|---|---|
| `conformance` | **pass** | `node scripts/conformance.mjs` + `manifest-check.mjs` pass on the fresh clone (§2) |
| `doctor-and-pii`, history scan | **pass** | `pii-scan --diff` clean (§6) |
| `doctor-and-pii`, working-tree scan | **fails for every PR** | the pre-existing upstream lockfile finding (§6); not fixable inside a student namespace |
| `harness-regression` | **fails for every PR** | 4 of its 6 scripts (`scripts/test/gate-behavior-harness.mjs`, `scripts/test/fuzz-invariants.mjs`, `scripts/gates/gate-behavior-harness.mjs`, `scripts/score/scorer-harness.mjs`) don't exist on upstream `main` @ `015843d`. The 2 that exist don't print the strings CI greps for (checked locally) |
| `contrib-scope` | **pass** | no protected path touched; every path in an allowlisted namespace (§5) |

Also: upstream fork-PR workflows currently show `action_required` (public Actions API, 2026-10-03), so CI won't start until a maintainer approves it.

## 8. What the gates require a human to judge

- **G0:** that the echoed dates match the real I-20 / EAD / DSO record. The machine checks only that they're internally consistent.
- **G1:** for an unresolved company, the legal entity name, or the decision that absence from Form D data makes the dataset useless for that company.
- **G2:** for an uncertain or stale posting, opening the link. The classifier can't tell a board's landing page from a closed posting (shown on a real Greenhouse URL in WORKED-RUN §1).
- **G3:** whether a 0 < factor < 1 job is worth the risk, and anything legal (DSO).
- **G5:** the decision itself. `gate-decisions.md` is written blank, and the recipe's G5 grep returns 0 lines until a person fills in decision + name + date. **It is unsigned as of this report.**
