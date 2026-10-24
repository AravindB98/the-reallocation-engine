# TEST-REPORT — network-eng-h1b prototype

## Executive summary

This report records how the Network Engineer sponsorship-triage prototype was tested, and what happened. A fresh copy of the work was taken from a single saved version and run from scratch. Every check passed:
- the repository's own health checks;
- the program itself;
- all 23 automatic tests;
- four deliberate attempts to break it.

The changes touch only the folders assigned to this student. Two engine baseline runs were also done separately: a job-board scan preview, in a throwaway copy so no private files were read, and the book's example scoring. Both ran cleanly (§9).

Getting the repository's own checks to pass on this Windows computer needed three small changes outside the repository, declared below.

The recipe stays at the earliest lifecycle stage (DRAFT): the sample run works, but 8 open to-do items must be closed before it can move up.

## Test record

| Item | Value |
|---|---|
| Tested commit | `1b5a58908d3aab92b2fa2f96458deb4795f1cef3` ("Final sample run + recipe 0.1.2 (DRAFT, sample run passing)") |
| Branch | `contrib/2026fa-prpathak1-network-eng-h1b-soc-15-1241` |
| Base | `main` @ `015843d` |
| How | Local repo cloned at that commit into a temp folder outside the working copy (`C:\Users\<user>\AppData\Local\Temp\…\clean-clone`). `npm install` there, then every command below run under `cmd.exe`. The clone was deleted afterwards. |
| When | 2026-10-03 01:24 (local, UTC−4) |
| Toolchain | Node v24.19.0 · `python3` → Python 3.11.9 (via shim, below) · Windows 11, native CMD |
| Lifecycle stage | **DRAFT — sample run complete and passing; 8 open TODOs block SPECIFIED** |
| Raw output | Kept outside the repo: `reallocation-notes/clean-clone-check-raw.txt`, `baseline-before.txt`, `baseline-after-path-fix.txt`, `break-attempts-before-fix.txt`, `final-run-and-breaks.txt` |

One edit to pasted output: npm's `glob` deprecation warning contains a maintainer's email address. It is replaced by `<email redacted>` so this file does not trip the repository's PII scan; nothing else is changed.

## 1. Toolchain baseline — before (fresh clone of `main`, 2026-10-02, before any change)

`npm run doctor` (excerpt, verbatim top of output; exit 0 despite the ✗):

```
RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.19.0
  ✗ python3    MISSING
```

`npm run verify` (verbatim):

```
> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)

✗ 36 file(s) FAILED conformance:
  • scripts\ats\analyze-patterns.py — operable program or batch file.
  • scripts\ats\detect-ats.py — operable program or batch file.
  • scripts\ats\fetch-real-postings.py — operable program or batch file.
  • scripts\ats\scrapers\common\config.py — operable program or batch file.
  • scripts\ats\scrapers\common\logger.py — operable program or batch file.
  • scripts\ats\scrapers\common\normalize.py — operable program or batch file.
  • scripts\ats\scrapers\common\rate_limiter.py — operable program or batch file.
  • scripts\ats\scrapers\common\retry.py — operable program or batch file.
  • scripts\ats\scrapers\common\schema_validator.py — operable program or batch file.
  • scripts\ats\scrapers\common\__init__.py — operable program or batch file.
  • scripts\ats\scrapers\greenhouse\scraper.py — operable program or batch file.
  • scripts\ats\scrapers\greenhouse\__init__.py — operable program or batch file.
  • scripts\ats\scrapers\lever\scraper.py — operable program or batch file.
  • scripts\ats\scrapers\lever\__init__.py — operable program or batch file.
  • scripts\ats\scrapers\workday\audit.py — operable program or batch file.
  • scripts\ats\scrapers\workday\scraper.py — operable program or batch file.
  • scripts\ats\scrapers\workday\test_scraper.py — operable program or batch file.
  • scripts\ats\scrapers\workday\__init__.py — operable program or batch file.
  • scripts\ats\scrapers\__init__.py — operable program or batch file.
  • scripts\audit-sec-dol-h1b-data.py — operable program or batch file.
  • scripts\bls\extract-soc-occupation-table.py — operable program or batch file.
  • scripts\bls\local-wage-adjustment.py — operable program or batch file.
  • scripts\cowork-agentic-repo.py — operable program or batch file.
  • scripts\sec\download-form-d-quarters.py — operable program or batch file.
  • scripts\sec\entity-resolution.py — operable program or batch file.
  • scripts\sec\refresh-recent-sec-quarters.py — operable program or batch file.
  • scripts\sec\sec-all-quarters.py — operable program or batch file.
  • scripts\sec\sec-combine-quarters.py — operable program or batch file.
  • scripts\sec\sec-domain-inference.py — operable program or batch file.
  • scripts\sec\sec-filter.py — operable program or batch file.
  • scripts\sec\sec-flatten.py — operable program or batch file.
  • scripts\sec\sec-form-d.py — operable program or batch file.
  • scripts\sec\sec-unique.py — operable program or batch file.
  • scripts\sec\validate-h1b-join-sample.py — operable program or batch file.
  • scripts\sec\webpage-processor-clean.py — operable program or batch file.
  • scripts\sec\webpage-processor-raw.py — operable program or batch file.
===== exit code: 1 =====
```

