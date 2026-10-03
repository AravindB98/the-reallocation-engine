# TEST-REPORT — data-role-sponsor-match

Environment: Windows 11 Home, Node v24.14.0, Python 3.13.2, Git for Windows. All runs on 2026-10-03, executed by Claude Code in the student's session. Raw logs are in `evidence/`.

## 1. Toolchain baseline

### Before anything was fixed (first clone, Windows defaults)

`npm run doctor` on the first clone:

```text
ENVIRONMENT (required)
  ✓ node       v24.14.0
  ✗ python3    MISSING
...
RECIPES (33)
  with lifecycle frontmatter: 0   missing: 33
...
SUMMARY
  environment: ✗ a required tool or command target is missing
  recipes: 0/33 carry lifecycle frontmatter — 33 need it (gap toward DRAFT→VERIFIED discipline)
```

`npm run verify` failed on every `.py` file with `Python was not found; run without arguments to install from the Microsoft Store…`.

There were two local causes, and neither is a repo change:
1. On this machine `python3` resolves to the Microsoft Store stub. The fix is a `python3` / `python3.cmd` shim in `~/Documents/GitHub/.rae-shim/` (outside the repo) that points at the real Python 3.13, put first on `PATH`.
2. Git for Windows' `core.autocrlf=true` checked the files out with CRLF line endings. `doctor.mjs` and `conformance.mjs` test `startsWith('---\n')`, so no frontmatter was ever seen. The fix is `git config core.autocrlf false` plus a re-checkout. **Worth telling other Windows students.** The doctor's "0/33" was a line-ending artifact, not missing frontmatter.

### Before vs after this branch: fresh clone (`evidence/clean-checkout-2.txt`)

| Check | upstream `main` 015843d | this branch 027a519 |
|---|---|---|
| `npm run doctor` | `environment: ✓ runnable`, 33/33 frontmatter, exit 0 | identical, exit 0 |
| `npm run verify` | conformance 158 files ✓; manifest ✓ (3 warnings) | conformance 170 files ✓; manifest ✓ (same 3 warnings) |
| `node scripts/conformance.mjs <my paths>` | — | 26 files ✓ |
| `node scripts/pii-scan.mjs --diff main` | — | `pii-scan: clean ✓` |

The 3 manifest warnings (`archive/` not ignored; `private/` and `data/ats/` not gitignored) exist upstream. `data/ats/*` is in fact ignored by `.gitignore:40`, which the checker doesn't detect.

## 2. The real sample run

From the fresh clone of the branch (`evidence/clean-checkout-2.txt`):

```text
$ node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.mjs
✓ 7 roles → Apply 1 · Consider 2 · Skip 1 · Unresolved 3 (scored 4 via scripts/score/role-scorer.mjs)
  timeline gate open: runway 194d vs lag 60d → factor 1 [your-input]
  Apply      klaviyo-analytics-engineer (0.54) — composite 0.540 ≥ 0.3, gates healthy
  Consider   databricks-senior-ds (0.315) — above threshold (0.315) but one soft spot: sponsorship tier "Likely"
  Consider   toast-staff-ds (0.285) — composite 0.285 in the Consider band [0.2, 0.3)
  Skip       klaviyo-dead-job-CONSTRUCTED (0) — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes)
  Unresolved draftkings-data-engineer — no-sponsorship-record, liveness-unchecked
  Unresolved absci-data-scientist — ambiguous-company-match, liveness-unchecked
  Unresolved northwind-data-analyst-CONSTRUCTED — no-company-match, liveness-unchecked
  wrote course/2026fa/submissions/kommurisi/runs/latest/data-role-sponsor-match.log.json + course/2026fa/submissions/kommurisi/runs/latest/data-role-sponsor-match.report.md
[exit 0]

$ node --test scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.test.mjs
ℹ tests 12
ℹ pass 12
ℹ fail 0
[exit 0]
```

After the run, `git status --short` in the clean clone was **empty**. The regenerated outputs are byte-identical to the committed ones, and `git diff --stat -- data/examples` was empty.

## 3. Each named failure case, exercised

