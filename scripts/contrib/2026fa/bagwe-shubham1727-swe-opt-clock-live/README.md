# swe-opt-clock-live — scripts

## Executive summary

**What this is.** The code behind a daily job-search routine for an unemployed new-grad software engineer on OPT. One script reads real public job boards and checks whether each posting is still open. A second script, which never touches the network, weighs each posting against sponsorship records and the student's visa clock.

**Why read it.** To run the routine, to test it, or to see which parts of the engine it reuses and which rules it adds.

**What it does and doesn't do.** It reuses the engine's board readers, its location filter, its posting checker and its scorer, all unchanged. On top of them it adds a handful of rules:
- a board must be tied to the right company by a named person;
- a posting must keep its own id after the page loads;
- a start date printed in a title can only push the start later;
- fit is asked for last;
- an Apply carried by sponsorship alone goes to networking;
- the scorer's composite must match its own printed arithmetic.

It doesn't decide anything legal, and it doesn't pretend to know hiring times.

## Run record

Recipe: `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md` (DRAFT) · card: same path, `.card.md`.

| File | Network? | Role |
|---|---|---|
| `capture.mjs` | **yes** (the only one) | Reads the boards in `fixtures/portals-boston-swe.yml` through `scripts/ats/providers/*.mjs`, using the same filters, order and dedup as `scripts/ats/scan.mjs`. Runs the real `scan.mjs --dry-run` on the same file and stores both posting lists. Opens each new-grad candidate with the engine's `checkUrlLiveness`. Writes `capture.json` (observations only) + `capture-audit.md`. |
| `evaluate.mjs` | no | Re-applies every rule to the raw titles, recomputes the scan comparison, runs gates G0–G4, and spawns `scripts/score/role-scorer.mjs` unmodified. Writes `run-log.json`, `report.md`, `gate-decisions.md`, and `fit-worksheet.md` + `fit-template.json` when needed. |
| `live-lib.mjs` | no | Pure rules: the title-filter mirror and board filter loop, the scan comparison, the new-grad title rule, cohort dates, the posting-id redirect rule, liveness from a capture, start lag with the hiring-time floor, sponsorship-only Apply, and the scorer-arithmetic check. |
| `cli.mjs` | no | Shared plumbing: argument parsing, repo-relative paths and redaction, hashing, the output-namespace guard, the latest G1a decision per board. |
| `../bagwe-shubham1727-swe-opt-clock-15-1252/lib.mjs` | no | Imported unchanged from the sample-mode recipe: clock, timeline factor, sponsor tiers, closed-gate check. |
| `fixtures/portals-boston-swe.yml` | — | 20 public boards (18 + 2 decoys) and the scan filters. |
| `fixtures/board-decisions.yml` | — | Gate G1a, append-only: proposals with evidence, then a named person's confirmed/rejected decisions. |
| `fixtures/time-to-start.json` | — | The 45-day default (an assumption, labeled). |
| `fixtures/persona-neel-whatif-day10.yml` | — | Fictional what-if clock (10 days used) for the contrast run. |
| `fixtures/test-*.json`, `test-board-decisions.yml`, `BROKEN-additive-gates-scorer.mjs` | — | Test-only fixtures and a deliberately wrong scorer. |

```bash
# from the repo root
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/test/live.test.mjs   # 21 tests, offline
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/capture.mjs                 # network: boards + Playwright
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/<date>/capture/capture.json [--persona <yml>] [--fit <json>]
```

**Requirements:**
- `npm install` (js-yaml, playwright).
- `npx playwright install chromium` once. `capture.mjs` exits 7 and writes nothing if the browser won't launch.
- Outputs are refused anywhere in the repo except `assignments/submissions/bagwe-shubham1727/`. Outside the repo is allowed, and paths there are logged by file name only.

**Exit codes:**
- capture: 0 ok · 2 bad input · 7 no browser
- evaluate: 0 ok · 2 bad input · 3 stopped (clock or out of scope; stale, undated or mismatched capture) · 4 G4 halt · 5 scorer crashed