Cause:
- `scripts/conformance.mjs:67` and `scripts/doctor.mjs:27` call `python3`; Windows Python installs `python.exe` and `py`, not `python3`.
- After a `python3` shim, 4 `.sh` files failed with `/bin/bash: …: No such file or directory`: under cmd, `bash` resolved to the WSL launcher (`…\Microsoft\WindowsApps\bash.exe`).

## 2. Windows environment changes (outside the repository)

No tracked repository file was changed to make the checks pass.

| Change | Who | Why |
|---|---|---|
| `C:\info7375\bin\python3.cmd` = `@py -3.11 %*` | AI created; human approved | `conformance.mjs` / `doctor.mjs` call `python3` |
| `C:\info7375\bin\bash.cmd` = `@"C:\Program Files\Git\bin\bash.exe" %*` | AI created; human approved | `conformance.mjs:68` runs `bash -n`; the WSL bash cannot open Windows paths |
| `C:\info7375\bin` added to the **user** PATH, ahead of `…\Microsoft\WindowsApps` | human (Windows Settings) | so cmd finds both shims before the WSL alias. The first attempt left it last; fixed on the second try. |
| `py -3.11 -m pip install pyyaml` (6.0.3) | human | `conformance.mjs:65` needs PyYAML for YAML files |

## 3. After — clean clone at the tested commit (verbatim)

```
# Clean-clone check -- Sat 10/03/2026  1:24:16.47 -- shell: cmd.exe
# tested commit: 1b5a58908d3aab92b2fa2f96458deb4795f1cef3
# branch: contrib/2026fa-prpathak1-network-eng-h1b-soc-15-1241
# node v24.19.0
# python3: Python 3.11.9

===== $ npm install =====
npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting <email redacted>

added 53 packages, and audited 54 packages in 2s

16 packages are looking for funding
  run `npm fund` for details

3 high severity vulnerabilities

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn allow-scripts   sharp@0.33.5 (install: node install/check)
npm warn allow-scripts
npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
===== exit code: 0 =====

===== $ npm run doctor =====

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.19.0
  ✓ python3    Python 3.11.9

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
  ✓ verify         scripts/conformance.mjs
  ✓ manifest-check scripts/manifest-check.mjs
  ✓ eval:score     scripts/eval/score-run.mjs
  ✓ eval:report    scripts/eval/report.mjs
  ✓ doctor         scripts/doctor.mjs
  ✓ bls:local-wage scripts/bls/local-wage-adjustment.py
  ✓ build-instructions scripts/build-instructions.mjs
  ✓ to-markdown    scripts/to-markdown.mjs
  ✓ score          scripts/score/role-scorer.mjs
  ✓ score:gates    scripts/score/gate-harness.mjs
  ✓ ats:dedup      scripts/ats/dedup-tracker.mjs
  ✓ ats:liveness   scripts/ats/check-liveness.mjs
  ✓ ats:merge      scripts/ats/merge-tracker.mjs
  ✓ ats:normalize  scripts/ats/normalize-statuses.mjs
  ✓ ats:scan       scripts/ats/scan.mjs
  ✓ ats:verify     scripts/ats/verify-pipeline.mjs
  ✓ resumes:pdf    scripts/resumes/generate-pdf.mjs
  ✓ svg-to-png     scripts/svg-to-png.mjs
  ✓ audit:layout   scripts/svg-layout-audit.mjs
  ✓ postsvg-to-png scripts/svg-layout-audit.mjs
  ✓ skill-demand   scripts/score/skill-demand-monitor.mjs
  ✓ skill-demand:test scripts/score/skill-demand-monitor.test.mjs
  ✓ fetch-postings scripts/ats/fetch-real-postings.py
  ✓ pii-scan       scripts/pii-scan.mjs

DOMAIN DIRECTORIES
  ✓ data/sec
  ✓ data/bls
  ✓ data/ats
  ✓ data/80-days-to-stay
  ✓ scripts/sec
  ✓ scripts/bls
  ✓ scripts/ats
  ✓ scripts/resumes

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
===== exit code: 0 =====

===== $ npm run verify =====

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 171 files (88 md · 37 py · 32 js · 10 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
===== exit code: 0 =====
```

