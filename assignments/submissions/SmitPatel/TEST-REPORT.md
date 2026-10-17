# TEST-REPORT — SmitPatel-31

> **Historical record.** Written for the earlier Recipe Design assignment (2026-10-01). File paths below
> refer to the old layout (`recipes/cases/2026fa/`, `course/2026fa/submissions/SmitPatel-31/`). The
> real-postings run of 2026-10-17 is in WORKED-RUN.md.

## Executive summary

This report records how the prototype was tested. The repo's own checks passed before and after my changes. The
prototype ran on a **fresh clone** of my fork with only my files added. Its 13 offline tests passed, and every
named failure case failed the way it should (clear message, non-zero exit, nothing invented). No tracked repo file
changed except `package-lock.json`, which `npm install` rewrites on any fresh clone and which must not be
committed. Nothing has been committed or pushed yet, so CI has not run.

## 1. Toolchain baseline — before any changes

- Repo: fork `SmitPatel-31/the-reallocation-engine`, cloned 2026-09-30
- Commit tested: `015843d` (upstream `main` at clone time, no local changes)
- Machine: macOS (Darwin 25.6.0), Node v22.16.0, Python 3.12.7 (`/opt/anaconda3/bin/python3`)
- Setup: `npm install` finished cleanly (only npm audit advisories printed)

Full raw output is saved in [`baseline/baseline-doctor.txt`](baseline/baseline-doctor.txt) and [`baseline/baseline-verify.txt`](baseline/baseline-verify.txt).

### `npm run doctor` (summary lines)

```
ENVIRONMENT (required)
  ✓ node       v22.16.0
  ✓ python3    Python 3.12.7

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 2.12
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

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

### `npm run verify`

```
> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

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

### Baseline observations

1. **`npm run verify` has an undeclared dependency on PyYAML.** `scripts/manifest-check.mjs` runs
   `python3 -c "import yaml,json; ..."` against `.ai/manifest.yaml`. In a terminal whose `python3`
   lacked PyYAML, verify failed:

   ```
   ModuleNotFoundError: No module named 'yaml'

   ERROR (1):
     E1 .ai/manifest.yaml does not parse: Error: Command failed: python3 -c "import yaml,json;print(json.dumps(yaml.safe_load(open('.ai/manifest.yaml'))))"

   ✗ manifest check FAILED (1 error)
   ```

   In a terminal where `which python3` → `/opt/anaconda3/bin/python3` (PyYAML 6.0.1), the same
   command at the same commit passes (output above). A second interpreter on this machine,
   Homebrew `/opt/homebrew/bin/python3` (3.14), had no PyYAML; `pip install` fetched `pyyaml-6.0.3` for it.
   **Result depends on which `python3` is first on PATH.**
   Any later "verify passes" claim in this report was made in the Anaconda terminal.

2. **The two W2 warnings are false positives. I checked:**

   ```
   $ git check-ignore -v private/test.txt data/ats/test.json search/resume.json
   .gitignore:37:/private/*	private/test.txt
   .gitignore:40:/data/ats/*	data/ats/test.json
   .gitignore:50:resume.json	search/resume.json
   ```

   `.gitignore` ignores both paths using the patterns `/private/*` and `/data/ats/*`. The manifest checker
   apparently looks for the literal strings `private/` and `data/ats/` and doesn't match them. All three
   warnings were already in upstream before I made any change.

## 2. Toolchain — after changes (fresh clone)

Method: `git clone https://github.com/SmitPatel-31/the-reallocation-engine.git` into a scratch folder (HEAD
`015843d`), `git checkout -b contrib/2026fa-SmitPatel-31-newgrad-swe-bigsponsor`, then copy in **only**
`scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/` (without `out/`) and `recipes/cases/2026fa/SmitPatel-31-*`,
then `npm install`. `private/` in that clone held only the upstream `README.md`, so no private file could be used.