| Failure case | How exercised | Result | Evidence |
|---|---|---|---|
| Company not in CSV | worked run (Northwind, CONSTRUCTED); break B3 (typo "Klavyio"); test fixture | `no-company-match`, Unresolved, no fuzzy guess | `break-attempts.txt` B3; test "end-to-end" |
| Company in CSV twice | worked run (real ABSCI CORP / ABSCI LLC); fixture TWIN CORP / TWIN LLC | `ambiguous-company-match` with candidates listed; `csv_company_name` tie-break resolves it | worked-run report; test "end-to-end" |
| Blank sponsorship columns | worked run (DraftKings, real) | `no-sponsorship-record`, Unresolved (not p = 0) | report; mutant M3 |
| Posting 404s | worked run (Klaviyo job id 1000000001, CONSTRUCTED): page check "active", Greenhouse API 404 | liveness 0 → scorer Skip (gated), conflict flagged | `fixtures/worked-run/*`; test "liveness never defaults open" |
| Liveness not observed | break B4 (evidence files missing) | all roles `liveness-unchecked`, scorer not run | B4; mutant M1 |
| OPT date already past | break B1 | exit 3, `opt-window-closed`, no roles.json | B1; test "OPT already past" |
| Unemployment days exhausted / date missing | unit test | `unemployment-days-exhausted` / `timeline-input-missing` | test "timeline: fails clearly…" |
| SOC row missing / blank field | worked run (15-2051.00 has blank `cognitive_pivot_score`); fixture SOC 99-9999.99 | "missing in source row" / `no-soc-row`; never filled | report; test "end-to-end" |
| Write over tracked files | break B2 (`--out-dir data/examples`); clean-checkout layout | exit 2, refused | B2; test "out-dir guard…"; mutant M5 |
| Scorer misreads sponsorship need | guard in `match.mjs` (exit 4) | — **not exercised end to end**: triggering it needs a modified scorer, which this PR doesn't ship | `WORKED-RUN.md` attestation (scorer defect observed directly) |

Mutation testing (`evidence/mutation-tests.txt`): mutants M1–M5 each turn at least one test red, and the restored originals return to 12/12.

## 4. `git diff --stat` — only namespaced paths

```text
$ git diff --stat main...HEAD   (file list, from evidence/clean-checkout-2.txt)
course/2026fa/submissions/kommurisi/…                         (docs, evidence, runs)
logs/runs/2026fa-kommurisi-1.md
recipes/cases/2026fa/kommurisi-data-role-sponsor-match.card.md
recipes/cases/2026fa/kommurisi-data-role-sponsor-match.md
scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/…    (code, tests, fixtures)
```

`git diff --name-only main...HEAD | grep -vE '^(scripts/contrib/2026fa/kommurisi-|recipes/cases/2026fa/kommurisi-|logs/runs/2026fa-kommurisi-|course/2026fa/submissions/kommurisi/)'` prints nothing. No maintained file is patched, and `logs/RUN_LOG.md` is untouched.

## 5. What the gates require a human to judge

- **Timeline:** whether the OPT dates and the 60-day hiring lag are right for *this* person. The prototype only does the arithmetic.
- **Liveness:** open each Apply/Consider posting yourself. The API check covers Greenhouse only.
- **Sponsorship tier:** whether a "Proven" data title is the right level and recent enough, and whether a "Likely" company is worth a networking message.
- **Unresolved rows:** pick the right CSV entity, find the posting, or drop the role.
- **Adequacy (G6):** a named person reads the report's "cannot verify" list before any application goes out. **Not yet done.**

## 6. Known CI issues that are not caused by this branch

Checked against unmodified upstream `main` (015843d) in a fresh clone:
- `contrib-gate.yml` → `privacy` → "PII scan (working tree)" (`node scripts/pii-scan.mjs`) **exits 1 on upstream main**. It flags `package-lock.json`, which contains a third-party npm package author's email address, in a tracked file this branch does not touch. The branch-history scan (`--diff`) is clean.
- `contrib-gate.yml` → `harness-regression` calls `scripts/test/gate-behavior-harness.mjs`, `scripts/test/fuzz-invariants.mjs`, `scripts/gates/gate-behavior-harness.mjs` and `scripts/score/scorer-harness.mjs`. **These files do not exist** on upstream main (`node` exits 1, module not found). The two that do exist (`scripts/score/gate-behavior-harness.mjs`, `scripts/score/gate-harness.mjs`) exit 0.

So CI cannot be fully green for any student PR until a maintainer fixes these. They should be raised with the instructor, not patched from a contrib branch (`.github/` is a protected path).

## 7. Not tested

macOS/Linux; Node 20 (CI's version; local was 24); a live run on a real target list; non-Greenhouse ATS providers for the API cross-check; and the exit-4 scorer guard end to end.