Notes on that output:
- The doctor counts only top-level `recipes/*.md`, so this recipe (in `recipes/cases/2026fa/`) is not in its 33. Its own count was checked with the doctor's regex: `todos_open: 8` = 8 markers.
- The two `W2` warnings are false positives: `git check-ignore -v` shows `private/x.md` ignored by `.gitignore:37:/private/*` and `data/ats/x.json` by `.gitignore:40:/data/ats/*`. `W1 archive/` is real. All three exist on `main`.
- The `npm install` audit warnings are upstream. `npm audit fix` was not run (it would change `package-lock.json`).

Prototype, tests and conformance on the student folder (verbatim):

```
===== $ node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs =====
network-eng-h1b run 20261003-052427: evaluated 7 → Apply 0 · Consider 4 · Skip 1 · Not scored 1 (network, do not apply yet 1) · Missing 1
  NOT_SCORED skytap-network-eng: [G1] no liveness result: posting not checked
  MISSING    fictional-missing: no row in 80-days CSV for this normalized company name
  wrote course/2026fa/submissions/prpathak1/runs/20261003-052427/run.json + report.md
===== exit code: 1 =====

===== $ node --test "scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/test/*.test.mjs" =====
✔ keyword rule: needs "network" AND a role word; bare "Engineer" never matches (1.2442ms)
✔ parsers: Python title lists and quoted CSV (1.0503ms)
✔ labels: a computed value is record only if every input is a record (0.1829ms)
✔ F1 unit: no CSV row, empty or non-numeric approvals → missing, never a number (0.3495ms)
✔ F1 run: the fictional company is reported missing and never reaches the scorer (2317.8471ms)
✔ F2 unit: approvals with only bare "Engineer" → Possible, no network match (0.2476ms)
✔ F2 run: COMPOUND LABS INC (real CSV row, titles ["Engineer"]) is Possible, not Likely (0.2496ms)
✔ F3 unit: past dates → negative slack → factor 0 (closed) (1.3241ms)
✔ F3 run: past-dates persona → nothing scored, G2 named, exit 1, scorer not called (1810.582ms)
✔ G2a unit: OPT start outside program end … +60 days, or used days before OPT → input error (0.7203ms)
✔ F4 run: "authorized" in a sponsorship-needing profile → G0 stops, exit 2, nothing scored (530.4104ms)
✔ G0 run: the main persona passes against the real scorer (0.1879ms)
✔ F5 unit: classifyLiveness(404) → expired → liveness factor 0; uncertain/absent → not scored (0.244ms)
✔ F5 run: an expired posting is gated to Skip by the real scorer (0.1786ms)
✔ G1 run: missing liveness → not scored, and a Likely sponsor goes on the networking list (0.4236ms)
✔ main run: exit 1 (some roles missing/not scored) and both outputs written (0.8311ms)
✔ labels: every labeled value uses one of the three labels; every scorer term carries an explicit source (0.8812ms)
✔ privacy: outputs carry no phone numbers, no non-example emails, and no values from the never-read columns (3.0123ms)
✔ break (c) unit: empty company, empty title, or duplicate role_id → input problems (0.3696ms)
✔ break (c) run: a candidates file with an empty company stops (exit 2) before scoring (76.0044ms)
✔ break (d): the PII guard names the problem but never repeats the address (91.9145ms)
✔ break (a, b): malformed date and missing persona file stop with exit 2 and repo-relative paths (665.0977ms)
✔ data, not typed numbers: approvals in the run equal the CSV row (374.5512ms)
ℹ tests 23
ℹ suites 0
ℹ pass 23
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6105.0486
===== exit code: 0 =====

===== $ node scripts/conformance.mjs scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/ =====
conformance: 11 files (7 json · 1 py · 1 md · 2 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.
===== exit code: 0 =====
```

