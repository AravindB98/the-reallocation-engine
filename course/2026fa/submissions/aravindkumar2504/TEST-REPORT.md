# Test report: pre-OPT backend sponsor tiers

## Executive summary

This report records how the prototype was tested: the toolchain before and after, the offline tests, the deliberate attempts to break it, each named failure case, a run from a clean checkout, what a person still has to judge, and what an independent review found. Everything below is pasted terminal output from the working session on 2026-09-30, scrubbed only of this machine's username and folder paths (each shown as `~`, `<scratch>` or `<folder>`) and of one third party's email address, which a package's own metadata contains (shown as `<redacted email>`). The short version: the prototype's 69 offline tests pass (on Node 26 and on Node 20), 28 of 28 deliberate code breaks are caught, a fresh checkout reproduces the sample run byte for byte, and the repository's history scan against the base is clean. An independent read-only audit of the branch found real problems, all listed in section 9 with what was done about each. The repository's working-tree scan and its continuous integration were already failing before any of this work, for reasons outside it, and that is shown too.

**Commit under test:** `bcaf960`. The code is final at `df52802` and the sample-run outputs at `e24059f`; `bcaf960` changed only the title check and two sentences about reproducibility. This report, the worked run, the Frictional log and the sources page were revised afterwards, in one more commit that changes only documents, the wording of one recipe row and the note text inside one test fixture. **Environment:** macOS; Node v26.10.0, and Node v20.20.2 (fetched through `npx`; nothing is installed system-wide) for the Node 20 run; Python 3.12.14 (used only for checks that compare against the repository's Python code); npm 11.19.1.

## 1. Toolchain baseline, before any change (repository commit 015843d)

`npm run doctor` passed:

```text
$ npm run doctor   (baseline, before any change; tools and summary sections)
ENVIRONMENT (required)
  ✓ node       v26.10.0
  ✓ python3    Python 3.12.14

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
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

## 2. Toolchain after (at commit bcaf960)

```text
$ npm run doctor
ENVIRONMENT (required)
  ✓ node       v26.10.0
  ✓ python3    Python 3.12.14

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
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
$ PATH=$PWD/.venv/bin:$PATH npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 180 files (88 md · 36 py · 45 js · 7 json · 4 sh)
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
$ node scripts/pii-scan.mjs   (working tree)
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <redacted email>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
exit: 1
```

The scan of the whole branch history against the base, which is what the continuous integration would run if it got that far, is clean:

```text
$ node scripts/pii-scan.mjs --diff upstream/main   (full branch history against the base)
pii-scan: clean ✓
exit: 0
```

Conformance on everything this work added:

```text
$ node scripts/conformance.mjs scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/ recipes/cases/2026fa search/examples/kiran-rao course/2026fa logs/runs
conformance: 37 files (13 md · 15 js · 8 json · 1 yaml)
✓ all conform (machine half of P4). Adequacy is still the human gate.
exit: 0
```

The contrib-scope rule of the CI (only namespaced paths, no protected paths), run locally with the same two patterns:

```text
$ (the contrib-scope CI step, run locally)
changed files: 41
protected-path hits:
  none
files outside the standard namespaces:
  none
```

`git diff --stat` against the base at this commit shows only namespaced paths (41 files). The worked run, this report, the Frictional log and the sources page are revised afterwards (see the note above on what that commit changes), all under `course/2026fa/submissions/aravindkumar2504/`:

```text
$ git diff --stat upstream/main...HEAD
 .../submissions/aravindkumar2504/CHANGE-BRIEF.md   |   94 +
 .../submissions/aravindkumar2504/FRICTIONAL.md     |   71 +
 .../2026fa/submissions/aravindkumar2504/SOURCES.md |   45 +
 .../submissions/aravindkumar2504/TEST-REPORT.md    |  440 ++
 .../aravindkumar2504/domain-justification.md       |   24 +
 .../aravindkumar2504/runs/2026-09-30/report.md     |  117 +
 .../runs/2026-09-30/role-scores.json               | 2579 ++++++++++
 .../runs/2026-09-30/role-scores.md                 |   81 +
 .../aravindkumar2504/runs/2026-09-30/roles.json    | 1422 ++++++
 .../aravindkumar2504/runs/2026-09-30/run-log.json  | 5316 ++++++++++++++++++++
 .../runs/2026-09-30/scorer-profile.json            |    3 +
 .../aravindkumar2504/title-matcher-check.md        |  118 +
 .../submissions/aravindkumar2504/worked-run.md     |  373 ++
 logs/runs/2026fa-aravindkumar2504-1.md             |   12 +
 ...avindkumar2504-preopt-swe-sponsor-tiers.card.md |   81 +
 .../aravindkumar2504-preopt-swe-sponsor-tiers.md   |  243 +
 .../README.md                                      |   94 +
 .../check-titles.mjs                               |   76 +
 .../check-titles.test.mjs                          |   31 +
 .../cli.test.mjs                                   |  364 ++
 .../evidence.mjs                                   |  355 ++
 .../evidence.test.mjs                              |  185 +
 .../fixtures/BROKEN-role-scorer-crashes.mjs        |    3 +
 .../BROKEN-role-scorer-misparses-profile.mjs       |   23 +
 .../fixtures/BROKEN-scorer-output.fixture.json     |   16 +
 .../fixtures/bls.fixture.csv                       |    6 +
 .../fixtures/companies.fixture.csv                 |   18 +
 .../fixtures/formd/fixture-quarter.json            |   97 +
 .../fixtures/watchlist.fixture.txt                 |   12 +
 .../params.json                                    |   33 +
 .../persona-and-scorer.test.mjs                    |  114 +
 .../persona.mjs                                    |   98 +
 .../preopt-sponsor-tiers.mjs                       |  400 ++
 .../recipe-paths.test.mjs                          |   78 +
 .../report.mjs                                     |  209 +
 .../role-families.json                             |   30 +
 .../sample-inputs/watchlist.txt                    |   29 +
 .../scorer-bridge.mjs                              |   96 +
 .../timeline.mjs                                   |  133 +
 .../timeline.test.mjs                              |   75 +
 search/examples/kiran-rao/profile.yml              |   38 +
 41 files changed, 13632 insertions(+)
```

## 3. The offline tests

69 tests, no network. The inputs are synthetic fixtures, the committed fictional persona, and the real scorer run as a command. Full output on Node 26:

```text
$ node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
✔ the seeded generator and sampler are repeatable, and the seed matters (0.633833ms)
✔ draw splits the fixture titles by the rule and is repeatable (0.976584ms)
✔ named failure case F5: old data is refused without the acknowledgement flag, and nothing is written (55.272875ms)
✔ a full fixture run puts every company in the right bucket and lets the real scorer decide the scored ones (110.672666ms)
✔ the four files this program writes are byte-identical when the same inputs are run twice (the scorer's own two files carry its date stamp) (291.340167ms)
✔ the timeline gate multiplies through the real scorer: a partly used buffer demotes, a closed gate zeroes (193.712459ms)
✔ an older persona with no explicit needs_sponsorship is refused with exit 2 (45.360917ms)
✔ an older persona runs when the missing values are supplied on the command line (recorded as command-line) (96.589125ms)
✔ named failure case F3: a SOC code with no BLS row still runs and says so; nothing is invented (96.382834ms)
✔ named failure case F7 through the command line: a renamed column exits 2 and names it (48.516791ms)
✔ a run with nothing to score still completes: empty scorer input, the scorer is skipped, both outputs exist (151.378709ms)
✔ the report shows only the requested number of discovered companies, but the log keeps all of them (100.230333ms)
✔ the report opens with the executive summary and the outputs carry no email or phone-looking text (104.800667ms)
✔ every field of every row has a declared label, and the run states it made no model judgments (100.435959ms)
✔ usage errors: --help exits 0; an unknown flag, a bad number, and an unknown family exit 2 (239.505959ms)
✔ named failure case F6 end to end: a scorer that mis-reads the persona aborts the run (exit 4) and leaves no outputs (115.318875ms)
✔ a scorer that crashes aborts the run with exit 5 and leaves no outputs (92.853583ms)
✔ a persona outside search/examples/ may not write into a tracked folder (exit 2), but may write outside the repo (155.946291ms)
✔ a committed fictional persona and the sample inputs are recorded as such in gate G1 (109.056584ms)
✔ a run on the repository's own data records only repository-relative paths, never this machine's (303.607583ms)
✔ sample inputs may write inside this recipe's own runs folder, and nowhere else inside the repository (137.890666ms)
✔ a watchlist that is not one of the committed samples is treated as real data (138.815875ms)
✔ an explicitly given Form D folder that is missing or empty is an error, not a silent zero (90.136458ms)
✔ malformed persona YAML exits 2 with a message, not a stack trace (43.761917ms)
✔ parseCsv handles quotes, doubled quotes, embedded commas and newlines, CRLF and a BOM (0.872208ms)
✔ parseCsv fails loudly on a ragged row or a truncated quote (0.17425ms)
✔ normalizeName ports the repo rule: strip legal suffixes, punctuation and case; null-like strings are empty (0.298333ms)
✔ parseTitles reads a Python list repr, including apostrophes and commas inside titles (0.099584ms)
✔ parseTitles decodes the escapes Python writes, and refuses any it cannot decode (0.15775ms)
✔ role family: backend-style titles match; testing, sales, frontend and management titles do not (0.771958ms)
✔ levelNote tells a new graduate whether any matched title lacks a senior marker (0.11075ms)
✔ tierFor: thresholds, small-sample caution, and the unscored role-type-unverified outcome (0.124542ms)
✔ sponsorshipRecord separates no-record, incomplete-record and record; checks the given rate (0.098542ms)
✔ toNumber never returns NaN (0.068959ms)
✔ fixture CSV loads; the data vintage is its newest funding date (1.091917ms)
✔ named failure case F7: schema drift stops the run and names the missing column (0.87225ms)
✔ name index flags an ambiguous name; the fixture pair collides (0.2525ms)
✔ fundingFacts measures recency against the data vintage, not the run date (0.1015ms)
✔ named failure case F3: a SOC code with no BLS row, an unreadable median, and a duplicate row are all "missing" with a reason (0.391917ms)
✔ wageComparison is plain arithmetic on two records (0.09225ms)
✔ Form D cross-check classifies every kind of pair and never compares an ambiguous name (0.484291ms)
✔ a missing Form D directory is reported as such, not treated as a failure (0.026709ms)
✔ splitTitles separates matched from unmatched titles (0.042708ms)
  canary: with the older persona wording the scorer reports profile_needs_sponsorship=false (defect still present: the guard is needed)
✔ the committed fictional persona passes gate G1 and keeps dates as strings (3.506292ms)
✔ the persona result carries no contact details (0.737791ms)
✔ a persona with missing fields fails once, naming every problem, and invents no default (0.421417ms)
✔ malformed YAML is an input error (exit 2 at the command line), not a stack trace (0.505917ms)
✔ an older persona with no explicit needs_sponsorship is refused rather than guessed (0.608458ms)
✔ command-line values fill what an older persona lacks, and are recorded as such (0.428833ms)
✔ the scorer profile text is chosen so the scorer reads it correctly in both directions (86.493125ms)
✔ named failure case F6: the guard notices a scorer that mis-reads the persona or labels a placeholder as a record (0.195416ms)
✔ the guard notices a missing or extra role and an override this run never supplied (0.096834ms)
✔ KNOWN-DEFECT CANARY (informational): report whether the real scorer still mis-reads the older persona wording (41.486708ms)
✔ every repository path named in aravindkumar2504-preopt-swe-sponsor-tiers.md exists (1.76575ms)
✔ every repository path named in aravindkumar2504-preopt-swe-sponsor-tiers.card.md exists (0.230333ms)
✔ every repository path named in README.md exists (0.18025ms)
✔ the recipe declares as many open TODOs as its body contains (0.126292ms)
✔ the recipe claims no stage above RUNNABLE-SAMPLE and leaves the attestation null (0.134458ms)
✔ the reader-created example paths are never tracked by git (they may exist untracked on a reader's machine) (18.798208ms)
✔ dates round-trip and reject impossible calendar dates (1.711292ms)
✔ before authorization starts the clock has not started: factor 1 and zero days accrued (0.135833ms)
✔ once authorization has begun, a slow process eats the buffer (factor between 0 and 1) (0.069709ms)
✔ unemployment days already used count against the ceiling (0.049625ms)
✔ boundaries: slack equal to the buffer is fully open; slack of zero is closed (0.061459ms)
✔ named failure case F4: an authorization end date already in the past closes the gate (0.039583ms)
✔ a start that lands after the authorization end closes the gate even with days to spare (0.03775ms)
✔ an OPT-year-one candidate with 34 of 90 days used and a slow process is closed (the older persona's note) (0.062708ms)
✔ bad inputs are rejected, never repaired (0.092875ms)
✔ a zero buffer means any positive slack is fully open (0.070125ms)
ℹ tests 69
ℹ suites 0
ℹ pass 69
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2889.459292
```

The same suite and the sample command under Node 20, the repository's stated minimum and its CI version (Node 20 prints its summary in TAP format). The sample run wrote the same bytes as Node 26:

```text
$ npx -y node@20 -e "console.log(process.version, process.platform, process.arch)"   (fetches Node 20 into npm's cache; nothing is installed system-wide)
v20.20.2 darwin arm64

$ npx -y node@20 --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs   (Node 20 prints TAP-format summary lines)
# tests 69
# suites 0
# pass 69
# fail 0
# cancelled 0
# skipped 0
# todo 0
exit code: 0

$ npx -y node@20 <the documented sample run, same arguments, into the committed folder>
preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
$ git status --short      (empty = Node 20 wrote the same bytes as Node 26)
(no output)
```

What they cover, by file:

| File | What it checks |
|---|---|
| `timeline.test.mjs` | the timeline gate: open before the clock starts, buffer partly used, ceiling reached, authorization ended, boundaries, bad inputs |
| `evidence.test.mjs` | the CSV parser; the name rule; the title-list reader, including the escapes Python writes; the role family rule; the tiers and their small-sample caution; funding against the data's own vintage; the wage comparison; schema drift; the Form D cross-check company by company |
| `persona-and-scorer.test.mjs` | the persona check (no defaults, no contact details, malformed YAML); the scorer profile in both directions; the integrity guard against a wrong output; a canary that reports whether the real scorer defect is still present (informational: it cannot fail on the defect) |
| `cli.test.mjs` | end-to-end runs on fixtures: every bucket; unknown companies never sent to the scorer; repeat runs identical for the four files this program writes; the timeline gate through the real scorer, and the report's reason for a timeline demotion; older personas; a missing wage row; a renamed column; nothing to score; the report limit; plain-language summary and no email or phone text; every row field has a declared label; usage errors; wrong and crashing stand-in scorers; the privacy guard (a real persona, a watchlist that is not a committed sample, and a sample run aimed at another tracked folder); a missing Form D folder; malformed persona YAML; no machine paths in the outputs |
| `check-titles.test.mjs` | the seeded title sampler is repeatable |
| `recipe-paths.test.mjs` | every repository path the recipe, card and README name exists; the open-TODO count matches; no stage above RUNNABLE-SAMPLE is claimed |

## 4. Deliberate attempts to break it

A throwaway harness copies the prototype folder, applies one deliberate break, runs the suite, and records which tests fail. It counts distinct failing tests, and stops with an error if a break cannot be applied. It was run against the green suite at the commit under test (the break numbers are labels, not a count; there is no M13):

```text
M01 Proven needs only 2 approvals                              killed by 3 test(s): a full fixture run puts every company in the right bucket and lets the
M02 timeline ignores an already-ended authorization            killed by 2 test(s): the timeline gate multiplies through the real scorer: a partly used bu
M03 unemployment clock starts today even before authorization  killed by 3 test(s): a full fixture run puts every company in the right bucket and lets the
M04 timeline forgets days already used                         killed by 3 test(s): an older persona runs when the missing values are supplied on the comm
M05 unknown companies are sent to the scorer                   killed by 6 test(s): a full fixture run puts every company in the right bucket and lets the
M06 scorer profile uses the trap wording                       killed by 15 test(s): a full fixture run puts every company in the right bucket and lets the
M07 the integrity guard call is removed from the run           killed by 1 test(s): named failure case F6 end to end: a scorer that mis-reads the persona 
M08 the legal suffix "inc" is no longer stripped               killed by 5 test(s): a full fixture run puts every company in the right bucket and lets the
M09 data vintage uses the OLDEST funding date                  killed by 17 test(s): a full fixture run puts every company in the right bucket and lets the
M10 Likely accepts EITHER count or rate                        killed by 2 test(s): a full fixture run puts every company in the right bucket and lets the
M11 the discovery pool ignores the funding window              killed by 1 test(s): the report shows only the requested number of discovered companies, bu
M12 the report loses its executive summary heading             killed by 1 test(s): the report opens with the executive summary and the outputs carry no e
M14 the liveness placeholder is labelled a record              killed by 15 test(s): a full fixture run puts every company in the right bucket and lets the
M15 the needs_sponsorship type check is removed                killed by 3 test(s): an older persona with no explicit needs_sponsorship is refused with ex
M16 a small sample can still be Proven (rate only)             killed by 3 test(s): a full fixture run puts every company in the right bucket and lets the
M17 ambiguous watchlist names resolve to the first match       killed by 1 test(s): a full fixture run puts every company in the right bucket and lets the
M19 the real-persona privacy guard is disabled                 killed by 2 test(s): a persona outside search/examples/ may not write into a tracked folder
M20 the title sampler counts unreadable lists as readable      killed by 1 test(s): draw splits the fixture titles by the rule and is repeatable
M21 the run log records this machine's absolute BLS path again killed by 1 test(s): a run on the repository's own data records only repository-relative pa
M22 a hex escape in a title list is no longer decoded          killed by 1 test(s): parseTitles decodes the escapes Python writes, and refuses any it cann
M23 a sample run may write anywhere inside the repository      killed by 1 test(s): sample inputs may write inside this recipe's own runs folder, and nowh
M24 any watchlist is treated as a committed sample             killed by 1 test(s): a watchlist that is not one of the committed samples is treated as rea
M25 a missing explicit Form D folder is ignored                killed by 1 test(s): an explicitly given Form D folder that is missing or empty is an error
M26 malformed persona YAML is no longer an input error         killed by 2 test(s): malformed persona YAML exits 2 with a message, not a stack trace
M27 the two kinds of "newer" Form D classes are swapped        killed by 1 test(s): Form D cross-check classifies every kind of pair and never compares an
M28 the funnel count of recently funded matches is wrong       killed by 1 test(s): a full fixture run puts every company in the right bucket and lets the
M29 a skipped Proven or Likely company is explained as a Thin one killed by 1 test(s): the timeline gate multiplies through the real scorer: a partly used bu
M18 the stale-data refusal is disabled                         killed by 1 test(s): named failure case F5: old data is refused without the acknowledgement

28 of 28 deliberate breaks were caught by the tests
```

Three real problems came out of the harness work. An early 18-break version found that swapping the "Form D newer" and "older" labels went unnoticed, because the fixture held one of each and the test compared only totals; the test now checks each company. The guard-disabling break showed that a failing test could leave files in the repository; the test now cleans up. And the independent review found that the harness counted each failing test twice, so the "killed by N tests" figures in its earlier output were inflated; it now counts distinct tests, and the figures above are those counts. The harness is a scratch script, not committed.

## 5. The named failure cases, exercised

| # | Case | Evidence |
|---|---|---|
| F1 | A watchlist company is not in the table | the sample run: "Databriks Inc" and "Nonexistent Example Corp" come back not found; the fixture run |
| F2 | A company has no sponsorship record | the sample run: "011235813 INC" is held as unknown; a test asserts unknown companies never reach the scorer |
| F3 | The SOC code has no BLS row | the worked run, section 4.5 (`--soc 99-9999`); unit tests for a missing row, an unreadable median and a duplicate row |
| F4 | The authorization end date is already past | the worked run, section 2.4 (run date 2028-07-01: factor 0, all 71 Skip); unit and command-line tests |
| F5 | The table is more than 6 months old | the worked run, section 2.3: exit 3, nothing written |
| F6 | The scorer mis-reads the persona | the worked run, section 2.5 (Apply 0.446 against Skip 0.178); a wrong output made for the test; a wrong stand-in scorer run end to end (exit 4); a crashing one (exit 5); a canary that reports the real defect is still present |
| F7 | A table column is renamed | a unit test and a command-line test (exit 2, names the column) |
| F8 | A posting has expired | not automated; `npm run ats:liveness` on the repository's example URL reported "expired, HTTP 404" (worked run, section 2.1) |
| F9 | Two table rows share a normalized name | the sample run: "3AM Innovations" comes back ambiguous with both candidates |
| F10 | A record or title list is unreadable | the fixture run: two companies held as data problems; a test that the title reader decodes what Python writes and refuses anything else |
| F11 | The persona file is not valid YAML | a unit test and a command-line test: exit 2 with a message, not a stack trace |

## 6. A clean checkout

The assignment asks for a run from a clean checkout of the branch. A fresh clone of the branch at this commit was made, dependencies installed with `npm ci`, the tests run, and the documented sample command run with the same arguments as the committed run. The six output files are byte-identical to the committed ones, and the fresh checkout's git status is clean afterwards. (The scorer stamps the day it ran into its own two files, so this holds on the day the committed run was made, which is when the check was done; on another day those two files differ by that date alone.)

```text
$ git clone --branch contrib/2026fa-aravindkumar2504-preopt-swe-sponsor-tiers <local repository> <temporary folder>   (a fresh checkout of the branch)
checked out: bcaf960 Redraw and relabel the title check after the parser fix; state reproducibility exactly

$ npm ci   (last line)
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.

$ node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs   (summary)
ℹ tests 69
ℹ pass 69
ℹ fail 0
ℹ skipped 0

$ the documented sample run, same arguments as the committed run
preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.1 months old (accepted)
  wrote course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md

=== byte comparison with the committed outputs
identical  report.md
identical  run-log.json
identical  roles.json
identical  scorer-profile.json
identical  role-scores.json
identical  role-scores.md

=== git status in the fresh checkout after the run
(empty = the run rewrote the tracked outputs with identical bytes)
```

An earlier run of this same check found `run-log.json` different, because it held an absolute path from this machine; that is the defect listed below, now fixed.

## 7. Broke during testing, fixed

- A gap in my own tests (the swapped Form D labels), found by the deliberate-break harness; fixed in the test.
- Wrong expected numbers in my own tests (a fixture count of 14 instead of 15, a run date that put an older persona before its clock started, a wrong discovery order, a variable typo); fixed in the tests, not the code.
- The break harness left files in the repository when the privacy guard was broken; the test now cleans up in a `finally` block.
- The run log recorded an absolute path from this machine (found by the clean-checkout comparison, which differed only in `run-log.json`); it now records repository-relative paths, a test guards against any machine path in the outputs, and the sample run was regenerated.
- The documented test command, `node --test <directory>`, recurses into every file on Node 20 and would have run the command-line program and the deliberately broken stand-ins as tests; it is now an explicit `*.test.mjs` glob in the recipe, the card and the README.
- Everything in section 9, found by the independent review.

## 8. What the gates require a person to judge

Machines checked conformance; they cannot check adequacy. A person still has to:

1. **Gate H1.** Find a live backend posting for each company that advances and run `npm run ats:liveness -- <url>`.
2. **Gate H2.** Read each posting for U.S.-person or export-control wording, a no-sponsorship statement, a graduation window the candidate misses, and a start date earlier than the earliest legal start.
3. **The parameters.** Confirm or change each threshold in `params.json`, the title rule in `role-families.json`, and the persona's dates and 75-day assumption.
4. **The unemployment ceiling and STEM eligibility.** These belong to the school's international office.
5. **The sample run's adequacy.** Read `report.md` and sign the "Human read" line in `logs/runs/2026fa-aravindkumar2504-1.md`. Until then, it says "not yet read".
6. **What the even counts mean,** and whether a count like the 2 reported approvals for a very large company means the table under-represents that company.

## 9. The independent review

Before anything was handed to the author, a second, read-only assistant task audited the branch. Its report is model output, so each claim was re-checked before acting on it. Every finding below was confirmed, and all but one were fixed.

| Finding | What was done |
|---|---|
| The first sample-run commit held an absolute path from the assistant's machine (it contains the author's username), and the later fix did not remove it from history | the local history was re-cut before anything was pushed (checked to be lossless: in four commits only one line of `run-log.json` differed from the old version, and from the next commit on every tree is identical); the path now appears in no commit on the branch |
| The assistant's own proposals were worded as the author's ("author-defined" parameters, "hand-labelled", "reviews the results", a sign-off "recorded") | reworded everywhere to "proposed by the assistant, not yet confirmed by the author"; the label dictionary and the report say so |
| "Same inputs, same bytes" is false for the scorer's own two files, which carry the date it ran | the claim now says the four files this program writes are identical for the same inputs into the same folder, and that the scorer's two files carry a date; a test masks that date |
| The privacy guard covered only real personas: a sample run could overwrite any tracked file, and a private watchlist was accepted | a run is now confined to the recipe's own runs folder, `private/`, or a place outside the repository, and a watchlist that is not a committed sample is treated as real data; each rule has a test |
| The title-list reader dropped the backslash in escapes (a non-breaking space became "xa0"); 526 records have a matching title, not 525 | the reader now decodes exactly what Python writes and refuses anything else; it agrees with Python's `ast.literal_eval` on all 1,557 cells; the title check was redrawn and relabelled |
| The deliberate-break harness counted each failing test twice | it counts distinct tests, and stops with an error when a break cannot be applied (before, a break that had not been applied could be reported as a survivor) |
| The report blamed "thin evidence" for Likely companies the timeline had demoted | it now says the timeline factor multiplied the composite under the scorer's floor; a test asserts it |
| The recipe had no timeline formula | the formula is in the recipe (proposed by the assistant, not yet confirmed) |
| The recipe claims RUNNABLE-SAMPLE with nine open TODOs, while the repository's four other RUNNABLE-SAMPLE recipes have none | **Not changed.** The recipe states the comparison; the author decides whether to keep the stage or lower it |
| The funnel showed 65 where 67 companies met the stated condition, and "the table's funding lags for 6 of 15 pairs" lumped real misses with filings made after the snapshot | the funnel shows both numbers; the Form D check now separates 3 real misses from 3 first sales after the snapshot's newest date |
| Malformed persona YAML gave a stack trace; a mistyped Form D folder reported zero silently; the recipe required a field the code never used (`stem_eligible`) | exit 2 with a message; an explicitly given missing folder is an error; the unused requirement was dropped |
| A watchlist pick was described as "first in file order" although Databricks was chosen by the assistant | the descriptions now say which names came from the fixed rule |
| The author's side is incomplete: the Frictional log's own entries, the sources page's confirmations, and the AI policy unread | unchanged on purpose. Only the author can write them |
