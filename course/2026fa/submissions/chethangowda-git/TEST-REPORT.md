# Test report: AI Engineer co-op to H-1B triage

## Executive summary

**What this is.** A record of every check run on this contribution, with the real output.

**Why read it.** It shows what was actually tested, what was only assumed, and what still needs a person's judgment.

**What it found.**
- The project's health checks give the same result before and after this work.
- The prototype runs, and its offline test passes 16 of 16 checks.
- Both predicted failure cases are stopped with a named reason instead of a guessed value.
- A deliberately broken copy of the tool fails the test, so the test can catch that kind of mistake.
- Gaps: the posting-liveness tool could not run in this environment, and no data exists to check co-op-to-full-time conversion.

## Run record

- Branch: `contrib/2026fa-chethangowda-git-ai-sde-coop-h1b`; base `main` @ `015843d`
- Machine: macOS (darwin), Node v25.8.1. CI uses Node 20, which was not tested locally.
- Date: 2026-10-03 local (the scorer stamps UTC, so its reports say 2026-10-04)

## 1. Doctor and verify, before and after

"Before" was run in a clean detached worktree of `main` @ `015843d`, sharing this clone's `node_modules`. "After" was run on this branch with all files present.

| Check | Before (clean main) | After (this branch) |
|---|---|---|
| `npm run doctor` | `environment: ✓ runnable` · `recipes: 33/33 carry lifecycle frontmatter — all tracked` · `open TODOs: 318 declared · 318 [TODO markers` · exit 0 | identical lines |
| `npm run verify` | `✓ manifest check passed (3 warnings)` · exit 0 | identical |

The doctor's last lines are identical before and after because **doctor reads only the top level of `recipes/`** (`scripts/doctor.mjs:92`, `fs.readdirSync('recipes')`). It does not see `recipes/cases/2026fa/`. This recipe's TODO count was checked by hand instead: `grep -c '\[TODO' recipes/cases/2026fa/chethangowda-git-ai-sde-coop-h1b.md` → `5`, which matches `todos_open: 5`.

There are three verify warnings, present before and after, and not caused by this work:
```
W1 ignore path not in .gitignore: archive/
W2 private path not gitignored (PII/secret risk): private/
W2 private path not gitignored (PII/secret risk): data/ats/
```

Doctor also prints `RUNNABLE-LIVE  # DRAFT | SPECIFIED | … 1`. It appears to read an inline comment on one recipe's `status:` line as part of the status. This is pre-existing, and I did not investigate it.

## 2. Baseline engine run

`npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/chethangowda-git/runs` (full output in `runs/ch11-baseline-terminal.txt`):
```
✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
exit=0
```

Other engine commands, as reported by the student (not re-run by the agent in this session):
- `npm run ats:scan -- --dry-run` worked.
- `npm run ats:liveness -- <url>` failed because the Playwright browser is missing.

## 3. Real sample run

From `runs/prototype-run-terminal.txt`:
```
$ node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/triage.mjs
✓ 7 candidates → 3 stopped before scorer · 4 scored × 2 scenarios
  STOP cohere-health-aie-ft: G2 gate-values-present — missing-gate-value: liveness
  STOP huggingface-mle: G1 company-in-record — no-sponsorship-record
  STOP lumenvale-aie-coop: G1 company-in-record — no-company-match
  [coop-path] ✓ scored 4 roles → Apply 2 · Consider 0 · Skip 2 (skip 50%)
  [no-coop-path] ✓ scored 4 roles → Apply 1 · Consider 0 · Skip 3 (skip 75%)
  scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/out/triage-log.json  +  scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/out/triage-report.md
exit=0
```

## 4. Failure cases exercised

| Case | How exercised | Result |
|---|---|---|
| 1. Company missing from CSV | sample: `Lumenvale Applied AI (fictional)`; fixture: `NOT IN CSV CO` | stopped `no-company-match`; not in scorer input |
| 1b. Company in CSV with blank counts (found while building) | sample: `HUGGING FACE INC` (line 12615); fixture: `FIXTURE BLANK CO` | stopped `no-sponsorship-record`; blank not read as 0 |
| 2. Missing gate value | sample: `cohere-health-aie-ft` (liveness null); fixture: `missing-liveness`, `missing-timeline` | stopped `missing-gate-value: liveness` / `timeline`; not in scorer input |
| Why case 2 matters | `fixtures/BROKEN-missing-gate-sent-to-scorer.json` fed straight to the unmodified scorer | scorer said `Apply ((0.9·0.35) × 1 × 1 = 0.315)`, so a missing gate is treated as open |