Exit code 1 from the prototype is the designed result: the run completed, and two openings were reported as not scored or missing, each with its reason (0 = all scored, 2 = run stopped).

## 4. Failure cases F1–F5 (CHANGE-BRIEF §5)

| # | Case | Exercised by | Saw | Expected |
|---|---|---|---|---|
| F1 | Company missing from the CSV | sample run (`Example Fictional Netways LLC`); tests "F1 unit", "F1 run" | `MISSING fictional-missing: no row in 80-days CSV for this normalized company name`; not in `roles.json` sent to the scorer | missing with a reason; never scored |
| F2 | Bare `Engineer` title | sample run (`COMPOUND LABS INC`, real titles `['Engineer']`); tests "F2 unit", "F2 run" | tier Possible, `network_titles_matched: []` (it then reached Consider 0.355 — see Known limitations) | not a network match |
| F3 | OPT window closed | `fixtures/persona-past-dates.json`; tests "F3 unit", "F3 run" | slack < 0 → factor 0; every opening not scored (G2) or missing; scorer not called; exit 1 | window closed → not scored |
| F4 | Profile triggers `role-scorer.mjs:60` | `fixtures/persona-regex-trigger.json`; test "F4 run" | G0: persona `needs_sponsorship` true, scorer read `false` → `STOP (exit 2)`, nothing scored, profile not reworded | G0 stops the run |
| F5 | Posting 404 | `classifyLiveness({ status: 404 })` from `scripts/ats/liveness-core.mjs`; sample run (`SABSE TECHNOLOGIES INC`, sample `expired`) | `expired` → liveness 0 → real scorer: `Skip`, "gated: liveness ≈ 0.000" | closed gate → Skip |

## 5. Deliberate break attempts (CLI, outside the test suite)

**Before fixes** (commit `1a3e757`; `reallocation-notes/break-attempts-before-fix.txt`):
- (a) passed;
- (b) printed an absolute machine path;
- (c) **did not fail clearly**: reported as "no row in 80-days CSV" and the run continued with exit 1;
- (d) printed the rejected address twice.

Fixed in `run.mjs` (candidate validation, repo-relative paths, address withheld), plus 4 tests.

**After fixes**, clean clone at the tested commit (verbatim):

```
===== $ break (a): node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs --persona scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/BROKEN-persona-malformed-date.json --run-id break-a =====
  wrote course/2026fa/submissions/prpathak1/runs/break-a/run.json + report.md (stop record)
STOP (exit 2): G2a timeline input error: visa.opt_start_date missing or not YYYY-MM-DD
===== exit code: 2 =====

===== $ break (b): node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs --persona scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/does-not-exist.json --run-id break-b =====
  wrote course/2026fa/submissions/prpathak1/runs/break-b/run.json + report.md (stop record)
STOP (exit 2): input error: persona file not found: scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/does-not-exist.json
===== exit code: 2 =====

===== $ break (c): node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs --candidates scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/BROKEN-candidates-empty-company.json --run-id break-c =====
  wrote course/2026fa/submissions/prpathak1/runs/break-c/run.json + report.md (stop record)
STOP (exit 2): input error in scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/BROKEN-candidates-empty-company.json: roles[0].company is missing or empty
===== exit code: 2 =====

===== $ break (d): node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs --persona scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/BROKEN-persona-non-example-email.json --run-id break-d =====
  wrote course/2026fa/submissions/prpathak1/runs/break-d/run.json + report.md (stop record)
STOP (exit 2): PII guard: persona.candidate.email is not an @example.com address (value withheld); persona file contains a non-example email address (value withheld)
===== exit code: 2 =====
```

None of the four produced a score or an invented value.

## 6. Scope: `git diff --stat main...HEAD` (clean clone, verbatim)

