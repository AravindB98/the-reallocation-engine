# Test report: pre-OPT backend sponsor tiers

*Written by the assistant (Claude Code); `SOURCES.md` says who did what. The assignment asks for the prototype to be run "yourself" from a clean checkout. The assistant ran everything below, and the author has not yet repeated it; the commands are written out so that the author, or a TA, can.*

## Executive summary

This report records how the prototype was tested: the toolchain before and after, the offline tests, the deliberate attempts to break it, each named failure case, a run from a clean checkout, what a person still has to judge, and what two rounds of independent review found. Everything below is pasted terminal output from the working session on 2026-09-30, each block under the command that produced it, scrubbed only of this machine's username and folder names (shown as `~` or `<scratch>`) and of one third party's email address, which a package's own metadata contains (shown as `<redacted email>`). The short version: the prototype's 102 offline tests pass (on Node 26 and on Node 20), 59 of 59 deliberate code breaks are caught, a fresh clone reproduces the sample run byte for byte, a source archive made the way the Canvas ZIP is made also passes the tests, and the repository's history scan against the base is clean. The repository's working-tree scan and its continuous integration were already failing before any of this work, for reasons outside it, and that is shown too.

**Commit under test:** `5d42dae`. Everything except four documents in the submission folder is final at this commit; the one commit after it changes only `README.md` (the start-here page), `FRICTIONAL.md`, `worked-run.md` and this report. Those four are left out of the `git diff --stat` below, because the last commit changes them (and two of them embed its output). **Environment:** macOS; Node v26.10.0, and Node v20.20.2 (fetched through `npx`; nothing is installed system-wide) for the Node 20 runs; Python 3.12.14 (used only for checks that compare against the repository's Python code); npm 11.19.1.

## 1. Toolchain baseline, before any change (repository commit 015843d)

`npm run doctor` passed:

```text
$ npm run doctor
> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v26.10.0
  ✓ python3    Python 3.12.14

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
```

`npm run verify` failed at first, because the manifest check shells out to Python's YAML package, which is not installed here. The file conformance part passed (158 files); the manifest part failed:

```text
$ npm run verify
> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================
Traceback (most recent call last):
  File "<string>", line 1, in <module>
ModuleNotFoundError: No module named 'yaml'

ERROR (1):
  E1 .ai/manifest.yaml does not parse: Error: Command failed: python3 -c "import yaml,json;print(json.dumps(yaml.safe_load(open('.ai/manifest.yaml'))))"

✗ manifest check FAILED (1 error)
```

After installing PyYAML in a repository-local, git-ignored `.venv` and putting it first on the path, the same command passed:

```text
$ PATH=$PWD/.venv/bin:$PATH npm run verify
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

The personal-data scan already had one finding on the untouched base repository, a package author's address inside `package-lock.json` (redacted here; it is a false positive in the base, not this work's):

```text
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <redacted email>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
```

The repository's continuous integration on its main branch was already failing:

```text
$ gh run list -R nikbearbrown/the-reallocation-engine --limit 4
completed	failure	fix(greenhouse-watch): justification lines now sum to the score	main	push	35913366020
completed	success	fix(greenhouse-watch): justification lines now sum to the score	main	push	35913365898
completed	failure	greenhouse-watch: SmartRecruiters provider (Canva); 7-board Advocate-…	main	push	35465691202
completed	success	greenhouse-watch: SmartRecruiters provider (Canva); 7-board Advocate-…	main	push	35465691193

$ gh run view 35913366020 -R nikbearbrown/the-reallocation-engine --json jobs   (the latest Contrib Gate run on main)
failure	harness-regression
success	conformance
failure	doctor-and-pii
skipped	contrib-scope

first error lines from the failing steps:
harness-regression	UNKNOWN STEP	2026-09-23T20:03:23.3310568Z Error: Cannot find module 'scripts/test/gate-behavior-harness.mjs'
doctor-and-pii	UNKNOWN STEP	2026-09-23T20:03:27.7422624Z pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions
```

Reading of that: `harness-regression` fails because four scripts its workflow names do not exist in the repository (`scripts/test/gate-behavior-harness.mjs`, `scripts/test/fuzz-invariants.mjs`, `scripts/gates/gate-behavior-harness.mjs`, `scripts/score/scorer-harness.mjs`). `doctor-and-pii` fails at its working-tree scan on the same lock-file finding, so the history scan step that would follow never runs on a pull request. A pull request cannot fix either (the workflow folder is protected), so "CI green" is not fully reachable for any contribution. This work therefore runs each CI step itself, including the history scan, below.

## 2. Toolchain after (at commit 5d42dae)

```text
$ npm run doctor 2>&1; echo "exit: $?"
> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v26.10.0
  ✓ python3    Python 3.12.14

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
exit: 0
```

```text
$ PATH=$PWD/.venv/bin:$PATH npm run verify 2>&1; echo "exit: $?"
> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 187 files (88 md · 36 py · 52 js · 7 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit: 0
```

The working-tree scan reports only the base repository's own lock-file finding (unchanged from the baseline):

```text
$ node scripts/pii-scan.mjs 2>&1; echo "exit: $?"
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <redacted email>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
exit: 1
```

The scan of the whole branch history against the base, which is what the continuous integration would run if it got that far, is clean:

```text
$ node scripts/pii-scan.mjs --diff upstream/main 2>&1; echo "exit: $?"
pii-scan: clean ✓
exit: 0
```

Conformance on everything this work added (the `PATH` setting is needed for the persona's YAML file):

```text
$ PATH=$PWD/.venv/bin:$PATH node scripts/conformance.mjs scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/ recipes/cases/2026fa search/examples/kiran-rao course/2026fa logs/runs 2>&1; echo "exit: $?"
conformance: 45 files (14 md · 22 js · 8 json · 1 yaml)
✓ all conform (machine half of P4). Adequacy is still the human gate.
exit: 0
```

The contrib-scope rule of the CI (only namespaced paths, no protected paths), run locally with the same two patterns:

```text
$ CHANGED=$(git diff --name-only upstream/main...HEAD); echo "changed files: $(echo "$CHANGED" | wc -l | tr -d ' ')"; echo "protected-path hits:"; echo "$CHANGED" | grep -E '^(logs/RUN_LOG\.md|SNICKERDOODLE\.md|DOMAIN\.md|DATA_CONTRACT\.md|package\.json|\.github/|\.githooks/|AGENTS\.md|CLAUDE\.md)' || echo "  none"; echo "files outside the standard namespaces:"; echo "$CHANGED" | grep -vE '^(scripts/contrib/|recipes/cases/|logs/runs/|course/[^/]+/submissions/|search/examples/|scripts/(score|ats|sec|bls|resumes|gates|test)/[^/]+\.(mjs|py)$)' || echo "  none"
changed files: 49
protected-path hits:
  none
files outside the standard namespaces:
  none
```

`git diff --stat` against the base shows only namespaced paths. The four documents named above are excluded; they are in the same folder, `course/2026fa/submissions/aravindkumar2504/`:

```text
$ git diff --stat upstream/main...HEAD -- . ':(exclude)course/2026fa/submissions/aravindkumar2504/TEST-REPORT.md' ':(exclude)course/2026fa/submissions/aravindkumar2504/worked-run.md' ':(exclude)course/2026fa/submissions/aravindkumar2504/FRICTIONAL.md' ':(exclude)course/2026fa/submissions/aravindkumar2504/README.md' 2>&1
 .../submissions/aravindkumar2504/CHANGE-BRIEF.md   |  101 +
 .../2026fa/submissions/aravindkumar2504/SOURCES.md |   47 +
 .../aravindkumar2504/domain-justification.md       |   26 +
 .../aravindkumar2504/runs/2026-09-30/report.md     |  128 +
 .../runs/2026-09-30/role-scores.json               | 2579 ++++++++++
 .../runs/2026-09-30/role-scores.md                 |   81 +
 .../aravindkumar2504/runs/2026-09-30/roles.json    | 1422 ++++++
 .../aravindkumar2504/runs/2026-09-30/run-log.json  | 5362 ++++++++++++++++++++
 .../runs/2026-09-30/scorer-profile.json            |    3 +
 .../aravindkumar2504/title-matcher-check.md        |  118 +
 logs/runs/2026fa-aravindkumar2504-1.md             |   12 +
 ...avindkumar2504-preopt-swe-sponsor-tiers.card.md |   57 +
 .../aravindkumar2504-preopt-swe-sponsor-tiers.md   |  272 +
 .../README.md                                      |  110 +
 .../break-it.mjs                                   |  139 +
 .../check-titles.mjs                               |   76 +
 .../check-titles.test.mjs                          |   31 +
 .../checks.mjs                                     |  203 +
 .../checks.test.mjs                                |   59 +
 .../cli.test.mjs                                   |  627 +++
 .../evidence.mjs                                   |  378 ++
 .../evidence.test.mjs                              |  245 +
 .../fixtures/BROKEN-role-scorer-crashes.mjs        |    3 +
 .../BROKEN-role-scorer-misparses-profile.mjs       |   23 +
 .../fixtures/BROKEN-scorer-output.fixture.json     |   16 +
 .../fixtures/STANDIN-role-scorer-passthrough.mjs   |    9 +
 .../fixtures/bls.fixture.csv                       |    6 +
 .../fixtures/companies.fixture.csv                 |   18 +
 .../fixtures/formd/fixture-quarter.json            |  142 +
 .../fixtures/watchlist.fixture.txt                 |   12 +
 .../guard.mjs                                      |   60 +
 .../guard.test.mjs                                 |  123 +
 .../params.json                                    |   33 +
 .../paths.mjs                                      |   44 +
 .../persona-and-scorer.test.mjs                    |  135 +
 .../persona.mjs                                    |   98 +
 .../preopt-sponsor-tiers.mjs                       |  443 ++
 .../recipe-paths.test.mjs                          |   81 +
 .../report.mjs                                     |  237 +
 .../role-families.json                             |   30 +
 .../sample-inputs/watchlist.txt                    |   31 +
 .../scorer-bridge.mjs                              |  100 +
 .../timeline.mjs                                   |  133 +
 .../timeline.test.mjs                              |   75 +
 search/examples/kiran-rao/profile.yml              |   38 +
 45 files changed, 13966 insertions(+)
```

## 3. The offline tests

102 tests, no network. The inputs are synthetic fixtures, the committed fictional persona, and the real scorer run as a command. Full output on Node 26:

```text
$ node --version; node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs 2>&1
v26.10.0
✔ the seeded generator and sampler are repeatable, and the seed matters (1.14375ms)
✔ draw splits the fixture titles by the rule and is repeatable (1.676625ms)
✔ the committed sample run was made by the current code, parameters and data (re-run it if you change any of them) (4.215292ms)
✔ the committed run is the documented command's run, for the committed sample inputs, with nothing outside the repository in it (0.415667ms)
✔ checks.mjs watchlist and formd-pairs read the committed run and agree with it (100.110042ms)
✔ checks.mjs source puts the raw table cells beside the run log and redoes the arithmetic (399.2015ms)
✔ named failure case F5: old data is refused without the acknowledgement flag, and nothing is written (62.29725ms)
✔ a full fixture run puts every company in the right bucket and lets the real scorer decide the scored ones (105.277334ms)
✔ the four files this program writes are byte-identical when the same inputs are run twice (the scorer's own two files carry its date stamp) (328.621791ms)
✔ the timeline gate multiplies through the real scorer: a partly used buffer demotes, a closed gate zeroes (204.639417ms)
✔ an older persona with no explicit needs_sponsorship is refused with exit 2 (47.0365ms)
✔ an older persona runs when the missing values are supplied on the command line (recorded as command-line) (100.67175ms)
✔ named failure case F3: a SOC code with no BLS row still runs and says so; nothing is invented (103.105959ms)
✔ named failure case F7 through the command line: a renamed column exits 2 and names it (47.455625ms)
✔ a run with nothing to score still completes: empty scorer input, the scorer is skipped, both outputs exist (159.553583ms)
✔ the report shows only the requested number of discovered companies, but the log keeps all of them (101.819917ms)
✔ the report opens with the executive summary and the outputs carry no email or phone-looking text (101.638125ms)
✔ every field of every row has a declared label, every label starts with one of the four kinds, and so does every run-level value (101.254125ms)
✔ usage errors: --help exits 0; an unknown flag, a bad number, and an unknown family exit 2 (322.941541ms)
✔ named failure case F6 end to end: a scorer that mis-reads the persona aborts the run (exit 4) and leaves no outputs (90.8065ms)
✔ a scorer that crashes aborts the run with exit 5 and leaves no outputs (85.649292ms)
✔ a persona outside search/examples/ may not write into a tracked folder (exit 2), but may write outside the repo (147.541416ms)
✔ a committed fictional persona and the sample inputs are recorded as such in gate G1 (99.939791ms)
✔ a run on the repository's own data records only repository-relative paths, never this machine's (279.676625ms)
✔ sample inputs may write inside this recipe's own runs folder, and nowhere else inside the repository (148.80725ms)
✔ a watchlist that is not one of the committed samples is treated as real data (148.333167ms)
✔ an explicitly given Form D folder that is missing or empty is an error, not a silent zero (96.7235ms)
✔ malformed persona YAML exits 2 with a message, not a stack trace (47.986875ms)
✔ a real persona cannot write into a folder inside the repository whose name starts with two dots, or through a symlink into a tracked folder (92.059042ms)
✔ a company table that is not the repository's own is treated as real data, like a persona or watchlist (146.5105ms)
✔ outputs never carry this machine's folders, even when the inputs and the output folder are outside the repository (103.047542ms)
✔ a persona that does not need sponsorship is refused: the recipe is built for a candidate who does (48.11525ms)
✔ an output folder that is a file, or cannot be written, is an input error (94.950375ms)
✔ a Form D folder that is really a file is an input error naming the flag (46.978375ms)
✔ a watchlist with no names is refused, and a name that is empty after normalizing is explained, not just "not found" (147.74875ms)
✔ a row listing 0 approvals and 0 denials is held as unknown, and rows with no usable name are never candidates (103.308042ms)
✔ a run that scored nothing removes the scorer files an earlier run left in the same folder (158.033667ms)
✔ a run made with a stand-in scorer says so in the run log, gate G2 and the top of the report (241.490541ms)
✔ a timeline factor at or below the scorer's own closed-gate line closes gate G3 and keeps the scorer's reason (100.164417ms)
✔ parseWatchlist skips comments and blank lines, handles CRLF and a byte-order mark, and reports a duplicate by its normalized name (0.351375ms)
✔ without --out-dir the output goes to private/tiers-run/<run date>, which git ignores, so a bare run cannot change a tracked file (110.20325ms)
✔ parseCsv handles quotes, doubled quotes, embedded commas and newlines, CRLF and a BOM (0.666458ms)
✔ parseCsv fails loudly on a ragged row or a truncated quote, and names the file it was reading (0.214917ms)
✔ normalizeName ports the repo rule: strip legal suffixes, punctuation and case; null-like strings are empty (0.498417ms)
✔ normalizeName strips suffixes repeatedly, exactly as the Python original does (expected values taken from running it) (0.218667ms)
✔ parseTitles reads a Python list repr, including apostrophes and commas inside titles (0.297083ms)
✔ parseTitles decodes the escapes Python writes, and refuses any it cannot decode (0.328625ms)
✔ parseTitles accepts only the shape Python writes: items separated by exactly ", " (0.168542ms)
✔ role family: backend-style titles match; testing, sales, frontend and management titles do not (1.127333ms)
✔ levelNote tells a new graduate whether any matched title lacks a senior marker (0.189834ms)
✔ tierFor: thresholds, small-sample caution, and the unscored role-type-unverified outcome (0.169584ms)
✔ tierFor: a count or rate exactly on a bar is on the higher side of it (0.075458ms)
✔ tierFor: a negative record is described as one, not as a low rate (0.082875ms)
✔ sponsorshipRecord separates no-record, incomplete-record and record; checks the given rate (0.101042ms)
✔ toNumber never returns NaN (0.025583ms)
✔ fixture CSV loads; the data vintage is its newest funding date (1.513708ms)
✔ named failure case F7: schema drift stops the run and names the missing column (0.627ms)
✔ name index flags an ambiguous name; the fixture pair collides (0.212667ms)
✔ fundingFacts measures recency against the data vintage, not the run date (0.081541ms)
✔ named failure case F3: a SOC code with no BLS row, an unreadable median, and a duplicate row are all "missing" with a reason (0.397958ms)
✔ wageComparison is plain arithmetic on two records (0.076833ms)
✔ Form D cross-check classifies every kind of pair, by FILING date, and never compares an ambiguous name (0.505167ms)
✔ Form D cross-check falls back to the first-sale date only when a record has no filing date (0.165459ms)
✔ filing dates are read from the DD-MON-YYYY form the samples use, and anything else is unknown, never guessed (0.148083ms)
✔ a missing Form D directory, or a file given as the directory, is reported as such, not treated as a failure (0.060625ms)
✔ splitTitles separates matched from unmatched titles (0.06425ms)
✔ committed samples may write in the recipe's own runs folder, private/ or outside the repository, and nowhere else inside it (5.768583ms)
✔ real data (a persona outside search/examples/) may be written only to private/ or outside the repository (7.184834ms)
✔ a folder whose name merely starts with two dots is inside the repository, not outside it (4.079709ms)
✔ a symlink cannot hide where an output folder really is (2.96725ms)
✔ .. segments are resolved before the decision, and letter case cannot disguise the repository (2.115417ms)
✔ any input that is not a committed sample makes the run real-data: the company table, wage file, Form D folder and watchlist (4.835875ms)
✔ paths written into outputs never carry this machine's folders (1.6095ms)
  canary: with the older persona wording the scorer reports profile_needs_sponsorship=false (defect still present: the guard is needed)
✔ the committed fictional persona passes gate G1 and keeps dates as strings (2.563833ms)
✔ the persona result carries no contact details (0.285292ms)
✔ a persona with missing fields fails once, naming every problem, and invents no default (0.20575ms)
✔ malformed YAML is an input error (exit 2 at the command line), not a stack trace (0.252ms)
✔ an older persona with no explicit needs_sponsorship is refused rather than guessed (0.328417ms)
✔ command-line values fill what an older persona lacks, and are recorded as such (0.510708ms)
✔ the scorer profile text is chosen so the scorer reads it correctly in both directions (91.876625ms)
✔ named failure case F6: the guard notices a scorer that mis-reads the persona or labels a placeholder as a record (0.203375ms)
✔ the guard notices a timeline gate labelled as a record, not only the liveness gate (0.123084ms)
✔ the guard notices the same role returned twice (0.09875ms)
✔ the term sent to the scorer for sponsorship is labelled your-input: the tier is classified from records, but its number is a parameter (0.056708ms)
✔ the guard notices a missing or extra role and an override this run never supplied (0.073292ms)
✔ KNOWN-DEFECT CANARY (informational): report whether the real scorer still mis-reads the older persona wording (41.835375ms)
✔ every repository path named in aravindkumar2504-preopt-swe-sponsor-tiers.md exists (1.536167ms)
✔ every repository path named in aravindkumar2504-preopt-swe-sponsor-tiers.card.md exists (0.212708ms)
✔ every repository path named in README.md exists (0.714291ms)
✔ the recipe declares as many open TODOs as its body contains (0.182084ms)
✔ the recipe claims no stage above RUNNABLE-SAMPLE and leaves the attestation null (0.179083ms)
✔ the reader-created example paths are never tracked by git (they may exist untracked on a reader's machine) (32.856917ms)
✔ dates round-trip and reject impossible calendar dates (1.841958ms)
✔ before authorization starts the clock has not started: factor 1 and zero days accrued (0.116208ms)
✔ once authorization has begun, a slow process eats the buffer (factor between 0 and 1) (0.092458ms)
✔ unemployment days already used count against the ceiling (0.045083ms)
✔ boundaries: slack equal to the buffer is fully open; slack of zero is closed (0.058125ms)
✔ named failure case F4: an authorization end date already in the past closes the gate (0.038209ms)
✔ a start that lands after the authorization end closes the gate even with days to spare (0.038667ms)
✔ an OPT-year-one candidate with 34 of 90 days used and a slow process is closed (the older persona's note) (0.062208ms)
✔ bad inputs are rejected, never repaired (0.101792ms)
✔ a zero buffer means any positive slack is fully open (0.069625ms)
ℹ tests 102
ℹ suites 0
ℹ pass 102
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4413.458625
```

The same suite under Node 20, the repository's stated minimum and its CI version (Node 20 prints its summary in TAP format), and the sample command under Node 20, whose scorer input files are compared with the Node 26 run's:

```text
$ npx -y node@20 --version; npx -y node@20 --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs 2>&1 | tail -12
v20.20.2
  ---
  duration_ms: 0.122708
  ...
1..102
# tests 102
# suites 0
# pass 102
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2936.038583
```

```text
$ rm -rf /tmp/tiers-run20; npx -y node@20 scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run20 2>&1; for f in roles.json scorer-profile.json; do cmp /tmp/tiers-run/$f /tmp/tiers-run20/$f && echo "identical: $f"; done
preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
  wrote /tmp/tiers-run20/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md
identical: roles.json
identical: scorer-profile.json
```

What they cover, by file:

| File | What it checks |
|---|---|
| `timeline.test.mjs` | the timeline gate: open before the clock starts, buffer partly used, ceiling reached, authorization ended, boundaries, bad inputs |
| `evidence.test.mjs` | the CSV parser (and that its errors name the file); the name rule, including repeated suffixes, checked against the Python original; the title-list reader, including the escapes Python writes and the separators it accepts; the role family rule and the senior markers; the tiers, their small-sample caution and their exact boundaries; a negative record; funding against the data's own vintage; the wage comparison; schema drift; the Form D cross-check record by record, by filing date |
| `persona-and-scorer.test.mjs` | the persona check (no defaults, no contact details, malformed YAML); the scorer profile in both directions; the integrity guard against a wrong output, a mislabelled timeline gate and a role returned twice; the label on the sponsorship term; a canary that reports whether the real scorer defect is still present (informational: it cannot fail on the defect) |
| `cli.test.mjs` | end-to-end runs on fixtures: every bucket; unknown companies never sent to the scorer; repeat runs identical for the four files this program writes; the timeline gate through the real scorer and the report's reason for a demotion or a closed gate; older personas; a missing wage row; a renamed column; nothing to score; the report limit; plain-language summary and no email or phone text; labels (every row field, every run-level value, every label starting with one of the four kinds); usage errors including names every object has; wrong, crashing and stand-in scorers; the privacy guard end to end (a real persona, a company table that is not the repository's, a folder named with two leading dots, a symlink into a tracked folder); a missing Form D folder; malformed persona YAML; a persona that does not need sponsorship; an output folder that is a file or cannot be written; an empty watchlist; odd rows in the company table; stale scorer files; the default output folder; no machine paths in the outputs |
| `guard.test.mjs` | the privacy guard and path helper alone, on a pretend repository: what may be written where, symlinks, `..` segments, letter case, two-dot folder names, every kind of non-sample input |
| `checks.test.mjs` | the committed sample run was made by the current code, parameters and data (it is not stale); the evidence checks agree with it |
| `check-titles.test.mjs` | the seeded title sampler is repeatable |
| `recipe-paths.test.mjs` | every repository path the recipe, card and README name exists (`private/` may be absent, as in the Canvas ZIP); the open-TODO count matches; no stage above RUNNABLE-SAMPLE is claimed |

## 4. Deliberate attempts to break it

`break-it.mjs` copies the working tree to a private folder, runs the suite once unbroken (it must pass), then changes one place in one file, runs the suite, and puts the file back, 59 times. A break is caught when at least one test fails. A break whose search text is not found exactly once is an error, and so is a time-out, so the list cannot quietly go stale. It is committed, so anyone can run it (it takes a few minutes):

```text
$ node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/break-it.mjs 2>&1; echo "exit: $?"
the suite passes on the unbroken copy; trying 59 breaks

B01 Proven needs only 2 approvals                                                        caught by 4 test(s): a full fixture run puts every company in the right bucket an
B02 the timeline gate ignores an authorization that has already ended                    caught by 2 test(s): the timeline gate multiplies through the real scorer: a part
B03 the unemployment clock starts today even before authorization starts                 caught by 3 test(s): a full fixture run puts every company in the right bucket an
B04 the timeline forgets the unemployment days already used                              caught by 3 test(s): an older persona runs when the missing values are supplied o
B05 unknown companies are sent to the scorer                                             caught by 8 test(s): a full fixture run puts every company in the right bucket an
B06 the scorer profile uses the wording the scorer misreads                              caught by 23 test(s): a full fixture run puts every company in the right bucket an
B07 the scorer-integrity check is not called                                             caught by 1 test(s): named failure case F6 end to end: a scorer that mis-reads th
B08 the legal suffix "inc" is no longer stripped from names                              caught by 7 test(s): a full fixture run puts every company in the right bucket an
B09 the data vintage uses the OLDEST funding date                                        caught by 26 test(s): a full fixture run puts every company in the right bucket an
B10 Likely accepts EITHER the count or the rate                                          caught by 3 test(s): a full fixture run puts every company in the right bucket an
B11 the discovery pool ignores the funding window                                        caught by 2 test(s): a full fixture run puts every company in the right bucket an
B12 the report loses its executive summary heading                                       caught by 1 test(s): the report opens with the executive summary and the outputs 
B13 the liveness placeholder is labelled a record                                        caught by 24 test(s): a full fixture run puts every company in the right bucket an
B14 the needs_sponsorship type check is removed                                          caught by 3 test(s): an older persona with no explicit needs_sponsorship is refus
B15 a small sample can be Proven on its rate alone                                       caught by 4 test(s): a full fixture run puts every company in the right bucket an
B16 an ambiguous watchlist name resolves to the first match                              caught by 1 test(s): a full fixture run puts every company in the right bucket an
B17 the privacy guard for real data is switched off                                      caught by 9 test(s): a persona outside search/examples/ may not write into a trac
B18 the title sampler counts unreadable lists as readable                                caught by 1 test(s): draw splits the fixture titles by the rule and is repeatable
B19 the run log records this machine's absolute wage-file path again                     caught by 2 test(s): a run on the repository's own data records only repository-r
B20 a hex escape in a title list is no longer decoded                                    caught by 1 test(s): parseTitles decodes the escapes Python writes, and refuses a
B21 a sample run may write anywhere inside the repository                                caught by 3 test(s): sample inputs may write inside this recipe's own runs folder
B22 any watchlist is treated as a committed sample                                       caught by 2 test(s): a watchlist that is not one of the committed samples is trea
B23 a missing Form D folder that was asked for is ignored                                caught by 2 test(s): an explicitly given Form D folder that is missing or empty i
B24 malformed persona YAML is no longer an input error                                   caught by 2 test(s): malformed persona YAML exits 2 with a message, not a stack t
B25 the two Form D "newer" classes are swapped                                           caught by 3 test(s): a full fixture run puts every company in the right bucket an
B26 a row with no usable name is dropped from the funnel without being counted           caught by 1 test(s): a row listing 0 approvals and 0 denials is held as unknown, 
B27 a skipped Proven or Likely company is explained as a Thin one                        caught by 1 test(s): the timeline gate multiplies through the real scorer: a part
B28 the stale-data refusal is switched off                                               caught by 1 test(s): named failure case F5: old data is refused without the ackno
B29 a rate exactly on the Proven bar is not Proven                                       caught by 1 test(s): tierFor: a count or rate exactly on a bar is on the higher s
B30 a rate exactly on the Likely bar is not Likely                                       caught by 1 test(s): tierFor: a count or rate exactly on a bar is on the higher s
B31 a count exactly on the Proven bar is not Proven                                      caught by 4 test(s): a full fixture run puts every company in the right bucket an
B32 the integrity check looks at the liveness gate only, not the timeline gate           caught by 1 test(s): the guard notices a timeline gate labelled as a record, not 
B33 the integrity check no longer notices the same role returned twice                   caught by 1 test(s): the guard notices the same role returned twice
B34 real data may no longer be written to private/                                       caught by 6 test(s): without --out-dir the output goes to private/tiers-run/<run 
B35 a closed timeline gate is explained as a small multiplier                            caught by 2 test(s): the timeline gate multiplies through the real scorer: a part
B36 name suffixes are stripped once, not repeatedly                                      caught by 1 test(s): normalizeName strips suffixes repeatedly, exactly as the Pyt
B37 paths are compared by their spelling, not by where they really are                   caught by 3 test(s): a real persona cannot write into a folder inside the reposit
B38 a folder whose name starts with two dots is taken to be outside the repository       caught by 3 test(s): a real persona cannot write into a folder inside the reposit
B39 a persona that does not need sponsorship is accepted                                 caught by 1 test(s): a persona that does not need sponsorship is refused: the rec
B40 a company table that is not the repository's is treated as a committed sample        caught by 2 test(s): a company table that is not the repository's own is treated 
B41 a negative record is described as a low rate                                         caught by 1 test(s): tierFor: a negative record is described as one, not as a low
B42 0 approvals and 0 denials becomes a Thin tier                                        caught by 2 test(s): a row listing 0 approvals and 0 denials is held as unknown, 
B43 a run that scored nothing leaves an earlier run's scorer files in place              caught by 1 test(s): a run that scored nothing removes the scorer files an earlie
B44 a stand-in scorer is reported as the repository's own                                caught by 1 test(s): a run made with a stand-in scorer says so in the run log, ga
B45 a timeline factor the scorer treats as closed does not close gate G3                 caught by 1 test(s): a timeline factor at or below the scorer's own closed-gate l
B46 a Form D record filed after the table's newest date is judged by its first-sale date caught by 3 test(s): a full fixture run puts every company in the right bucket an
B47 the title-list reader accepts separators Python never writes                         caught by 1 test(s): parseTitles accepts only the shape Python writes: items sepa
B48 "Member of Technical Staff" is counted as a senior title again                       caught by 1 test(s): levelNote tells a new graduate whether any matched title lac
B49 a company with several Form D records keeps only the last one's class                caught by 1 test(s): a full fixture run puts every company in the right bucket an
B50 the sponsorship term sent to the scorer is labelled a record again                   caught by 2 test(s): every field of every row has a declared label, every label s
B51 a watchlist with no names is accepted                                                caught by 1 test(s): a watchlist with no names is refused, and a name that is emp
B52 a role family name can be any property every object has                              caught by 1 test(s): usage errors: --help exits 0; an unknown flag, a bad number,
B53 an output folder that is a file is not noticed                                       caught by 1 test(s): an output folder that is a file, or cannot be written, is an
B54 the recorded command carries this machine's absolute paths                           caught by 1 test(s): outputs never carry this machine's folders, even when the in
B55 paths outside the repository are written in full into outputs                        caught by 2 test(s): outputs never carry this machine's folders, even when the in
B56 a label stops starting with one of the four kinds                                    caught by 1 test(s): every field of every row has a declared label, every label s
B57 a run without --out-dir writes into the tracked sample-run folder                    caught by 1 test(s): without --out-dir the output goes to private/tiers-run/<run 
B58 a Form D "folder" that is a file is not noticed                                      caught by 2 test(s): a Form D folder that is really a file is an input error nami
B59 a recent company already on the candidate's own list is dropped from the funnel without being counted caught by 8 test(s): a full fixture run puts every company in the right bucket an

59 of 59 deliberate breaks were caught by the tests
exit: 0
```

Four real problems came out of the harness work. An early 18-break version found that swapping the "Form D newer" and "older" labels went unnoticed, because the fixture held one of each and the test compared only totals; the test now checks each company. The guard-disabling break showed that a failing test could leave files in the repository; the test now cleans up. The first harness counted each failing test twice and, once, reported two breaks it had not applied as survivors; both are fixed. And the second review round predicted six further breaks the tests would miss (an exactly-on-the-bar rate, a mislabelled timeline gate, real data sent to `private/`, a closed gate explained as a multiplier, a suffix stripped once, a role returned twice); each was made a test, and each is in the list above.

## 5. The named failure cases, exercised

| # | Case | Evidence |
|---|---|---|
| F1 | A watchlist company is not in the table | the sample run: "Databriks Inc" and "Nonexistent Example Corp" come back not found (worked run, section 2.6); the fixture run |
| F2 | A company has no sponsorship record | the sample run: "011235813 INC" is held as unknown; a test asserts unknown companies never reach the scorer |
| F3 | The SOC code has no BLS row | the worked run, section 4.5 (`--soc 99-9999`); unit tests for a missing row, an unreadable median and a duplicate row |
| F4 | The authorization end date is already past | the worked run, section 2.4 (run date 2028-07-01: factor 0, all 71 Skip); unit and command-line tests |
| F5 | The table is more than 6 months old | the worked run, section 2.3: exit 3, nothing written |
| F6 | The scorer mis-reads the persona | the worked run, section 2.5 (Apply 0.446 against Skip 0.178); a wrong output file made for the test; a wrong stand-in scorer run end to end (exit 4); a crashing one (exit 5); a canary that reports the real defect is still present |
| F7 | A table column is renamed | a unit test and a command-line test (exit 2, names the column) |
| F8 | A posting has expired | not automated; `npm run ats:liveness` on the repository's example URL reported "expired, HTTP 404" (worked run, section 2.1) |
| F9 | Two table rows share a normalized name | the sample run: "3AM Innovations" comes back ambiguous with both candidates |
| F10 | A record or title list is unreadable | the fixture run: two companies held as data problems; a test that the title reader decodes what Python writes and refuses anything else |
| F11 | The persona file is not valid YAML | a unit test and a command-line test: exit 2 with a message, not a stack trace |
| F12 | The persona says it does not need sponsorship | the worked run, section 4.5: exit 2, nothing written; a command-line test |
| F13 | The output folder is a file, or cannot be written | command-line tests: exit 2 with a message, not a stack trace |
| F14 | A Form D folder is named but missing, empty or a file | command-line tests: exit 2, not a silent zero |
| F15 | The scorer file is not the repository's | a command-line test with a pass-through stand-in: the run completes, and the log, gate G2 and the top of the report all say the scorer was a stand-in |

The privacy guard is also exercised in the worked run (section 4.5): a real persona aimed at a tracked folder and at a folder named `..leak-demo` inside the repository is refused both times, and neither folder is created.

## 6. A clean checkout

The assignment asks for a run from a clean checkout of the branch. A fresh clone of the branch at the commit under test was made, dependencies installed with `npm ci`, the tests run, and the documented sample command run with the same arguments as the committed run. The committed outputs are then compared by asking git whether anything changed: it did not, so the run rewrote every tracked output with identical bytes. (The scorer stamps the day it ran, in UTC, into its own two files, so this holds on the day the committed run was made, which is when the check was done; on another day those two files differ by that date alone. After the push the same clone works from the GitHub address.)

```text
$ rm -rf /tmp/tiers-clean && git clone --quiet --branch contrib/2026fa-aravindkumar2504-preopt-swe-sponsor-tiers ~/Documents/03-School/info7375/the-reallocation-engine /tmp/tiers-clean && cd /tmp/tiers-clean && git log -1 --format='checked out: %h %s' && npm ci --silent 2>&1 | tail -1; node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail|skipped)'; node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30 2>&1; echo "--- git status --short in the fresh clone (empty means the run rewrote every tracked output with identical bytes):"; git status --short
checked out: 5d42dae Do not count the stale-run test as catching a break; fix an entry number in the sources page
ℹ tests 102
ℹ pass 102
ℹ fail 0
ℹ skipped 0
preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
  wrote course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md
--- git status --short in the fresh clone (empty means the run rewrote every tracked output with identical bytes):
```

The Canvas ZIP is made with `git archive`, leaving out `private/` as the assignment requires. An extract made the same way was given the same treatment. An earlier version of the recipe-paths test failed here, because the recipe and README name `private/`, which the ZIP leaves out; it now accepts that.

```text
$ rm -rf /tmp/tiers-zip && mkdir /tmp/tiers-zip && git archive --format=tar HEAD -- . ':(exclude)private' | tar -x -C /tmp/tiers-zip && cd /tmp/tiers-zip && ls -d private 2>&1; npm ci --silent 2>&1 | tail -1; node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail|skipped)'
ls: private: No such file or directory
ℹ tests 102
ℹ pass 101
ℹ fail 0
ℹ skipped 1
```

## 7. Broke during testing, fixed

- A gap in my own tests (the swapped Form D labels), found by the deliberate-break harness; fixed in the test.
- Wrong expected numbers in my own tests (a fixture count of 14 instead of 15, a run date that put an older persona before its clock started, a wrong discovery order, a variable typo); fixed in the tests, not the code.
- The break harness left files in the repository when the privacy guard was broken; the test now cleans up in a `finally` block, and the harness now works in a private copy.
- The run log recorded an absolute path from this machine (found by the first clean-checkout comparison, which differed only in `run-log.json`); outputs now record repository-relative paths, and only the last name for anything outside the repository, and a test guards against any machine path.
- The documented test command, `node --test <directory>`, recurses into every file on Node 20 and would have run the command-line program and the deliberately broken stand-ins as tests; it is an explicit `*.test.mjs` glob in the recipe, the card and the README.
- Everything in section 9, found by the independent reviews.

## 8. What the gates require a person to judge

Machines checked conformance; they cannot check adequacy. A person still has to:

1. **Gate H1.** Find a live backend posting for each company that advances and run `npm run ats:liveness -- <url>`.
2. **Gate H2.** Read each posting for U.S.-person or export-control wording, a no-sponsorship statement, a graduation window the candidate misses, and a start date earlier than the earliest legal start.
3. **The parameters.** Confirm or change each threshold in `params.json`, the title rule in `role-families.json`, and the persona's dates and 75-day assumption (then re-run the sample command into the committed folder; `checks.test.mjs` fails until the committed run is current).
4. **The unemployment ceiling and STEM eligibility.** These belong to the school's international office.
5. **The sample run's adequacy.** Read `report.md` and sign the "Human read" line in `logs/runs/2026fa-aravindkumar2504-1.md`. Until then, it says "not yet read".
6. **What the even counts mean,** and whether a count like the 2 reported approvals for a very large company means the table under-represents that company.

## 9. The independent reviews

Two rounds of review were made by separate assistant tasks before anything was pushed. Their reports are model output, so each claim was re-checked before acting on it. The first round was one read-only task started by the assistant (its model was not recorded); the second, asked for by the author, was three read-only Claude Code subagents on Claude Opus, working on a fresh copy of the committed branch (one traced every assignment requirement, one tried to break the code, one recomputed every number and checked every document). One of the three reports came with a notice that its automated safety review could not run; it was checked for instructions, none was found, and its findings were re-verified like the others. Every finding below was confirmed, and all but one were fixed.

### Round 1

| Finding | What was done |
|---|---|
| The first sample-run commit held an absolute path from the assistant's machine (it contains the author's username), and the later fix did not remove it from history | the local history was re-cut before anything was pushed (checked to be lossless: in four commits only one line of `run-log.json` differed from the old version, and from the next commit on every tree is identical); the path now appears in no commit on the branch |
| The assistant's own proposals were worded as the author's ("author-defined" parameters, "hand-labelled", "reviews the results", a sign-off "recorded") | reworded everywhere to "proposed by the assistant, not yet confirmed by the author" |
| "Same inputs, same bytes" is false for the scorer's own two files, which carry the date it ran | the claim now says the four files this program writes are identical for the same inputs into the same folder; a test masks the scorer's date |
| The privacy guard covered only real personas | it was widened (and in round 2 rebuilt again, below) |
| The title-list reader dropped the backslash in escapes (a non-breaking space became "xa0"); 526 records have a matching title, not 525 | the reader decodes exactly what Python writes; it agrees with `ast.literal_eval` on all 1,557 cells; the title check was redrawn and relabelled |
| The deliberate-break harness counted each failing test twice | it counts distinct tests, and stops with an error when a break cannot be applied |
| The report blamed "thin evidence" for Likely companies the timeline had demoted | it says the timeline factor multiplied the composite under the scorer's floor; a test asserts it |
| The recipe had no timeline formula | the formula is in the recipe |
| The recipe claims RUNNABLE-SAMPLE with nine open TODOs, while the repository's four other RUNNABLE-SAMPLE recipes have none | **Not changed.** The recipe states the comparison and how to lower the claim; the author decides |
| Malformed persona YAML gave a stack trace; a mistyped Form D folder reported zero silently | exit 2 with a message; an explicitly given missing folder is an error |

### Round 2

| Finding | What was done |
|---|---|
| The Canvas ZIP, which leaves out `private/`, failed 2 of the tests (they required `private/` to exist) | `private/` may be absent in the path test; a ZIP-style extract is now tested (section 6) |
| The privacy guard compared the spelling of paths: a folder named `..leak` inside the repository counted as outside it; symlinks, the macOS `/tmp` alias and letter case could also hide a location | paths are resolved to where they really are before any decision (`paths.mjs`, `guard.mjs`); each trick has a test, and the guard is tested alone |
| The guard looked only at the persona and the watchlist: a private company table, wage file or Form D folder could be written into a tracked folder | any input that is not a committed sample makes the run real-data |
| A persona that does not need sponsorship passed the persona check, and the report then gave a wrong reason for every Skip | such a persona is refused (exit 2) with the reason |
| The Form D check compared first-sale dates, but a table can only miss what was filed before it was made: RunBuggy and Gearflow were filed after the table's newest date, so only 1 of 14 matched companies (Composabl) is a real miss, not 3 of 15 | the check compares filing dates; two class names were renamed; the recipe, card, run log, domain justification, worked run and Frictional log were corrected |
| The funnel showed 67 where 68 records met its stated conditions (the uniqueness rule was applied before counting) | the funnel counts first and then shows what was left out (68, then 65 in the pool); a test checks that every record is accounted for exactly once |
| The sponsorship term sent to the scorer was labelled `record`, but its number is a fixed value per tier from `params.json`; the worked run labelled the composite `record`; some label entries started with none of the four kinds; run-level values had no labels; the report had no per-column labels | the term is `your-input`, the composite is "your-input (derived)", every label starts with a kind (a test checks), every run-level value is labelled, and the report says where each column comes from |
| The recipe and other documents said a missing gate value defaults to 1.0 labelled `record` | that is true of a missing liveness value only; a missing timeline value is labelled `your-input` (corrected everywhere; the change brief has a revision row) |
| Thin's value 0.3 was "chosen so the scorer files the row under Skip", which reads as hard-coding a verdict | the reasoning now says so openly: Thin is set aside by the recipe's own rule, 0.3 makes the scorer agree, and the scorer adds nothing to a Thin row |
| "Member of Technical Staff" was counted as a senior title (20 of 59, not 21, list only senior titles) | the senior marker excludes it; a test checks |
| A gate factor the scorer treats as closed (at or below 0.05) left gate G3 "partly open" and the report replaced the scorer's reason | G3 closes at the scorer's own line and the report says so |
| Records listing 0 approvals and 0 denials became Thin and a scorer Skip; rows named `N/A` entered the pool with duplicate role ids | the first are held as unknown; the second are never candidates, and are counted |
| A run that scored nothing left an earlier run's verdicts in its folder | the two scorer files are removed |
| A scorer file other than the repository's would pass the check without being named | the log, gate G2 and the top of the report name it |
| Outputs carried this machine's folders when inputs or the output were outside the repository; the recorded command echoed absolute paths | such paths are written as `<outside the repository>/name`; the command is rebuilt from the parsed options |
| Input and output problems (an output folder that is a file or read-only, a Form D "folder" that is a file, `--family constructor`, an empty watchlist) gave a stack trace or a silent result | each exits 2 with a message |
| The title-list reader accepted shapes Python never writes (`['A' 'B']`, `['A',, 'B']`) | it accepts only items separated by exactly a comma and a space; it still agrees with Python on every real cell |
| The tests left about 2,400 temporary folders behind; unused exports; a stale comment | the tests clean up after themselves; dead code and unused exports removed |
| The documented command wrote into the committed sample folder, and several documents used `--out-dir <folder>`, which a shell reads as a redirection | the documented command writes to `/tmp/tiers-run`; a bare run writes to the ignored `private/tiers-run`; every command in the documents is runnable as written |
| Several pasted blocks in the worked run had no command, came from scripts that were never committed, or were out of date; the break harness was a scratch script; the doctor output had lines removed | `checks.mjs` and `break-it.mjs` are committed; every block has the command that produced it; the doctor output is complete |
| The card was about two pages; the domain justification was borderline for one page | the card was cut by about 30 percent; the justification was kept to about 600 words while its time estimate and failure mode 2 were rewritten |
| The worked run, presentation notes and study notes put the assistant's work in the author's mouth ("I wrote it", "I also found") | rewritten; the change brief has a revision row saying "I" there is the assistant |
| The nearest existing recipe (`case-fullstack-swe-sponsor-triage.md`) was not cited; the persona file sits outside the four assigned locations and was not declared; the `ats:scan` step was left failing; the models of the review tasks were not named; the README named neither course nor assignment | the recipe and sources cite the three nearby drafts; the pull-request text declares the persona; `ats:scan` runs after copying the example file; the reviews' models are named; both READMEs fixed and a start-here README added |
| The Playwright download was reported as 94.7 MiB but was three parts of about 275 MiB (554 MB on disk) | corrected in the sources, the worked run and the Frictional log; the author can delete `~/Library/Caches/ms-playwright` |
| The worked-run attestation, reflection, raw-row check and clean-checkout run were done by the assistant, not the author ("yourself") | unchanged on purpose and disclosed: only the author can repeat them, and `SOURCES.md`, `FRICTIONAL.md` and this page say so |
| The author's side is incomplete: the Frictional log's own entries are short and the parameters are unconfirmed | unchanged on purpose. Only the author can do those |