## 5. Offline test

From `runs/test-terminal.txt`:
```
$ node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/test.mjs
  ok   triage exits 0
failure case 1: company missing from the CSV
  ok   missing-company stopped as no-company-match
  ok   blank-record stopped as no-sponsorship-record (blank not read as 0)
failure case 2: missing gate value
  ok   missing-liveness stopped
  ok   missing-timeline stopped
stopped roles never reach the scorer
  ok   [coop-path] scorer input = only proven-coop, likely-ft
  ok   [no-coop-path] scorer input = only proven-coop, likely-ft
two timeline scenarios
  ok   co-op role: Apply on co-op path
  ok   co-op role: Skip on no-co-op path
  ok   Likely tier (p 0.6) → Consider
labels
  ok   sponsorship counts labeled record
  ok   tier → p labeled your-input
  ok   SOC labeled model-judgment
  ok   co-op conversion not verified
  ok   no phone/officer/board columns in log
BROKEN fixture: missing gates sent straight to the unmodified scorer
  ok   scorer treats missing gates as open (multipliers 1 × 1) — the hazard G2 guards
       scorer said: Apply ((0.9·0.35) × 1 × 1 = 0.315)

16/16 checks passed
exit=0
```

## 6. Deliberate breaks of the prototype (mutation test)

Each mutant was run in a scratch copy outside the repo, never committed.

- **Mutant A: liveness check replaced by `if (false)`.** Triage crashed (`TypeError: Cannot read properties of undefined (reading 'factor')`). The test reported `FAIL triage exits 0`. The first version of the test then crashed itself; it was fixed to stop cleanly (`0/1 checks passed (triage failed; remaining checks not run)`).
- **Mutant B: same, plus the crash "fixed" with `role.liveness?.factor`.** This is the realistic bad fix. Triage ran and sent the role to the scorer. Test result (`runs/mutant-test-terminal.txt`):
```
  FAIL missing-liveness stopped
  FAIL [coop-path] scorer input = only proven-coop, likely-ft — got ["likely-ft","missing-liveness","proven-coop"]
  FAIL [no-coop-path] scorer input = only proven-coop, likely-ft — got ["likely-ft","missing-liveness","proven-coop"]
13/16 checks passed
exit=1
```

## 7. Conformance, PII, diff

- `node scripts/conformance.mjs scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/ recipes/cases/2026fa/ course/2026fa/submissions/chethangowda-git/` → `✓ all conform`. Run before the final docs were written; the final run is pasted in the PR.
- `node scripts/pii-scan.mjs` (working tree) → 1 finding: an `[email]` in `package-lock.json` (an npm package author's address). It was already in `main` and is not from this work. It is deliberately not quoted here, because quoting it made this report a second finding.
- `node scripts/pii-scan.mjs --diff main` → `pii-scan: clean ✓`. Run before the final commit; re-run after it, with the result in the PR.
- `git diff --stat main...HEAD`: the final output is pasted in the PR. It should list only `course/2026fa/submissions/chethangowda-git/`, `scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/`, `recipes/cases/2026fa/` and `logs/runs/`.

## 8. What the gate requires a human to judge

- Whether each "Apply" posting is actually open. Liveness was typed in, not checked.
- Whether company-wide sponsorship counts are good enough for a co-op that must convert.
- Whether the tier → p mapping is reasonable. It is the author's input.
- Whether the co-op path is worth taking at all, given that conversion is unverified.

## Did not test

- Node 20 (CI's version). Only Node v25.8.1 was used locally.
- `npm run ats:liveness` (blocked: Playwright browser missing).
- Any real posting URL. All postings are hypothetical.
- Fuzzy or alias company names, e.g. "Databricks" vs `DATABRICKS INC`. By design these stop.
- The `ambiguous-match` branch. No fixture has duplicate exact names.
- The CSV-schema-drift stop (missing column).
- CI on GitHub. Its `harness-regression` job references 4 scripts that are missing on `main`, so it may fail regardless of this PR.