```
 .../2026fa/submissions/prpathak1/CHANGE-BRIEF.md   |  181 +++
 .../runs/20261003-051715/g0-probe/probe-roles.json |   24 +
 .../runs/20261003-051715/g0-probe/role-scores.json |   66 +
 .../runs/20261003-051715/g0-probe/role-scores.md   |   11 +
 .../prpathak1/runs/20261003-051715/report.md       |  105 ++
 .../runs/20261003-051715/role-scores.json          |  238 ++++
 .../prpathak1/runs/20261003-051715/role-scores.md  |   15 +
 .../prpathak1/runs/20261003-051715/roles.json      |  112 ++
 .../prpathak1/runs/20261003-051715/run.json        | 1402 ++++++++++++++++++++
 .../prpathak1-network-eng-h1b-soc-15-1241.card.md  |  110 ++
 .../prpathak1-network-eng-h1b-soc-15-1241.md       |  381 ++++++
 .../README.md                                      |   91 ++
 .../fixtures/BROKEN-candidates-empty-company.json  |   29 +
 .../fixtures/BROKEN-persona-malformed-date.json    |   21 +
 .../fixtures/BROKEN-persona-non-example-email.json |   21 +
 .../fixtures/candidates.json                       |   19 +
 .../fixtures/persona-past-dates.json               |   18 +
 .../fixtures/persona-regex-trigger.json            |   18 +
 .../fixtures/persona.json                          |   18 +
 .../normalize_names.py                             |   36 +
 .../prpathak1-network-eng-h1b-soc-15-1241/run.mjs  |  728 ++++++++++
 .../test/run.test.mjs                              |  268 ++++
 22 files changed, 3912 insertions(+)
```

`git diff --name-only main...HEAD`: every path begins with one of these. No deletions; no other files.
- `course/2026fa/submissions/prpathak1/`
- `recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241`
- `scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/`

(This report and the other Part 3 documents are added in the next commit, also under `course/2026fa/submissions/prpathak1/`; the run log is at `logs/runs/2026fa-prpathak1-1.md`.)

## 7. What each gate requires a human to judge

The machine checks that each gate's condition holds; a person judges whether the inputs are true.

| Gate | Machine checks | A human must judge |
|---|---|---|
| G0 profile pre-check | the real scorer reads the persona's `authorization` text as needing sponsorship, matching `needs_sponsorship` | that `needs_sponsorship` is right for the person, and that the authorization text is honest (never reworded to pass) |
| G2a timeline inputs | dates parse; OPT start is between program end and program end + 60 days; days used = 0 before OPT | that the dates are the person's real dates, and that a 60-day hiring lag is a fair assumption |
| G2 visa timeline | slack in days and the factor | whether the slack is real given the cap lottery and cap-gap timing (not verifiable here) |
| G1 liveness | a result of `active` or `expired` exists | in sample mode the results are fixture values: a person must open each posting and confirm it is real and open before acting. Live checking (recipe A4) is not built. |
| Sponsorship input | an exact normalized-name row exists with numeric approvals | that the row is the same employer (two spellings, or two employers sharing a name, are not detected), and — for every Consider — that the employer sponsors **now**, by asking the recruiter or a contact |

No named human has signed any gate yet (`last_gate: null`, `attestation: null`).

## 8. Known limitations seen in testing

- **Weak network signal:** Likely (p 0.6) vs Possible (p 0.5) is a 0.035 composite difference. COMPOUND LABS INC (title `Engineer`) reached Consider at 0.355. Skip rate 1 of 5 scored (20%). Recipe proposal A5.
- **Substring over-match:** SKYTAP INC is Likely only via `Engineering Manager, Networking`. Not foreseen by prediction P1.
- **Unused funding columns:** the 80-days CSV has its own dated funding columns (e.g. `latest_funding_date`), which the recipe does not use. Funding context comes only from the Form D samples (all 7: "no record in sample data").
- **Platform coverage:** tested on Windows only; not on Linux CI.

## 9. Engine baseline runs (assignment "Before you start")

Both were run on 2026-10-03 at commit `25436c0`, before this section was added.

### `npm run ats:scan -- --dry-run`

How it was run, and why:
- `scripts/ats/scan.mjs` reads `data/ats/portals.yml` (line 41) and, even in a dry run, the private files `data/ats/scan-history.tsv`, `pipeline.md` and `applications.md` (lines 182–212). It also calls the ATS hosts `api.ashbyhq.com`, `jobs.ashbyhq.com`, `api.lever.co`, `jobs.lever.co` and `boards-api.greenhouse.io`.
- Running it in the working copy would read the student's private job-search files, and contact hosts that the session rules allow only with approval. The AI flagged this.
- The human chose: run it in a **fresh temp clone** (its `data/ats/` held only the tracked `portals.example.yml`), with `REALLOCATION_ENGINE_PORTALS` pointing at that tracked example, and approve network calls to those hosts for this one run.
- After the run, the clone's `data/ats/` still held only `portals.example.yml`, and `git status` was clean. The clone was deleted.

