# Test report — co-op sponsor check prototype

## Executive summary

This report records how the prototype was tested. It covers the repository health checks before and after adding it, the real sample run, each named failure case, a run from a fresh copy of the branch, and which changes the work makes to the repository. The repository's checks pass the same before and after. The prototype's 17 offline tests pass in a fresh clone. Every named failure case stops or fails closed instead of inventing a value. A clean checkout of the pushed branch, cloned from GitHub, produces the same output.

---

## Environment

- macOS (Darwin 25.6.0), Node v25.8.2, Python 3.9 (system `/usr/bin/python3`)
- Fork `arundhatik26/the-reallocation-engine`, base commit `015843d`, branch `contrib/2026fa-arundhatik26-coop-sponsor-swe-15-1252`
- `npm install` run once; `npx playwright install chromium` run once (needed by `ats:liveness`)

## 1. Toolchain baseline: before

```text
$ npm run doctor   (tail)
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

```text
$ npm run verify
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

## 2. Engine smoke runs (setup step)

```text
$ npm run ats:scan -- --dry-run
> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
```

The scan fails without a private `data/ats/portals.yml`. Re-run with the shipped example config, without creating a private file (last lines shown):

```text
$ REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml npm run ats:scan -- --dry-run
  + Databricks | Strategic Account Executive - Retail vertical  | Remote - California
  + Databricks | Strategy & Execution Manager — Retail | United States

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
```

```text
> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/arundhatik26/runs

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/arundhatik26/runs/role-scores.json  +  course/2026fa/submissions/arundhatik26/runs/role-scores.md
```

The Chapter 11 example skips 40%, below the "healthy run skips half" rule. Its output was moved from `runs/` into `runs/setup-ch11/`.

## 3. The real sample run

See [WORKED-RUN.md](WORKED-RUN.md) §2 for the full pasted output. Outputs are in `runs/sample/`: `report.md`, `run-log.json`, and per scenario `roles.json`, `role-scores.json`, `role-scores.md`.

## 4. Each failure case exercised

| # | Case | How exercised | Result |
|---|---|---|---|
| F1 | Company not in CSV | sample run (JPMorgan Chase); test `test_F1_not_in_dataset_is_unknown_not_zero` | `not-in-dataset`; no `p` sent to the scorer; NETWORK |
| F2 | Row exists, sponsorship blank | sample run (Visa); test `test_F2_blank_approvals_is_no_record` | `no-sponsorship-record`; NETWORK |
| F3 | Same company, two names / repeated name | sample run (SoFi); test `test_F3_two_rows_same_name_is_ambiguous` | `ambiguous`; HUMAN CHECK (G2) |
| F4 | Sponsors, but not software | test `test_F4_tiers` | tier `Possible`, `software_titles: []` |
| F5 | Co-op after graduation / graduation past | sample run (Stripe); tests `test_F5_…`, `test_graduation_already_past` | timeline closed → Skip for that scenario; DEPENDS ON GRADUATION DATE |
| F6 | Posting dead / uncertain / unchecked | sample run (fake Databricks id, BNY); test `test_F6_…` | factor 0 → Skip (gated); NETWORK, DON'T APPLY YET |
| extra | Substring name trap ("MELLON", "ACME") | break 4 in WORKED-RUN; test `test_substring_does_not_match` | no false match |
| extra | Bad input (fit 1.7, non-ISO date, missing CSV) | breaks 1–3 in WORKED-RUN; `Units` tests | `✗ stopped: …`, exit 2, nothing written |
| extra | SOC with no BLS row | test `test_unknown_soc_has_no_wage` | `no-occupation-row`, no wage value |

## 5. Fresh-clone run

My fork was cloned into a scratch directory, the branch was checked out, **only my new files** were copied in (the generated `runs/sample/` was excluded), `npm install` was run, and then the documented command and the tests:

