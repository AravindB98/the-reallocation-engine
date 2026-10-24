# TEST-REPORT — ms-is-swe-opt-shortlist

## Summary

This report records what was run, what it printed, and what was not tested. It was produced in the working clone, **not yet from a clean checkout of the pushed branch**; that step is marked open below. Outputs are copied from real runs, not described.

## Toolchain baseline

Before any change (clone at upstream `015843d`, line endings fixed to LF — see note):

```text
$ npm run verify      (baseline-verify.txt)
✓ manifest check passed (3 warnings)
$ npm run doctor      (baseline-doctor.txt)
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
```

Note: the first baseline **failed** (6 × `E3 ... out of sync`). Cause: Windows `core.autocrlf=true` converted generated files to CRLF. Fixed with `git config core.autocrlf false` and a fresh checkout in this clone only; no tracked file was edited.

After the work (`after-verify.txt`, `after-doctor.txt`): `✓ manifest check passed (3 warnings)`; doctor still `environment: ✓ runnable`. The same 3 warnings (archive/, private/, data/ats/ not in `.gitignore`) appear before and after; they are not from this work.

`node scripts/pii-scan.mjs` (`pii-scan-output.txt`): 1 finding, `[email] package-lock.json — [npm package author address, redacted]`. That file is unmodified upstream content (an npm package author's address), not personal data of mine. **To confirm before the PR:** the same finding appears on a clean upstream checkout.

## Tests

```text
$ node --test scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.test.mjs
# tests 17
# pass 17
# fail 0
```

`node scripts/conformance.mjs scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/` → `conformance: 4 files (1 json · 1 md · 2 js)` / `✓ all conform`.

## Sample runs

Fixture run (fictional companies; liveness values are fixtures, not checks):

```text
✓ 4/7 scored · ✓ scored 4 roles → Apply 1 · Consider 1 · Skip 2 (skip 50%)
```

Real-data run (full CSV, 12 entries, 7 real postings checked with `npm run ats:liveness` on 2026-10-02 and 2026-10-03):

```text
✓ 3/12 scored · ✓ scored 3 roles → Apply 1 · Consider 1 · Skip 1 (skip 33%)
```

Not scored: Talent Vine and Boeing `excluded` (citizenship; TS/SCI clearance), Motion Recruitment `opt-bridge-open` (OPT-bridge track, no score), Intuit and Google `not-in-csv`, four `no-posting` networking targets. Full output: `runs/shortlist-report.md`; narrative and attestation: `WORKED-RUN.md`. No real *expired* posting was available, so the dead-posting path is covered by a fixture only.

## Failure cases exercised

| Case | Result | Where |
|---|---|---|
| Company absent from CSV | `not-in-csv`, no score | test + real run (`Google`) |
| Duplicate normalized name | `ambiguous`, candidates listed | test |
| Liveness uncertain / undated / missing | `liveness-unresolved`, never defaulted to live | tests |
| SOC with no row | exit 2, nothing written | test (CLI) |
| OPT window already past | factor 0, every scored role Skip (gated) | test (CLI) |
| Missing CSV column | stops, "schema drift" | test |
| Out-dir inside tracked repo path | refused | test + live break (`--out-dir data/examples`, exit 2, `data/` unchanged) |
| Human-excluded posting (citizenship required) | `excluded`, never scored | test + real run (Talent Vine) |
| Impossible calendar date (`2026-02-30`) | **was accepted; fixed**, now exit 2 | live break + regression assertions |
| Misspelled company (`VERKDA INC`) | `not-in-csv` | live break |

## Broke during testing, fixed

- **Found by a deliberate break attempt:** `--as-of 2026-02-30` was accepted (`Date.parse` rolls impossible days forward to March 2) and the run exited 0. Fixed in `parseDate` with a round-trip check; the earlier unit test had only used `2026-13-40`, which missed it.
- One test expectation was wrong (timeline slack arithmetic: expected factor 1 at 75 days remaining; correct value 0.667). The code was right; the test was corrected and a one-day-either-side boundary added.
- Default fit 0.7 would have put a company with no sponsorship record in the Consider band (0.30 × 0.7 = 0.21 ≥ 0.20). Default changed to 0.5.

## `git diff --stat` (namespaced paths only)

22 files, 1,666 insertions, all under `course/2026fa/submissions/Vrajesh-works/`, `recipes/cases/2026fa/`, `scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/`. **To refresh** after the last edits and before the PR.

## What the gate requires a human to judge

Whether each Apply/Consider posting is real and open (open it by hand); whether the "non-senior software title" wording plausibly means an entry-level hire at that company; whether the OPT dates and hiring lag typed in are the person's real ones. No human has cleared any gate; `human_gate.cleared` is `false` in every log.

## Not tested

Clean-checkout run of the pushed branch; any live liveness check; the scorer's behavior with `--profile`; Linux/macOS; Node 20 (tested on Node 22.15.1 only); CI on GitHub.
