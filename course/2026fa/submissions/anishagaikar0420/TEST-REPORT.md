# TEST-REPORT — OPT-window countdown

## Executive summary

This file records how the tool was tested: the repository's own health checks before and after the change, the sample run, each named failure case, deliberate attempts to break it, and proof that only this student's folders were touched. All checks passed. The one privacy-scan finding on the full working tree is already present in the untouched upstream repository and is not from this work. Everything here was run by Claude (the AI assistant) in Anisha's session on 2026-09-30 on Linux, Node 22.22.2, Python 3.11.15; Anisha's laptop re-run goes in the last section.

## Toolchain baseline — before (clean clone of upstream main, commit 015843d, no changes)

```
$ npm run doctor   # BEFORE (clean clone, no changes)
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue

$ npm run verify   # BEFORE
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

(The 3 manifest warnings are pre-existing upstream. `npm install` could not complete in the sandbox — registry 403 on `wrap-ansi` — which does not affect doctor, verify, the scorer, or this prototype, none of which need npm packages.)

## Toolchain baseline — after (branch with this work)

```
$ npm run doctor   # AFTER
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue

$ npm run verify   # AFTER
conformance: 169 files (88 md · 36 py · 33 js · 8 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================
WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/
✓ manifest check passed (3 warnings)

$ node scripts/conformance.mjs scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/ recipes/cases/2026fa/
conformance: 11 files (3 md · 5 json · 3 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

Doctor still counts 33 recipes: it reads top-level `recipes/` only, so a case recipe under `recipes/cases/` does not change its count.

## Privacy scan

```
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <an npm package author's address; redacted here, because pasting it made this report itself fail the scan>
```

That finding is **pre-existing upstream**: the same command on the clean clone prints the identical line. It is an npm package author's address inside the tracked `package-lock.json`, which this branch does not modify. The scan CI runs against branch history:

```
$ node scripts/pii-scan.mjs --diff HEAD~1   # branch history vs. the upstream main commit this branch started from (015843d)
pii-scan: clean ✓
(exit 0)
```

Fixtures copied from the 80-Days CSV had their `phone`, `executive_officers` and `board_directors` columns blanked before commit.

## The sample run

```
$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
✓ OPT window 2027-06-01 → 2027-08-30 (run date 2026-09-30, 244 days until OPT start)
✓ evaluated 10 roles → Apply 3 · Consider 1 · Skip 4 · blocked 2
  scorer: ✓ scored 8 roles → Apply 3 · Consider 1 · Skip 4 (skip 50%)
  scorer: course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/role-scores.json  +  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/role-scores.md
  ⛔ pinterest-data-analyst-unchecked: blocked (liveness-unchecked)
  ⛔ northwind-bi-not-in-csv: blocked (company-not-found)
  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/opt-countdown-log.json  +  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/opt-countdown-report.md
(exit 0)
```

Re-running the same command produced byte-identical outputs (`git status` clean afterwards) — the run is deterministic for a fixed `as_of`.

## Each named failure case, exercised

| Failure case (from CHANGE-BRIEF) | Where exercised | Result |
|---|---|---|
| Company missing from the CSV | sample role `northwind-bi-not-in-csv`; fixture `company-missing` | `blocked: company-not-found`, not scored, next action = DOL lookup by hand |
| Two CSV rows, one name | fixture `ambiguous-company` (ACME DATA INC / ACME DATA LLC) | `blocked: ambiguous-company-match` |
| SOC code with no row | sample `sigma-analytics-analyst` (15-2059); fixture `soc-missing` | context shows `missing (no-occupation-row)`, no wage printed; role still scored |
| OPT date already past | `--as-of 2027-09-15` | exit 3, message below, nothing written |
| Posting that 404s / expired | sample `copart-product-analyst-ghost`; fixture `expired-from-log` (from a saved `ats:liveness` output shape) | scorer Skip, "gated: liveness" |
| Start before OPT start | sample `remitly-analytics-asap`; fixture `starts-asap` | timeline 0 → Skip; next action = network |
| Start after deadline | sample `site-tech-ba-october`; fixture `starts-after-deadline` | timeline 0 → Skip |
| Liveness missing / stale / uncertain / undated | sample `pinterest-…-unchecked`; fixtures `liveness-stale`, `uncertain-from-log`, `break-record-without-date` | each blocked with its own reason code |
| Fit missing | fixture `fit-missing` | `blocked: fit-missing` |

```
$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs --as-of 2027-09-15 --out-dir /tmp/should-not-exist
✗ G0 OPT window already closed: run date 2027-09-15 is after the 90-day unemployment deadline 2027-08-30. This recipe cannot help; talk to your DSO today.
(exit 3)
$ ls /tmp/should-not-exist
ls: cannot access '/tmp/should-not-exist': No such file or directory

$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs --out-dir data/examples
✗ refusing to write into a maintained repo folder: data/examples
(exit 2)
```

## Offline tests

```
$ node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs
ok 1 - parseCsv keeps commas inside quoted fields
ok 2 - G0: window is OPT start + 90 days
ok 3 - G0: a closed window throws a GateError instead of returning a value
ok 4 - G3: timeline factor — open, soft, closed-early, closed-late
ok 5 - G1: name normalization is exact after suffix stripping, never fuzzy
ok 6 - sponsorship tier comes from record counts via the stated rule
ok 7 - liveness log parser reads real ats:liveness stdout shape
ok 8 - end to end: named failure cases block, gates zero, real scorer runs
ok 9 - G0 end to end: a closed OPT window exits 3 and writes nothing
ok 10 - refuses to write into a maintained repo folder
ok 11 - no network code in the prototype
# tests 11
# pass 11
# fail 0
```

The end-to-end test runs the **repo's** scorer (`scripts/score/role-scorer.mjs`) as a child process; there is no copy of the scorer in this folder.

### Do the tests catch a broken rule? (mutation check)

Two deliberate mutations of `lib.mjs`, each reverted afterwards:

```
# mutation 1: a start date past the deadline returns factor 1 instead of 0
not ok 4 - G3: timeline factor — open, soft, closed-early, closed-late
not ok 8 - end to end: named failure cases block, gates zero, real scorer runs
# pass 9
# fail 2

# mutation 2: a company that is not in the CSV is reported as found
not ok 5 - G1: name normalization is exact after suffix stripping, never fuzzy
not ok 8 - end to end: named failure cases block, gates zero, real scorer runs
# pass 9
# fail 2

# restored
# pass 11
# fail 0
```

## Scope — only namespaced paths changed

```
$ git diff --stat 015843d..HEAD
 .../submissions/anishagaikar0420/CHANGE-BRIEF.md   |   92 ++
 .../anishagaikar0420/DOMAIN-JUSTIFICATION.md       |   38 +
 .../submissions/anishagaikar0420/FRICTIONAL.md     |   76 ++
 .../2026fa/submissions/anishagaikar0420/SOURCES.md |   36 +
 .../submissions/anishagaikar0420/SUBMISSION.md     |   17 +
 .../submissions/anishagaikar0420/TEST-REPORT.md    |  196 +++
 .../submissions/anishagaikar0420/WORKED-RUN.md     |  146 +++
 .../runs/2026-09-30/opt-countdown-log.json         | 1379 ++++++++++++++++++++
 .../runs/2026-09-30/opt-countdown-report.md        |  209 +++
 .../runs/2026-09-30/role-scores.json               |  367 ++++++
 .../runs/2026-09-30/role-scores.md                 |   18 +
 .../anishagaikar0420/runs/2026-09-30/roles.json    |  178 +++
 .../runs/baseline-ch11/role-scores.json            |  241 ++++
 .../runs/baseline-ch11/role-scores.md              |   15 +
 logs/runs/2026fa-anishagaikar0420-1.md             |   18 +
 ...aikar0420-msis-bi-analyst-opt-countdown.card.md |   70 +
 ...ishagaikar0420-msis-bi-analyst-opt-countdown.md |  179 +++
 .../README.md                                      |   68 +
 .../examples/profile.persona.json                  |   18 +
 .../examples/roles.persona.json                    |   53 +
 .../fixtures/ats-liveness-output.fixture.txt       |    9 +
 .../fixtures/companies.fixture.csv                 |    7 +
 .../fixtures/formd/fixture-q.sample.json           |    1 +
 .../fixtures/profile.fixture.json                  |   16 +
 .../fixtures/roles.fixture.json                    |   16 +
 .../fixtures/soc.fixture.csv                       |    2 +
 .../lib.mjs                                        |  248 ++++
 .../opt-countdown.mjs                              |  298 +++++
 .../opt-countdown.test.mjs                         |  148 +++
 29 files changed, 4159 insertions(+)
# (captured just before this block was pasted into TEST-REPORT.md, so this file's own line count differs by the length of the block)
```

No change to `package.json`, `logs/RUN_LOG.md`, `data/`, top-level `recipes/`, or any other student's folder.

## What the gates require a human to judge

- **G0** — that the program end date matches the I-20, the OPT start date matches what was (or will be) requested on the I-765, and that 90 days is the right allowance for her OPT type. The tool only does the arithmetic.
- **G1** — for every `company-not-found` / `ambiguous` row: look the employer up in DOL LCA disclosure data and decide whether it sponsors. For every *Proven* row: read the matched titles and decide whether they are really analyst roles (the keyword rule over-matches).
- **G2** — run `npm run ats:liveness` on the real URLs and, for `uncertain`, open the posting herself.
- **G3** — confirm the posting's start date with the recruiter before trusting a "soft" or "closed" result.
- **Final decision** — Apply/Consider/Skip is a recommendation. She can override it; the scorer accepts an `override` with a written reason.

## Re-test after v0.1.1 (analyst-title fix), 2026-10-02, sandbox

```
$ node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs
# tests 12
# pass 12
# fail 0

# mutation: drop the new "analyst"/"BI" condition in sponsorshipTier
not ok 7 - v0.1.1: an engineer or data-scientist title alone does not make a company Proven for analysts
# pass 11
# fail 1

# restored
# pass 12
# fail 0

$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
✓ evaluated 10 roles → Apply 1 · Consider 3 · Skip 4 · blocked 2
```

v0.1.1 writes to `runs/2026-09-30-v0.1.1/`; the v0.1.0 outputs in `runs/2026-09-30/` are kept as evidence. The Mac outputs below were produced with v0.1.0.

## Student's re-run on her Mac (2026-10-02)

Run by Anisha on macOS 26.2, Node v26.9.0, Python 3.14.7. Output copied from her terminal.

```
$ npm install
added 55 packages, and audited 56 packages in 3s

$ npm run doctor
ENVIRONMENT (required)
  ✓ node       v26.9.0
  ✓ python3    Python 3.14.7

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
  — libreoffice not found (PDF fallback)
  ✓ playwright installed
...
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked
...
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue

$ npm run verify
conformance: 169 files (88 md · 36 py · 33 js · 8 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)

$ node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs
✔ parseCsv keeps commas inside quoted fields (0.960334ms)
✔ G0: window is OPT start + 90 days (0.061834ms)
✔ G0: a closed window throws a GateError instead of returning a value (0.20375ms)
✔ G3: timeline factor — open, soft, closed-early, closed-late (0.178458ms)
✔ G1: name normalization is exact after suffix stripping, never fuzzy (0.636167ms)
✔ sponsorship tier comes from record counts via the stated rule (0.307833ms)
✔ liveness log parser reads real ats:liveness stdout shape (0.387333ms)
✔ end to end: named failure cases block, gates zero, real scorer runs (137.016959ms)
✔ G0 end to end: a closed OPT window exits 3 and writes nothing (48.466791ms)
✔ refuses to write into a maintained repo folder (47.182583ms)
✔ no network code in the prototype (0.223292ms)
ℹ tests 11
ℹ pass 11
ℹ fail 0

$ node scripts/conformance.mjs scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/
conformance: 9 files (1 md · 5 json · 3 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.

$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
✓ OPT window 2027-06-01 → 2027-08-30 (run date 2026-09-30, 244 days until OPT start)
✓ evaluated 10 roles → Apply 3 · Consider 1 · Skip 4 · blocked 2
  scorer: ✓ scored 8 roles → Apply 3 · Consider 1 · Skip 4 (skip 50%)
  scorer: course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/role-scores.json  +  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/role-scores.md
  ⛔ pinterest-data-analyst-unchecked: blocked (liveness-unchecked)
  ⛔ northwind-bi-not-in-csv: blocked (company-not-found)
  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/opt-countdown-log.json  +  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/opt-countdown-report.md
```

Same result as the sandbox run. `...` marks lines left out of the doctor output; they were all ✓.

**Environment problem on the Mac, fixed (2026-10-01):** the first `npm run verify` failed in the manifest check with `ModuleNotFoundError: No module named 'yaml'`. `python3 -m pip install --user pyyaml` was refused (`externally-managed-environment`). With `--break-system-packages` pip crashed reading the macOS 26.2 version (`ValueError: invalid literal for int() with base 10: ''`), and it crashed the same way with `--use-deprecated=legacy-certs`. `brew install pyyaml` found no package. Fixed by downloading the PyYAML 6.0.2 source with `curl` and copying its pure-Python `yaml` folder into `python3 -m site --user-site`. The project's own files passed `✓ all conform` before and after; only the manifest check needed PyYAML.

**Privacy scan on the Mac (2026-10-02):**

```
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <redacted: npm author address, already in upstream>
```

Same single finding as on the clean upstream clone; nothing in this student's folders is flagged.