```text
$ python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py
[grad-dec-2027] ✓ scored 7 roles → Apply 1 · Consider 2 · Skip 4 (skip 57%)
[grad-apr-2028] ✓ scored 7 roles → Apply 2 · Consider 2 · Skip 3 (skip 43%)
  bny-fullstack-coop           matched                liveness=unchecked  → NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting
  databricks-swe-intern-winter matched                liveness=active     → TAILOR APPLICATION
  databricks-fake-posting      matched                liveness=uncertain  → NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting
  jpmc-swe-coop                not-in-dataset         liveness=manual-active → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  visa-swe-coop                no-sponsorship-record  liveness=manual-active → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  sofi-swe-coop                ambiguous              liveness=manual-active → HUMAN CHECK (G2): pick the right CSV row before trusting anything below
  stripe-late-coop             matched                liveness=manual-active → DEPENDS ON GRADUATION DATE: Skip if grad-dec-2027, Apply if grad-apr-2028 — settle your co-op/graduation plan before tailoring
✓ wrote course/2026fa/submissions/arundhatik26/runs/sample/run-log.json + report.md
exit 0

$ python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests -v
test_F1_not_in_dataset_is_unknown_not_zero (test_coop_sponsor_check.FullRun) ... ok
test_F2_blank_approvals_is_no_record (test_coop_sponsor_check.FullRun) ... ok
test_F3_two_rows_same_name_is_ambiguous (test_coop_sponsor_check.FullRun) ... ok
test_F4_tiers (test_coop_sponsor_check.FullRun) ... ok
test_F5_coop_after_graduation_closes_timeline (test_coop_sponsor_check.FullRun) ... ok
test_F6_liveness_dead_uncertain_unchecked_all_close (test_coop_sponsor_check.FullRun) ... ok
test_both_outputs_written (test_coop_sponsor_check.FullRun) ... ok
test_every_scorer_term_is_labeled (test_coop_sponsor_check.FullRun) ... ok
test_inputs_are_hashed (test_coop_sponsor_check.FullRun) ... ok
test_proven_live_role_applies (test_coop_sponsor_check.FullRun) ... ok
test_substring_does_not_match (test_coop_sponsor_check.FullRun) ... ok
test_unknown_soc_has_no_wage (test_coop_sponsor_check.FullRun) ... ok
test_bad_date_stops (test_coop_sponsor_check.Units) ... ok
test_bad_fit_stops (test_coop_sponsor_check.Units) ... ok
test_graduation_already_past (test_coop_sponsor_check.Units) ... ok
test_missing_csv_stops (test_coop_sponsor_check.Units) ... ok
test_norm_name (test_coop_sponsor_check.Units) ... ok

----------------------------------------------------------------------
Ran 17 tests in 0.091s

OK
exit 0
```

The next action for every role in the fresh-clone run was identical to the working copy (compared with `diff`).

**Clean checkout of the pushed branch, from GitHub** (2026-10-03, after the initial commit `8bb1db2` was pushed). Cloned from `https://github.com/arundhatik26/the-reallocation-engine.git` into an empty scratch directory:

```text
$ git clone -b contrib/2026fa-arundhatik26-coop-sponsor-swe-15-1252 https://github.com/arundhatik26/the-reallocation-engine.git && cd the-reallocation-engine && npm install
$ git log -1 --format=%h
8bb1db2
$ python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py
[grad-dec-2027] ✓ scored 7 roles → Apply 1 · Consider 2 · Skip 4 (skip 57%)
[grad-apr-2028] ✓ scored 7 roles → Apply 2 · Consider 2 · Skip 3 (skip 43%)
  bny-fullstack-coop           matched                liveness=unchecked  → NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting
  databricks-swe-intern-winter matched                liveness=active     → TAILOR APPLICATION
  databricks-fake-posting      matched                liveness=uncertain  → NETWORK, DON'T APPLY YET: strong software sponsor, but no confirmed live posting
  jpmc-swe-coop                not-in-dataset         liveness=manual-active → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  visa-swe-coop                no-sponsorship-record  liveness=manual-active → NETWORK: sponsorship for software roles is unverified here — ask an alum or recruiter directly
  sofi-swe-coop                ambiguous              liveness=manual-active → HUMAN CHECK (G2): pick the right CSV row before trusting anything below
  stripe-late-coop             matched                liveness=manual-active → DEPENDS ON GRADUATION DATE: Skip if grad-dec-2027, Apply if grad-apr-2028 — settle your co-op/graduation plan before tailoring
✓ wrote course/2026fa/submissions/arundhatik26/runs/sample/run-log.json + report.md
exit 0
$ python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests
Ran 17 tests in 0.093s

OK
$ node scripts/conformance.mjs scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/
conformance: 5 files (1 md · 2 py · 2 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

The output is identical to the worked run. The final commit adds only the student's answers, the threshold change (50 → 100, which changes no output) and these report updates.

## 6. Toolchain baseline: after

```text
$ npm run doctor   (tail)
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

