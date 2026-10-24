# Test Report: gnanasudharsan-de-mlops-h1b

## 1. Toolchain Baseline (Before & After)
- **Before Run:** `npm run doctor` passed; `npm run verify` passed (with `.venv` PyYAML installed).
- **After Run:** `npm run doctor` passed; `npm run verify` passed cleanly.

## 2. Real Sample Run Output
- Evaluated 12 postings → Scored 6 (Apply: 2, Consider: 4, Skip: 0) · On hold: 6 · Not-apply rate: 50%.
- Output saved to `course/2026fa/submissions/gnanasudharsan/runs/2026-10-01/`.

## 3. Failure Cases Exercised
- **Mutation Test (Blank sponsorship rule):** Caught by offline tests (2 tests failed, successfully reverted).
- **Pre-OPT Status Trap Persona:** Correctly caught and halted by profile gate check.
- **Past Dates Persona:** Exited cleanly without writing a report.
- **Schema Drift (Renamed CSV column):** Failed safely with exit code 2.

## 4. Git Diff Stat
- Confined strictly to namespaced paths: `course/2026fa/submissions/gnanasudharsan/`, `recipes/cases/2026fa/`, and `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/`.

## 5. Clean-checkout verification (run by the AI agent, 2026-10-02)

These rows were executed by the AI agent (Claude Code), not by me. They are recorded here as
evidence of what the committed code does. My own re-run is the attestation in the worked run.

**Environment:** commit `506e7731b79bddf51c53bb700d28cec73e233ea8` (branch
`contrib/2026fa-gnanasudharsan-de-mlops-h1b`, pushed to `origin`) · Node v26.8.2 · Python 3.14.0 (repo `.venv`) · macOS 27.0 (arm64).

**Clean checkout:** `git worktree add --detach <tmp> 506e773`; the commands below ran inside it. The worktree was removed afterwards.

```
$ node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/
ℹ pass 14
ℹ fail 0

$ node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs --persona scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json --postings scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json --liveness scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt --today 2026-10-01
✓ 12 postings → scored 6 (Apply 2 · Consider 4 · Skip 0) · on hold 6 · not-apply rate 50%
  scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/roles.json  →  scripts/score/role-scorer.mjs
  course/2026fa/submissions/gnanasudharsan/runs/2026-10-01/de-mlops-h1b-log.json  +  course/2026fa/submissions/gnanasudharsan/runs/2026-10-01/de-mlops-h1b-report.md
exit=0
```

The summary, every scored role's recommendation and composite, and every hold reason were
compared with the committed `de-mlops-h1b-log.json`: **identical**. The only files that
changed were `role-scores.json` and `role-scores.md`, and only their `generated` date line
(2026-10-01 → 2026-10-02), because the scorer stamps the current date.

**Toolchain (main checkout, `.venv/bin` on PATH):**

```
$ npm run verify
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (3 warnings)

$ npm run doctor
  ✓ no private/PII paths are tracked
  environment: ✓ runnable

$ node scripts/pii-scan.mjs --diff main
pii-scan: clean ✓

$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions
  [email] package-lock.json — <npm package maintainer address, redacted here so this file does not itself trip the scan>
```

Notes:
- `verify` passes with 3 warnings, not "cleanly". They are `archive/`, `private/` and `data/ats/` being written as `/private/*` and `/data/ats/*` in `.gitignore`. `git status` shows no untracked, un-ignored file in either private folder.
- The working-tree PII finding is in `package-lock.json`, unchanged since commit `d08afdd`, before this branch. The branch-history scan, which CI runs, is clean.
- Without `.venv/bin` on PATH, `verify`'s manifest step fails with `ModuleNotFoundError: No module named 'yaml'`.

**Diff vs `main`** (`git diff --stat main...HEAD`). All 45 files are under `course/2026fa/submissions/gnanasudharsan/`, `logs/runs/`, `recipes/cases/2026fa/`, or `scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/`. This corrects §4, which omitted `logs/runs/`. No CI-protected file (`logs/RUN_LOG.md`, `package.json`, `.github/`) is touched.

