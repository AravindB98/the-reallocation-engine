# TEST-REPORT — msis-pm-network-targets

## Executive summary

This report records how the prototype was tested: the state of the toolchain before and
after, the real sample run, each named failure case, two deliberate attempts to break it,
which files changed, and what a person still has to judge.

**Findings so far:**
- All 10 offline tests pass.
- The sample run works on the shipped data.
- The first break attempt was caught, but by an accidental crash, not by the check
  written for it.
- The second break attempt exposed a defect in the repository's own scorer: when a
  posting's "is it still open?" value is missing, the scorer treats the posting as open
  and labels that made-up value as coming from a record. The prototype refuses to send
  such a posting to the scorer, but it cannot fix the scorer.
- Two baseline problems exist in the repository before any of my changes: a privacy-scan
  finding in a package file, and a CI job that calls files that don't exist.

All results below are from real runs on 2026-10-03, including a clean checkout of the
committed branch.

---

## 1. Toolchain baseline (working copy, before any of my files)

Saved raw output: `~/PEAI_Class/baseline-*.txt` (outside the repo).

| Check | Command | Result |
|---|---|---|
| Doctor | `npm run doctor` | `environment: ✓ runnable`; `✓ no private/PII paths are tracked`; 33 recipes, 318 TODOs declared = 318 in bodies |
| Verify | `npm run verify` | `conformance: 158 files … ✓ all conform`; `✓ manifest check passed (3 warnings)`: `W1 archive/`, `W2 private/`, `W2 data/ats/` |
| PII scan | `node scripts/pii-scan.mjs` | **exit 1**: one `[email]` finding in `package-lock.json` (an npm maintainer's public address in a deprecation notice). Present on the unmodified upstream file. |
| Scorer example | `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/AdityaHasija37/runs` | `✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)` |
| Liveness, live posting | `npm run ats:liveness -- "https://boards.greenhouse.io/figma/jobs/6201407004?gh_jid=6201407004"` | `✅ active` |
| Liveness, fake job ID | `npm run ats:liveness -- "https://boards.greenhouse.io/figma/jobs/9999999999?gh_jid=9999999999"` | `⚠️ uncertain … content present but no visible apply control found` (not `expired`) |

Baseline notes:
- The `W2` warnings are false positives. `git check-ignore -v` shows `/private/*` and
  `/data/ats/*` are ignored (`.gitignore` lines 37 and 40).
- The CI job `harness-regression` in `.github/workflows/contrib-gate.yml` calls four files
  that are not in the repository (`scripts/test/gate-behavior-harness.mjs`,
  `scripts/test/fuzz-invariants.mjs`, `scripts/gates/gate-behavior-harness.mjs`,
  `scripts/score/scorer-harness.mjs`), so that job is expected to fail on any PR.

## 2. Clean checkout of the branch (run by AdityaHasija37, 2026-10-03)

Fresh clone of the committed branch (commit `dedb123`) from the local repository into
`/tmp/clean-check` (no network pull), then `npm install`. Raw output saved in
`~/PEAI_Class/clean-*.txt`.

| Step | Command | Result |
|---|---|---|
| Clone | `git clone --branch contrib/2026fa-AdityaHasija37-msis-pm-network-targets ~/PEAI_Class/the-reallocation-engine /tmp/clean-check` | `done.` |
| Doctor, before | `npm run doctor` | `environment: ✓ runnable` · 33 recipes · `318 declared · 318 [TODO markers` |
| Verify, before | `npm run verify` | `✓ manifest check passed (3 warnings)` (same 3 as baseline) |
| One documented command | `node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --offline scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses --run-date 2026-10-03` | `✓ 11 companies evaluated (offline-fixture) → apply 4 · consider 0 · network 6 · human-check 0 · board-unknown 0 · skip 1 (skip 9%)` · `candidates from CSV: 90 · roles scored: 18`, identical to the working copy |
| Tests | `node --test …/network-targets.test.mjs` | `ok 1` … `ok 10`, `# pass 10 / # fail 0` |
| Conformance | `node scripts/conformance.mjs scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/ recipes/cases/2026fa/` | `conformance: 32 files (5 md · 24 json · 3 js)` · `✓ all conform` |
| PII scan, branch history | `node scripts/pii-scan.mjs --diff origin/main` | `pii-scan: clean ✓` |
| Doctor, after | `npm run doctor` | unchanged from before |
| Verify, after | `npm run verify` | unchanged from before |
| Changed files | `git diff --stat origin/main...HEAD` | `37 files changed, 11038 insertions(+)`, all under my three namespaces |
| Working tree after the run | `git status --short` | `M package-lock.json` (from `npm install`, not committed), `M …/out/role-scores.json`, `M …/out/role-scores.md` |

Why the two scorer outputs changed: the only difference is the scorer's own `generated`
date (`"2026-10-03"` → `"2026-10-04"`, and the Markdown title). `role-scorer.mjs` stamps
the current UTC date and does not take `--run-date`. Every decision, score and trace is
unchanged, and `run-log.json` and `report.md` (which use `--run-date`) did not change at
all. So the run is reproducible apart from that one timestamp.

Note: doctor does not count recipes under `recipes/cases/`, so it reports 33 recipes /
318 TODOs before and after; the recipe's `todos_open: 3` was checked by hand
(`grep -c "\[TODO"` = 3).

## 3. Sample run (working copy)

Command (the README's one documented command, with a fixed date):

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --offline scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses --run-date 2026-10-03
```

Output:

```
✓ 11 companies evaluated (offline-fixture) → apply 4 · consider 0 · network 6 · human-check 0 · board-unknown 0 · skip 1 (skip 9%)
  candidates from CSV: 90 · roles scored: 18
  wrote run-log.json + report.md + roles.json + role-scores.{json,md} → scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/out
```

- Data: the real 80 Days CSV (30,369 rows), Gate A boards cleared by AdityaHasija37
  (`fixtures/boards.sample.json`), board responses saved live on 2026-10-03
  (`fixtures/sample-responses/`, 10 boards, 0 fetch failures).
- Reproducibility: the offline replay's `run-log.json` is identical to the live run's,
  apart from `mode` and `inputs`.
- What looks wrong: (a) the company-level skip rate is 9%, because the selection step
  had already removed 30,279 rows; (b) all 18 scored postings are 0.525, because every
  confirmed company is Proven and fit is a constant, so the scorer does not rank.

## 4. Named failure cases exercised

`node --test scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.test.mjs`
→ `# pass 10 / # fail 0` (offline: fixture CSV, hand-made responses, real providers,
real scorer).

| Case | How it is exercised | Result |
|---|---|---|
| F1 company not in CSV | `Quillfeather Product Labs Inc` (fictional) in the test persona | `skip / not-in-dataset`; no values invented |
| F2 sponsorship fields empty | `10 PERCENT HAPPIER INC` (real row, empty approvals) | `skip / no-trace-in-data` ("no trace", not "does not sponsor") |
| F3 board fetch fails | `DISCORD INC` with a saved HTTP 404 | `board-unknown / fetch-failed: HTTP 404`; never `network` |
| F4 posting not live | Postings absent from the board listing are not scored; `ats:liveness` `uncertain` is treated as closed (baseline above) | Covered by design; **no automated test** of the optional `ats:liveness` spot check |
| F5 OPT end date missing / invalid / past / too short | unit test + end-to-end with `persona.past-opt.test.json` | `STOP [opt-end-past]`, exit 2, output folder empty |
| F6 title false positives | real CSV strings: Product Designer, Production Scientist, Product Marketing Manager, Senior Manager, Product Management… | all excluded with a reason |
| Missing gate value | `buildRole` without liveness / timeline | refused |
| Missing input files | nonexistent boards file | `STOP [missing-input]`, exit 2 |

## 5. Deliberate break attempts (run by AdityaHasija37)

Commands were written by the AI and dry-run on scratch copies first; AdityaHasija37 ran
them. "Expected" is the behaviour the recipe specifies; personal predictions were not
written down beforehand.

| Ran | Saw | Expected (per the recipe) |
|---|---|---|
| **Break 1:** planted a bug routing a failed board fetch to `network` (`sed` on the fetch-failed line of `network-targets.mjs`, confirmed with `git diff`); ran the tests | `not ok 8 - end-to-end offline run routes every company and labels every value`, `expected: 0 / actual: 1`, `# pass 9 / # fail 1`. The cause was a crash in the report writer (`TypeError: Cannot read properties of undefined (reading 'value') at renderReport`), not the route assertion. | The test suite fails. A failed fetch must be routed `board-unknown`, never `network` (recipe stop conditions; failure case F3). The end-to-end test asserts `DISCORD INC → board-unknown`. |
| **Break 1 undo:** `git restore` on the file; ran the tests | `# pass 10 / # fail 0` | All 10 tests pass on the committed code. |
| **Break 2a–c:** deleted `liveness` from a real Apply role (Datadog, "Product Manager II, AI & Data Security") and scored it with `node scripts/score/role-scorer.mjs /tmp/break2-roles.json --out-dir /tmp/break2` | `✓ scored 1 roles → Apply 1`; `Apply 0.525 [{"factor":"liveness","multiplier":1,"source":"record"},{"factor":"timeline","multiplier":1,"source":"your-input"}]` | A role with no liveness value must not be treated as live: a missing gate should close it or stop the run, and no value without a record behind it should be labeled `record` (SNICKERDOODLE P3). **Not met, by the repo's scorer.** |
| **Break 2d:** asked the prototype's `buildRole` to build the same role | `REFUSED: refusing to emit role for DATADOG INC: liveness gate value missing (the scorer would read it as open)` | The prototype refuses to emit a role with a missing gate value (recipe: phase gates, "Additional hard stop"). |

What the breaks showed:
1. Break 1 was caught, but by an incidental crash. The assertion written for this case was
   never reached, so if the report writer became tolerant of missing values, that
   assertion would be the only guard left. Follow-up: a test that checks routes before any
   rendering.
2. The scorer turns a missing gate into an open gate and labels it `record`. The recipe
   cannot change `scripts/score/role-scorer.mjs` (a maintained file), so it guards
   against the defect upstream and reports it.

## 6. Files changed

From the working copy: `git diff --stat main...HEAD` → `37 files changed, 11038
insertions(+)`, all under `scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/`,
`recipes/cases/2026fa/AdityaHasija37-msis-pm-network-targets.{md,card.md}`, and
`course/2026fa/submissions/AdityaHasija37/`. Confirmed from the clean checkout (§2).

## 7. What the gates require a human to judge

- **Gate A, board ownership.** Open the company's careers page. Confirm it links to or
  embeds the board, or that its listed job IDs or titles match the board's postings.
  Record who, when and how. An indirect match is weaker evidence than a direct link.
  Watch for name changes (Sendbird → Delight.ai, Payward → Kraken).
- **Gate B, liveness.** Automatic, except that an `uncertain` result from the optional
  spot check needs a person, and counts as closed until then.
- **Gate C, visa timeline.** Automatic, but the OPT end date and the 60-day hiring lag
  are the person's own inputs.
- **Gate D, release.** Read `out/report.md`, especially "What this cannot tell you",
  before any outreach or application. In particular, choose among Apply rows by your own
  judgment of fit: every scored posting in the sample has the same score.