```
=== doctor
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
=== verify

✓ manifest check passed (3 warnings)
=== conformance (my paths)
$ node scripts/conformance.mjs scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/ recipes/cases/2026fa/
conformance: 9 files (3 md · 3 json · 3 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.
=== tests
$ node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs
ok 1 - CSV parser keeps quoted commas inside a field
ok 2 - G1: unmatched name → no-company-match, no value invented
ok 3 - G1: two rows with the same key → ambiguous, never picks one
ok 4 - G1: no suffix stripping — "Alpha Software" does not match "ALPHA SOFTWARE INC"
ok 5 - title classifier: entry / mid / senior / unlevelled / non-swe
ok 6 - sponsorship buckets come from the title evidence, not approval volume
ok 7 - G3 timeline: after deadline → 0; buffer → 0.5; inside → 1; missing date → labeled estimate
ok 8 - G2 liveness: unchecked is missing; a fixture check is your-input, not record
ok 9 - persona validation refuses missing / out-of-window dates
ok 10 - end-to-end on fixtures: both outputs written, every term labeled, gates behave
ok 11 - end-to-end on the shipped 80 Days CSV: real scorer, labeled terms, closed gates → Skip
ok 12 - G0: closed unemployment window halts with exit 3 and writes no roles
ok 13 - missing data file fails clearly with exit 2
# tests 13
# pass 13
# fail 0
```

Notes:
- `npm run doctor` still reports **33** recipes. It doesn't appear to scan `recipes/cases/2026fa/`, so the doctor
  line says nothing about my recipe. I ran conformance on my paths directly instead.
- `npm run verify` (default paths) doesn't cover `course/`, so the submission Markdown isn't conformance-checked by it.

### 2b. Clean checkout of the pushed branch (2026-10-02)

`git clone --branch contrib/2026fa-SmitPatel-31-newgrad-swe-bigsponsor https://github.com/SmitPatel-31/the-reallocation-engine.git`
→ HEAD `716b6ad`, then `npm install`, then `git checkout package-lock.json`. Run by Claude:

```
$ node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --today 2026-09-30 --out-dir /tmp/branch-check
✓ triage 2026-09-30: 12 postings → Apply 1 · Consider 4 · Skip 3 · Needs-human 4
  deadline to start work: 2027-04-11 [your-input]
[exit 0]
# tests 13
# pass 13
# fail 0
conformance: 172 files (90 md · 36 py · 33 js · 9 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (3 warnings)
```
The summary and every decision in `/tmp/branch-check/triage-log.json` are identical to the committed
`out/triage-log.json`. `git status` was clean afterwards.

## 3. Sample run and output

```
$ node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --today 2026-09-30
✓ triage 2026-09-30: 12 postings → Apply 1 · Consider 4 · Skip 3 · Needs-human 4
  deadline to start work: 2027-04-11 [your-input]
  scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out/triage-log.json  +  triage-report.md  (+ scorer's roles.json, role-scores.json, role-scores.md)
[exit 0]
```

Full report and tables: WORKED-RUN.md. Outputs: `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out/`.

## 4. Failure cases exercised