Real output (verbatim; the listed postings are public job titles and locations from the example config's one company):

```
$ REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 1 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-03
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     1
Total jobs found:      886
Filtered by title:     392 removed
Filtered by location:  423 removed
Duplicates:            10 skipped
New offers added:      61

New offers:
  + Databricks | AI Engineer - FDE (Forward Deployed Engineer) | Remote - India
  + Databricks | AI Engineer – Forward Deployed Engineering (AI FDE) | United States
  + Databricks | AI Transformation Leader | United States
  + Databricks | 	Delivery Solutions Architect - Communications, Media, Entertainment & Games | United States
  + Databricks | Delivery Solutions Architect - Retail | Denver, Colorado; West Coast - United States
  + Databricks | Director, Agent & AI Search | United States
  + Databricks | Director, Americas Field Marketing at Databricks | United States
  + Databricks | Director, Field Engineering (CPG & Retail) | United States
  + Databricks | Director, Marketing Strategy and AI Transformation | United States
  + Databricks | Director, Paid Media | United States
  + Databricks | Field Engineering Enablement Leader | United States
  + Databricks | Forward Deployed Engineer (FDE) - Public Sector | United States
  + Databricks | Lakebase Associate Director - Retail | United States
  + Databricks | Lead Field Technical Program Manager, FDE - Retail, Consumer Goods, Travel, Transportation & Hospitality | United States
  + Databricks | Lead Learning Product Manager | United States
  + Databricks | Lead Solutions Architect - Generative AI (EMEA Emerging DNB) | Remote - United Kingdom
  + Databricks | Manager, Field Engineering - Global Telecommunications  | Remote - Texas
  + Databricks | Manager, Field Engineering - Strategic Digital Native Business | Remote - California; Remote - Colorado; Remote - Oregon; Remote - Washington
  + Databricks | Manager, Forward Deployed Engineering | Remote - India
  + Databricks | Manager, Forward Deployed Engineering - CMEG | Remote - Washington D.C.
  + Databricks | Principal Demand Generation Manager, Campaign Development | United States
  + Databricks | Principal Security Field Engineer | Remote - California
  + Databricks | Senior Customer Enablement AI Programs Manager | United States
  + Databricks | Senior Solutions Architect - Consumer Product Goods | Dallas, Texas; Missouri; Remote - Missouri; Remote - Texas; St. Louis, Missouri; Texas; United States
  + Databricks | Senior Solutions Architect (Data & AI) - Leeds based | Remote - United Kingdom
  + Databricks | Solutions Architect - Communications, Media, Entertainment and Games | Colorado; Denver, Colorado; Remote - Colorado
  + Databricks | Solutions Architect - Communications, Media, Entertainment & Gaming  | United States
  + Databricks | Solutions Architect - Retail, Travel & Hospitality  | Atlanta, Georgia; Central - United States; Remote - North Carolina; West Coast - United States
  + Databricks | Specialist Solutions Architect - AI/ML | United States
  + Databricks | Specialist Solutions Architect - Data Engineering & Warehousing (Financial Services)  | United States
  + Databricks | Sr. Deployment Strategist, FDE - Communications, Media, Entertainment & Gaming | United States
  + Databricks | Sr. Director, Enterprise - Retail Vertical - Strategic Accounts  | Remote - New York
  + Databricks | Sr. Engagement Manager, Forward Deployed Engineering - Public Sector | Remote - Virginia; Remote - Washington D.C.
  + Databricks | Sr. Forward Deployed Engineer | Remote - Washington D.C.
  + Databricks | Sr. Forward Deployed Engineer (FDE) - Digital Native Business  | West Coast - United States
  + Databricks | Sr. Forward Deployed Engineer (FDE) - Financial Services | Central - United States
  + Databricks | Sr. Forward Deployed Engineer (FDE) - Public Sector  | Alabama; Remote - Virginia; Remote - Washington D.C.
  + Databricks | Sr. Forward Deployed Engineer (FDE) - Retail | Remote - California
  + Databricks | Sr. Forward Deployed Engineer - National Security | United States
  + Databricks | Sr. Industry Marketing Manager, Manufacturing & Supply Chain | United States
  + Databricks | Sr. Manager, AI Forward Deployed Engineering (AI FDE) | United States
  + Databricks | Sr. Manager, Field Engineering | Chicago, Illinois; Connecticut; New Jersey; Remote - New York; Remote - Washington D.C.; San Francisco, California
  + Databricks | Sr. Manager, Field Engineering - Digital Native Business | Colorado; Remote - California; Remote - Oregon; Remote - Washington
  + Databricks | Sr. Manager, Field Engineering - Healthcare and Life Sciences (Healthcare Providers) | United States
  + Databricks | Sr. Manager, Field Engineering - Sports | Northeast - United States
  + Databricks | Sr Platform Monitoring Engineer | United States
  + Databricks | Sr. Product Marketing Manager, Lakewatch & Agentic Apps | West Coast - United States
  + Databricks | Sr. Solutions Architect - Retail, Travel & Hospitality | Atlanta, Georgia; Chicago, Illinois; Dallas, Texas; Phoenix, Arizona; Portland, Oregon; Remote - California; Remote - North Carolina; Seattle, Washington
  + Databricks | Sr. Solutions Architect - Retail, Travel & Hospitality  | Charlotte, North Carolina; Raleigh, North Carolina; Remote - North Carolina
  + Databricks | Sr. Solutions Engineer - Digital Native Business (Strategic Accounts) | Remote - California; Remote - Colorado; Remote - Oregon; Remote - Washington
  + Databricks | Sr. Technology Partner Director - AI Code-Gen & Apps | Remote - California; San Francisco, California
  + Databricks | Staff Enterprise Security Engineer | Remote - California
  + Databricks | Staff Forward Deployed Engineer | Remote - India
  + Databricks | Staff Product Manager, US Public Sector | Remote - California; Remote - Virginia; Remote - Washington D.C.
  + Databricks | Staff Security Assurance Engineer  | Remote - Washington D.C.; Washington, D.C.
  + Databricks | Staff Security Engineer, Incident Response | Belgium; Finland; Remote - Denmark; Remote - France; Remote - Germany; Remote - Italy; Remote - Netherlands; Remote - Spain; Remote - Sweden; Remote - United Kingdom; Switzerland
  + Databricks | Staff Security Field Engineer | Remote - California
  + Databricks | Staff Security Software Engineer, Agentic Security Engineering  | Remote - California
  + Databricks | Staff Unified Communications Engineer | San Francisco, California; United States
  + Databricks | Strategic Account Executive - Retail vertical  | Remote - California
  + Databricks | Strategy & Execution Manager — Retail | United States

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
[exit code: 0]
```

The final line ("Review new offers in data/ats/pipeline.md") is the scanner's standard message. In a dry run nothing was written there.

### `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/prpathak1/runs/baseline-ch11`

```
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/prpathak1/runs/baseline-ch11

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/prpathak1/runs/baseline-ch11

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course\2026fa\submissions\prpathak1\runs\baseline-ch11\role-scores.json  +  course\2026fa\submissions\prpathak1\runs\baseline-ch11\role-scores.md
[exit code: 0]
```

`git status` afterwards showed only the new `runs/baseline-ch11/` folder. The tracked `data/examples/role-scores.*` were not overwritten, because `--out-dir` was passed.

`runs/baseline-ch11/role-scores.md` (verbatim):

# Role Scorer report — 2026-10-03

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 5 roles → Apply 2 · Consider 1 · Skip 2. **Skip rate 40%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| Cambridge biotech (Ch.7) — Data role (Proven tier) | 0.446 | **Apply** | composite 0.446 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 1[record]×timeline 0.85[your-input] |
| Likely-tier sponsor — Strong but Likely not Proven | 0.418 | **Consider** | above threshold (0.418) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.85·0.3 [model-judgment] × liveness 1[record]×timeline 0.9[your-input] |
| Non-sponsor, but HM is a contact — Scorer says Skip, you know better | 0.193 | **Apply ⟵ override** | composite 0.193 < 0.2 — time is better spent elsewhere | sponsorship 0.05·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 1[record]×timeline 0.85[your-input] |
| Household-name non-sponsor — Same data role | 0.178 | **Skip** | composite 0.178 < 0.2 — time is better spent elsewhere | sponsorship 0·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 1[record]×timeline 0.85[your-input] |
| Proven sponsor (ghost posting) — Looks perfect, isn't real | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [model-judgment] × liveness 0[record]×timeline 0.85[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*

This reproduces the Chapter 11 worked example recorded in `DOMAIN.md`: Cambridge biotech → Apply 0.446; identical non-sponsor → Skip 0.178.