```text
$ npm run verify
> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 165 files (88 md · 38 py · 30 js · 5 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

```text
$ node scripts/conformance.mjs scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/
conformance: 5 files (1 md · 2 py · 2 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

```text
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <address redacted>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
```

The one PII finding is in `package-lock.json` (the address is redacted in the pasted output above, so that this report does not trip the scanner itself; the real output names it), a file this work does **not** change (`git diff --stat` is empty for tracked files). The address is an npm package author's, and it is present on `main` at `015843d`. None of my files produce a finding; the only email addresses in them are `@example.com`.

## 7. What the change touches

`git diff --stat` covers tracked files only, and it is **empty**: no existing file was modified. All changes are new, untracked files in my namespaces:

```text
$ git status --short --untracked-files=all
?? course/2026fa/submissions/arundhatik26/CHANGE-BRIEF.md
?? course/2026fa/submissions/arundhatik26/DOMAIN-JUSTIFICATION.md
?? course/2026fa/submissions/arundhatik26/FRICTIONAL.md
?? course/2026fa/submissions/arundhatik26/SOURCES.md
?? course/2026fa/submissions/arundhatik26/SUBMISSION.md
?? course/2026fa/submissions/arundhatik26/TEST-REPORT.md
?? course/2026fa/submissions/arundhatik26/WORKED-RUN.md
?? course/2026fa/submissions/arundhatik26/runs/sample/grad-apr-2028/role-scores.json
?? course/2026fa/submissions/arundhatik26/runs/sample/grad-apr-2028/role-scores.md
?? course/2026fa/submissions/arundhatik26/runs/sample/grad-apr-2028/roles.json
?? course/2026fa/submissions/arundhatik26/runs/sample/grad-dec-2027/role-scores.json
?? course/2026fa/submissions/arundhatik26/runs/sample/grad-dec-2027/role-scores.md
?? course/2026fa/submissions/arundhatik26/runs/sample/grad-dec-2027/roles.json
?? course/2026fa/submissions/arundhatik26/runs/sample/report.md
?? course/2026fa/submissions/arundhatik26/runs/sample/run-log.json
?? course/2026fa/submissions/arundhatik26/runs/setup-ch11/role-scores.json
?? course/2026fa/submissions/arundhatik26/runs/setup-ch11/role-scores.md
?? logs/runs/2026fa-arundhatik26-1.md
?? recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.card.md
?? recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.md
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/README.md
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/inputs/liveness-2026-10-02.txt
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/inputs/sample-persona.json
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/fixtures/bls-fixture.csv
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/fixtures/liveness-fixture.txt
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/fixtures/persona-fixture.json
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/fixtures/sponsors-fixture.csv
?? scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/test_coop_sponsor_check.py
```

Every path is under `scripts/contrib/2026fa/arundhatik26-…/`, `recipes/cases/2026fa/arundhatik26-…`, `logs/runs/2026fa-arundhatik26-1.md`, or `course/2026fa/submissions/arundhatik26/`. None of `logs/RUN_LOG.md`, `package.json` or another student's folder is touched. Diff against `main`, every changed path (taken before the final commit, so it shows exactly what that commit will contain):

```text
$ git diff --stat origin/main   (working tree vs main, i.e. what the final commit will contain)
 course/2026fa/submissions/arundhatik26/CHANGE-BRIEF.md                                           |   81 +++++
 course/2026fa/submissions/arundhatik26/DOMAIN-JUSTIFICATION.md                                   |   39 +++
 course/2026fa/submissions/arundhatik26/FRICTIONAL.md                                             |   76 +++++
 course/2026fa/submissions/arundhatik26/SOURCES.md                                                |   49 +++
 course/2026fa/submissions/arundhatik26/SUBMISSION.md                                             |   26 ++
 course/2026fa/submissions/arundhatik26/TEST-REPORT.md                                            |  272 ++++++++++++++++
 course/2026fa/submissions/arundhatik26/WORKED-RUN.md                                             |  236 ++++++++++++++
 course/2026fa/submissions/arundhatik26/runs/sample/grad-apr-2028/role-scores.json                |  303 +++++++++++++++++
 course/2026fa/submissions/arundhatik26/runs/sample/grad-apr-2028/role-scores.md                  |   17 +
 course/2026fa/submissions/arundhatik26/runs/sample/grad-apr-2028/roles.json                      |  153 +++++++++
 course/2026fa/submissions/arundhatik26/runs/sample/grad-dec-2027/role-scores.json                |  303 +++++++++++++++++
 course/2026fa/submissions/arundhatik26/runs/sample/grad-dec-2027/role-scores.md                  |   17 +
 course/2026fa/submissions/arundhatik26/runs/sample/grad-dec-2027/roles.json                      |  153 +++++++++
 course/2026fa/submissions/arundhatik26/runs/sample/report.md                                     |   64 ++++
 course/2026fa/submissions/arundhatik26/runs/sample/run-log.json                                  | 1685 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 course/2026fa/submissions/arundhatik26/runs/setup-ch11/role-scores.json                          |  241 ++++++++++++++
 course/2026fa/submissions/arundhatik26/runs/setup-ch11/role-scores.md                            |   15 +
 logs/runs/2026fa-arundhatik26-1.md                                                               |    9 +
 recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.card.md                               |   72 ++++
 recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.md                                    |  209 ++++++++++++
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/README.md                           |   47 +++
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py               |  526 ++++++++++++++++++++++++++++++
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/inputs/liveness-2026-10-02.txt      |   11 +
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/inputs/sample-persona.json          |   51 +++
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/fixtures/bls-fixture.csv      |    2 +
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/fixtures/liveness-fixture.txt |    8 +
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/fixtures/persona-fixture.json |   39 +++
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/fixtures/sponsors-fixture.csv |    8 +
 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests/test_coop_sponsor_check.py    |  161 +++++++++
 29 files changed, 4873 insertions(+)
```

## 8. What the gates require a human to judge

- **G2:** for BNY Mellon (CSV line 3036), Databricks and Stripe, is the matched row really the employer? For SoFi, which of the two rows, if either?
- **G3:** BNY Mellon's posting was never machine-checked (Workday). A human must open it.
- **G4:** which graduation scenario is real (December 2027 or April 2028)? Stripe's result depends on it.
- **G5:** apply, network or skip. The prototype only recommends.
- **The tier rule:** the student set the threshold to 100 on 2026-10-03 (re-run output identical). The 0.3 probability is still an open `[TODO: DEFINE]`.