| Named case (CHANGE-BRIEF §4 / R1) | How exercised | Observed |
|---|---|---|
| 1 Company not in CSV | postings p08 "Google", p12 "Meta Platforms" | excluded `G1 company-match · no-company-match`; Meta did **not** match `META CO` |
| 2 OPT window already past | `--persona …/fixtures/persona-window-closed.json` | `✗ G0 window-closed: 0 unemployment days remain; deadline 2026-09-30 (OPT start 2026-01-12 + 90d − 90d used). No roles scored. Talk to your DSO.` exit 3; out dir not created |
| 3 Start after deadline | p03 Databricks 2027-07-12, p05 Uber 2027-06-21 | timeline 0 → scorer `Skip (0)`, next action network-dont-apply |
| 4 Liveness unchecked | p11 Snowflake | excluded `G2 liveness · liveness-unchecked`, not in `roles.json` |
| 5 Approvals but no titles | test fixture `EPSILON CO` (mini CSV) | `no-title-evidence` (test 6). **No shipped row with ≥ 100 approvals has empty titles** (checked: 0), so this only runs on the fixture |
| 6 Duplicate entity rows | p09 "Salesforce.com, Inc." | excluded `ambiguous-company-match (SALESFORCE COM INC, SALESFORCECOM INC)` |
| extra: missing CSV | `--csv data/80-days-to-stay/missing.csv` | `✗ sponsorship CSV not found: …` exit 2 |
| extra: bad date | `--today 2026-13-40` | `✗ --today must be yyyy-mm-dd (got 2026-13-40)` exit 2 |
| extra: expired posting | p10 Virtusa | liveness 0 → `Skip (0)` |

Mutation tests (edit the code to be wrong, confirm the tests fail): see WORKED-RUN.md → Attestation. All 4 mutants
caught. M1 was initially caught only by a unit test, so the end-to-end test was strengthened.

## 5. `git diff --stat`

From the fresh clone after `git add -A` (scratch clone only; my real branch has **no commits yet**):

```
 package-lock.json                                  |   36 -
 .../SmitPatel-31-newgrad-swe-bigsponsor.card.md    |   91 ++
 .../2026fa/SmitPatel-31-newgrad-swe-bigsponsor.md  |  277 +++++
 .../SmitPatel-31-newgrad-swe-bigsponsor/README.md  |   67 +
 .../fixtures/mini-80days.csv                       |    9 +
 .../fixtures/persona-dec-grad.json                 |   14 +
 .../fixtures/persona-window-closed.json            |   11 +
 .../fixtures/postings-sample.json                  |   29 +
 .../SmitPatel-31-newgrad-swe-bigsponsor/lib.mjs    |  186 +++
 .../out/role-scores.json                           |  367 ++++++
 .../out/role-scores.md                             |   18 +
 .../out/roles.json                                 |  194 +++
 .../out/triage-log.json                            | 1275 ++++++++++++++++++++
 .../out/triage-report.md                           |   70 ++
 .../SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs |  237 ++++
 .../triage.test.mjs                                |  159 +++
 16 files changed, 3004 insertions(+), 36 deletions(-)
```

**`package-lock.json` must not be committed.** `npm install` rewrites it on every fresh clone. Before committing:
`git checkout package-lock.json`. Every other path is inside `scripts/contrib/2026fa/SmitPatel-31-…/` or
`recipes/cases/2026fa/`; `course/2026fa/submissions/SmitPatel-31/` and `logs/runs/2026fa-SmitPatel-31-1.md` get
added at commit time. No other file is touched: `data/examples/role-scores.*` is unchanged, because the scorer
always got `--out-dir`.

PII:
```
$ node scripts/pii-scan.mjs                 # working tree
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions
  [email] package-lock.json — <npm author address, redacted here so this report does not trip the scanner>  # npm package author; identical line in upstream main (pre-existing)
$ node scripts/pii-scan.mjs --diff main      # what CI runs on a PR (scratch commit in the fresh clone)
pii-scan: clean ✓
```

## 6. What the gates require a human to judge

- **G1:** for Google and Meta, find another source or accept Unknown. For Salesforce, pick the right entity.
  The prototype can't tell whether two identical rows are one company.
- **G2:** every liveness value in the sample is a fixture (`your-input`). A human must run `npm run ats:liveness`
  on real URLs before any decision counts.
- **G3:** Microsoft's start date is **estimated** from a 45-day hiring-lag assumption; confirm with a recruiter.
  All deadline arithmetic depends on dates the person typed, and the OPT rules need confirming with the DSO.
- **G4:** read each company's raw title list. The keyword rule misread Virtusa's `JAVA ENGINEER 2`, and
  Pinterest's "Proven" rests on a single title string.
