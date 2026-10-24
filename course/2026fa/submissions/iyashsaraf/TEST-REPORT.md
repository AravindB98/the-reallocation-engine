# TEST-REPORT — swe-ai-devops-sponsor-triage

## Executive summary

This report records every check run against the prototype in
`scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/`: the
toolchain baseline before and after the change, the real run against the full
30k-row dataset, the named failure cases exercised with real output, the
offline test suite, and a scope check confirming nothing outside this student's
namespace was touched. It was re-run on 2026-10-14, after grading feedback, when
the prototype stopped inventing a liveness value: roles whose posting was not
checked are now held out of the scorer.

## Toolchain baseline

### Before (on `main`, before any of this student's files existed)

```
$ npm run doctor
ENVIRONMENT (required)
  ✓ node       v24.10.0
  ✓ python3    Python 3.13.5
...
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue

$ npm run verify
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

Note: `manifest-check.mjs` calls system `python3 -c "import yaml..."` directly
and initially failed with `ModuleNotFoundError: No module named 'yaml'` — a
pre-existing environment gap (no PyYAML installed), unrelated to this
contribution. Homebrew's managed Python blocks a global `pip install` (PEP
668), so a throwaway venv (`python3 -m venv /tmp/verify-venv && .../pip install
pyyaml`) was prepended to `PATH` for local verification only — no repo files
were changed to work around this. The three `WARN` lines above
(`archive/`, `private/`, `data/ats/`) are pre-existing repo state, confirmed
present on `main` before this branch's changes (`git diff main -- <those
paths>` is empty).

### After (with this contribution's files added, re-run 2026-10-14)

```
$ npm run verify
conformance: 169 files (90 md · 38 py · 30 js · 6 json · 5 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================
Traceback (most recent call last):
  File "<string>", line 1, in <module>
    import yaml,json;print(json.dumps(yaml.safe_load(open('.ai/manifest.yaml'))))
    ^^^^^^^^^^^^^^^^
ModuleNotFoundError: No module named 'yaml'
ERROR (1):
  E1 .ai/manifest.yaml does not parse: Error: Command failed: python3 -c "import yaml,json;print(json.dumps(yaml.safe_load(open('.ai/manifest.yaml'))))"
✗ manifest check FAILED (1 error)
```

With the system `python3`, which has no PyYAML, the manifest step cannot parse
`.ai/manifest.yaml` and fails. That is an environment gap, not a change in this
contribution: the same step passes with a `python3` that has PyYAML installed:

```
$ PATH="/opt/anaconda3/bin:$PATH" npm run verify   # a python3 that has PyYAML
conformance: 169 files (90 md · 38 py · 30 js · 6 json · 5 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================
WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/
✓ manifest check passed (3 warnings)
```

Same 3 pre-existing warnings as on `main`, no new ones.

```
$ npm run doctor
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

```
$ node scripts/conformance.mjs scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/ recipes/cases/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage.md recipes/cases/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage.card.md course/2026fa/submissions/iyashsaraf/
conformance: 19 files (13 md · 2 py · 3 json · 1 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

```
$ node scripts/pii-scan.mjs
  [email] package-lock.json — <redacted here so this report does not re-trip the scanner; it is the npm maintainer "isaacs"'s public package-metadata address>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
```

That one finding is a dependency-metadata email in `package-lock.json` (the
npm maintainer's public address), unchanged from `main` — not introduced by
this contribution, and not personal data:

```
$ git diff main -- package-lock.json | wc -l
0
```

## Real run

Liveness check on the five chosen postings (2026-10-14 15:35 EDT), saved
unedited to `liveness/liveness-check.txt`:

```
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://jobs.ashbyhq.com/whoop/*** https://job-boards.greenhouse.io/discord/jobs/8703614002 https://jobs.ashbyhq.com/skydio/*** https://job-boards.greenhouse.io/life360/jobs/8841875002 https://careers.datadoghq.com/detail/8223819/?gh_jid=8223819

Checking 5 URL(s)...

✅ active     https://jobs.ashbyhq.com/whoop/0623a9e9-d7bb-4ee5-8100-51c68df81133
✅ active     https://job-boards.greenhouse.io/discord/jobs/8703614002
✅ active     https://jobs.ashbyhq.com/skydio/7d7dfadc-c6fd-4958-8d59-004a91bff55e
✅ active     https://job-boards.greenhouse.io/life360/jobs/8841875002
⚠️ uncertain  https://careers.datadoghq.com/detail/8223819/?gh_jid=8223819
           content present but no visible apply control found

Results: 4 active  0 expired  1 uncertain
```

The prototype's one documented command:

```
$ bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run.sh
rows_read=30369
skipped_wrong_industry=19100
skipped_no_approvals=10416
skipped_no_titles=0
skipped_no_title_match=467
emitted=386
liveness_checked=5
held_out_liveness_unchecked=381
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/roles.json (5 roles for the scorer)
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/held-out.json and held-out.md (381 held out)

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/roles.json --out-dir scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run

✓ scored 5 roles → Apply 5 · Consider 0 · Skip 0 (skip 0%)
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.md
```

## Clean checkout of the pushed commit

Run from a fresh checkout of commit `2d557d3` (the commit pushed to PR #20 on
2026-10-14), not from the working folder:

```
$ git worktree add --detach /tmp/realloc-clean 2d557d3   # a fresh checkout of the pushed commit
$ cd /tmp/realloc-clean
$ git rev-parse --short HEAD
2d557d3
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles_test.py
Ran 13 tests in 0.004s

OK
$ bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run.sh
rows_read=30369
skipped_wrong_industry=19100
skipped_no_approvals=10416
skipped_no_titles=0
skipped_no_title_match=467
emitted=386
liveness_checked=5
held_out_liveness_unchecked=381
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/roles.json (5 roles for the scorer)
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/held-out.json and held-out.md (381 held out)
✓ scored 5 roles → Apply 5 · Consider 0 · Skip 0 (skip 0%)
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.md
$ git status --short
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.json
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.md
$ node scripts/conformance.mjs scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

Tests pass, the one documented command reproduces the committed result
(386 candidates, 5 scored, Apply 5, 381 held out), and `roles.json` /
`held-out.json` come out identical to the committed files. The only change is
the date line in the two scorer reports, which the scorer stamps in UTC
(2026-10-15 in UTC, while the run was on the evening of 2026-10-14 local
time):

```
-  "generated": "2026-10-14",
+  "generated": "2026-10-15",
-# Role Scorer report — 2026-10-14
+# Role Scorer report — 2026-10-15
```

## Named failure cases exercised

### 1. Posting not checked — held out, no value invented

This is the case the first version got wrong. Now, in the real run above, the
381 companies with no chosen posting are held out of the scorer and listed in
`run/held-out.md` with the reason, for example:

```
| 1UPHEALTH INC | Senior Software Engineer | liveness not checked: no posting URL chosen for this company |
```

The offline test `test_fixture_counts_and_exclusions` asserts that with no
liveness input, **zero** roles reach the scorer, and
`test_checked_liveness_is_a_record_and_unchecked_is_held_out` asserts that an
`active` result becomes factor 1.0 (`record`), `expired` becomes 0.0, and
`uncertain` or a missing URL is held out.

### 1b. Checker says "uncertain" — a person decides, labeled as such

The checker returned `uncertain` for Datadog. I opened the page: it is live
(requisition R21399) with an embedded application form instead of an apply
button. My decision is in `liveness/gate-decisions.csv` with a screenshot, and
the role is scored with liveness labeled `your-input`; the checker's output file
is unchanged. Without that decision the role is held out
(`test_checked_liveness_is_a_record_and_unchecked_is_held_out`); with it, the
liveness is `your-input` and names who decided
(`test_human_gate_decision_clears_uncertain_as_your_input`).

### 2. Company with no title match — handled without inventing a value

467 of 30,369 rows were excluded as `skipped_no_title_match` in the real run
(companies with a sponsorship record but no SWE/AI/DevOps title in their
history) — printed, not silent. The offline fixture also isolates this with
`MAINTENANCECORP INC` ("Maintenance Claims Coordinator", a trap for a naive
"ai" substring match): `test_no_false_positive_on_short_ai_substring ... ok`.

### 3. OPT end date already past

```
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles.py --opt-end-date 2020-01-01 --posting-urls scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/posting-urls.csv --liveness-log scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/liveness-check.txt --gate-decisions scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/gate-decisions.csv --out-dir /tmp/realloc-break
liveness_checked=5
held_out_liveness_unchecked=381
wrote /tmp/realloc-break/roles.json (5 roles for the scorer)
wrote /tmp/realloc-break/held-out.json and held-out.md (381 held out)
$ npm run score -- /tmp/realloc-break/roles.json --out-dir /tmp/realloc-break
✓ scored 5 roles → Apply 0 · Consider 0 · Skip 5 (skip 100%)
```

Every scored role gets `timeline.factor = 0.0` (no clamping to a fake positive
number), a closed gate in `role-scorer.mjs` (`gate_zero = 0.05`), so all five
become Skip regardless of sponsorship strength.

### Additional cases: missing inputs

```
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles.py --csv /nonexistent/missing.csv --out-dir /tmp/missing-csv-test3
ERROR: source CSV not found: /nonexistent/missing.csv
exit=2
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles.py --posting-urls scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/posting-urls.csv --liveness-log /nonexistent/liveness.txt --out-dir /tmp/missing-log-test
ERROR: liveness log not found: /nonexistent/liveness.txt
exit=2
```

Nonzero exit and no output folder written in either case — no fabricated
`roles.json`.

## Offline test suite

```
$ python3 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles_test.py -v
test_checked_liveness_is_a_record_and_unchecked_is_held_out (__main__.TestBuildRolesFixture.test_checked_liveness_is_a_record_and_unchecked_is_held_out) ... ok
test_fixture_counts_and_exclusions (__main__.TestBuildRolesFixture.test_fixture_counts_and_exclusions) ... ok
test_human_gate_decision_clears_uncertain_as_your_input (__main__.TestBuildRolesFixture.test_human_gate_decision_clears_uncertain_as_your_input) ... ok
test_missing_csv_exits_nonzero (__main__.TestBuildRolesFixture.test_missing_csv_exits_nonzero) ... ERROR: source CSV not found: /nonexistent/missing.csv
ok
test_missing_liveness_log_exits_nonzero (__main__.TestBuildRolesFixture.test_missing_liveness_log_exits_nonzero) ... ERROR: liveness log not found: /nonexistent/liveness.txt
ok
test_past_opt_date_zeroes_every_role_timeline (__main__.TestBuildRolesFixture.test_past_opt_date_zeroes_every_role_timeline) ... ok
test_empty_titles_field (__main__.TestClassifyTitles.test_empty_titles_field) ... ok
test_matches_ai (__main__.TestClassifyTitles.test_matches_ai) ... ok
test_matches_devops (__main__.TestClassifyTitles.test_matches_devops) ... ok
test_matches_software_engineer (__main__.TestClassifyTitles.test_matches_software_engineer) ... ok
test_no_false_positive_on_short_ai_substring (__main__.TestClassifyTitles.test_no_false_positive_on_short_ai_substring) ... ok
test_future_date_gives_positive_factor (__main__.TestTimelineFactor.test_future_date_gives_positive_factor) ... ok
test_past_date_zeroes_factor (__main__.TestTimelineFactor.test_past_date_zeroes_factor) ... ok

----------------------------------------------------------------------
Ran 13 tests in 0.005s

OK
```

Fixture-based (`fixtures/mini-targets.csv`, `fixtures/posting-urls.fixture.csv`,
`fixtures/liveness-log.fixture.txt`, `fixtures/gate-decisions.fixture.csv`, the
last three clearly marked as fixtures),
no network calls, does not read the real CSV.

## Scope check

```
$ git status --short
 M course/2026fa/submissions/iyashsaraf/CHANGE-BRIEF.md
 M course/2026fa/submissions/iyashsaraf/DOMAIN-JUSTIFICATION.md
 M course/2026fa/submissions/iyashsaraf/FRICTIONAL.md
 M course/2026fa/submissions/iyashsaraf/SOURCES.md
 M course/2026fa/submissions/iyashsaraf/TEST-REPORT.md
 M course/2026fa/submissions/iyashsaraf/WORKED-RUN.md
 M recipes/cases/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage.card.md
 M recipes/cases/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage.md
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/README.md
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles.py
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/build_roles_test.py
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run.sh
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.json
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.md
 M scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/roles.json
?? course/2026fa/submissions/iyashsaraf/PR-DESCRIPTION.md
?? course/2026fa/submissions/iyashsaraf/SUBMISSION.md
?? logs/runs/2026fa-iyashsaraf-2.md
?? scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/fixtures/gate-decisions.fixture.csv
?? scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/fixtures/liveness-log.fixture.txt
?? scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/fixtures/posting-urls.fixture.csv
?? scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/
?? scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/held-out.json
?? scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/held-out.md
```

Only this student's namespaced paths — no other student's folder, no
`logs/RUN_LOG.md`, and `package-lock.json` is unchanged.

## What the gates require a human to judge

- **Liveness gate (G4):** a person chooses which posting to check for each
  company, runs `npm run ats:liveness` on it, and saves the output. Only
  `active` or `expired` results reach the scorer; `uncertain` needs a human to
  open the page and decide, recorded in `liveness/gate-decisions.csv` (done for
  Datadog on 2026-10-14). A checked posting can close later, so the check date
  matters before acting on an Apply row.
- **Visa-timeline gate (G5):** the `--opt-end-date` and `--hiring-lag-days`
  are disclosed assumptions, not a researched per-company estimate. A human
  should replace the default with their real OPT date and sanity-check the
  45-day hiring-lag assumption against their own target companies.

## Finding and proposed next improvement

The first run (2026-10-01) reported Apply 55 · Consider 328 · Skip 3 (1% skip)
because every role carried an invented liveness of 0.5. That placeholder is
gone. The re-run scores only the 5 roles with a checked posting (4 confirmed
by the checker, 1 by my own gate decision): Apply 5, Skip 0%, and the scorer
still flags the 0% skip rate. Five roles, chosen at five of the strongest
sponsors on the list, are too few and too hand-picked to test the "healthy run
skips at least half" bar. Next
improvement: check postings for a random sample of the held-out companies and
report the Skip rate on that sample.