```
 course/2026fa/submissions/gnanasudharsan/CHANGE-BRIEF.md        |  156 ++++
 course/2026fa/submissions/gnanasudharsan/FRICTIONAL.md          |   62 ++
 course/2026fa/submissions/gnanasudharsan/SOURCES.md             |   71 ++
 course/2026fa/submissions/gnanasudharsan/SUBMISSION.md          |   13 +
 course/2026fa/submissions/gnanasudharsan/TEST-REPORT.md         |   18 +
 .../gnanasudharsan/archive/CHANGE-BRIEF-ds-stemopt-15-2051.md   |   90 +++
 course/2026fa/submissions/gnanasudharsan/de-mlops-h1b-report.md |  198 +++++
 .../2026fa/submissions/gnanasudharsan/domain-justification.md   |   19 +
 .../gnanasudharsan/runs/2026-10-01/de-mlops-h1b-log.json        | 1086 +++++++++++++++++++++++++++
 .../gnanasudharsan/runs/2026-10-01/de-mlops-h1b-report.md       |   74 ++
 .../gnanasudharsan/runs/2026-10-01/prototype-stdout.txt         |    3 +
 .../submissions/gnanasudharsan/runs/2026-10-01/role-scores.json |  281 +++++++
 .../submissions/gnanasudharsan/runs/2026-10-01/role-scores.md   |   16 +
 .../submissions/gnanasudharsan/runs/baseline/ats-liveness.txt   |   11 +
 .../gnanasudharsan/runs/baseline/ats-scan-dry-run.txt           |   85 +++
 .../submissions/gnanasudharsan/runs/baseline/role-scores.json   |  241 ++++++
 .../submissions/gnanasudharsan/runs/baseline/role-scores.md     |   15 +
 .../2026fa/submissions/gnanasudharsan/runs/baseline/score.txt   |    6 +
 .../gnanasudharsan/runs/break/1-mutant-blank-as-zero.txt        |   21 +
 .../submissions/gnanasudharsan/runs/break/2-trap-persona.txt    |    4 +
 .../submissions/gnanasudharsan/runs/break/3-past-persona.txt    |    5 +
 .../submissions/gnanasudharsan/runs/break/4-schema-drift.txt    |    4 +
 .../submissions/gnanasudharsan/runs/break/5-hand-crosscheck.txt |   10 +
 course/2026fa/submissions/gnanasudharsan/runs/role-scores.json  |  281 +++++++
 course/2026fa/submissions/gnanasudharsan/runs/role-scores.md    |   16 +
 course/2026fa/submissions/gnanasudharsan/runs/score-task3.txt   |    6 +
 logs/runs/2026fa-gnanasudharsan-1.md                            |   15 +
 recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.card.md        |   73 ++
 recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md             |  172 +++++
 scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/README.md    |   56 ++
 .../contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs |  433 +++++++++++
 .../2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.test.mjs    |  129 ++++
 .../gnanasudharsan-de-mlops-h1b/fixtures/companies.sample.csv   |   14 +
 .../fixtures/formd/companies-sec-2025q2-d.fixture.json          |   49 ++
 .../fixtures/formd/companies-sec-2025q4-d.fixture.json          |   86 +++
 .../2026fa/gnanasudharsan-de-mlops-h1b/fixtures/liveness.txt    |   26 +
 .../gnanasudharsan-de-mlops-h1b/fixtures/persona-past.json      |   15 +
 .../gnanasudharsan-de-mlops-h1b/fixtures/persona-trap.json      |   15 +
 .../2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json    |   12 +
 .../2026fa/gnanasudharsan-de-mlops-h1b/fixtures/postings.json   |   19 +
 scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/profile.json |    4 +
 scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/roles.json   |  330 ++++++++
 .../gnanasudharsan-de-mlops-h1b/sample/liveness-batch.txt       |   30 +
 .../2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt      |  113 +++
 .../2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json     |  157 ++++
 45 files changed, 4540 insertions(+)
```

## 6. What the gates require a human to judge

| Gate | The machine checks | A human must judge |
|---|---|---|
| G0 profile | dates parse; EAD start within 60 days after program end; the scorer flags "needs sponsorship" | whether the dates and the 60-day rule are right for me (USCIS / international student office) |
| G1 liveness | the saved checker output says `active` | each `uncertain` posting (5 in the sample: Roblox ×3, Instacart, the fabricated id): open it and decide |
| G2 sponsorship | exactly one CSV row with non-blank approvals | the right legal entity for held companies (Upstart); whether "Likely" (Databricks, Robinhood) is too cautious |
| G3 timeline | start ≥ EAD start; registration windows counted | whether the employer can really defer the start to the EAD date ("flexible" is a placeholder) |
| Not gated | — | location (the Twilio Ireland role scored Apply), seniority (almost every opening was Senior), and the title keyword false positive |
