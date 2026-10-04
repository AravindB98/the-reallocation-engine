# TEST-REPORT — opt-countdown (salonimathure20)

## Summary

This report shows the prototype tested from a clean checkout of the branch. The toolchain checks were run before and after the change. The one-command sample run, all 12 offline tests, conformance, and the branch-history privacy scan pass. Each named failure case was exercised and handled without inventing a value. Two things do not pass, and neither comes from this branch:

- `npm run verify` fails on a machine without Python's `pyyaml`;
- the working-tree privacy scan flags an npm deprecation notice already present in upstream's `package-lock.json`.

Upstream `main`'s own CI is red on that same step.

Environment: macOS (Darwin 25.5), Node **20.20.2** (via nvm; the machine default 18.10 is below the required 20), Python 3.13.5. Commit tested from a clean clone: `c87a34db0e2b43428a32a8b325a7447daa62af39`. This report was added in the next commit; it changes no code.

## 1. Toolchain baseline: before the change (fresh clone of upstream `015843d`)

| Command | Result |
|---|---|
| `npm install` | added 55 packages; it also rewrites `package-lock.json` (reverted with `git checkout package-lock.json` so it stays out of the diff) |
| `npm run doctor` | exit 0. `environment: ✓ runnable`, `recipes: 33/33 carry lifecycle frontmatter`, `✓ no private/PII paths are tracked` |
| `npm run verify` (system Python, no pyyaml) | **exit 1**: `ModuleNotFoundError: No module named 'yaml'` → `E1 .ai/manifest.yaml does not parse` → `✗ manifest check FAILED (1 error)` |
| `npm run verify` (after `pip install pyyaml` into a throwaway venv) | exit 0. `conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)` `✓ all conform`; `✓ manifest check passed (3 warnings)` (archive/, private/, data/ats/ not gitignored, all pre-existing) |
| `npm run ats:scan -- --dry-run` | exit 1: `Error: portals.yml not found. Run onboarding first.` With `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml`: exit 0, `Companies scanned: 1 · Total jobs found: 886 · New offers added: 61` (Databricks) |
| `npm run ats:liveness -- <url>` | first `Executable doesn't exist … chrome-headless-shell`; after `npx playwright install chromium` it ran (output in `WORKED-RUN.md` §1) |
| `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/salonimathure20/runs/ch11-baseline` | `✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)` |

## 2. Clean checkout of the branch, then the full run (real output)

```text
$ git log -1 --format="%H %s"
c87a34db0e2b43428a32a8b325a7447daa62af39 opt-countdown recipe + prototype (2026fa, salonimathure20)
$ node -v
v20.20.2
$ npm install
added 55 packages in 1s
$ npm run doctor  (tail)
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
$ npm run verify  (tail)
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
$ node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs
✓ opt-countdown: runway 53 days (start by 2026-11-25, bound by unemployment-clock)
  8 roles → scored 6 (Apply 1 · Consider 2 · Skip 3) · blocked for a human 2
  scorer: ✓ scored 6 roles → Apply 1 · Consider 2 · Skip 3 (skip 50%)
  course/2026fa/submissions/salonimathure20/runs/opt-countdown/opt-countdown-log.json  +  course/2026fa/submissions/salonimathure20/runs/opt-countdown/opt-countdown-report.md
exit=0
$ node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/  (summary)
ok 1 - CSV parser keeps quoted commas inside one field
ok 2 - sponsorship: record row → p from the documented formula, tier Proven
ok 3 - sponsorship: blank H-1B columns → missing/Unknown, never p = 0
ok 4 - sponsorship: company absent from CSV → no-company-row
ok 5 - runway: binds on the tighter of OPT end date and unemployment clock
ok 6 - runway: OPT end date already past → halt
ok 7 - timeline: negative slack closes the gate; ≥30 days slack is full credit
ok 8 - liveness: checker "active" + Greenhouse API 404 → closed gate (redirect false positive)
ok 9 - liveness: uncertain with no API record → missing, not a guessed factor
ok 10 - end to end: real scorer runs, every term labeled, blocked roles never reach it
ok 11 - end to end: OPT end date in the past halts with exit 3 and scores nothing
ok 12 - end to end: an unlabeled fit value is rejected as bad input (exit 2)
# tests 12
# pass 12
# fail 0
$ node scripts/conformance.mjs scripts/contrib/2026fa/salonimathure20-opt-countdown/
conformance: 8 files (1 md · 4 json · 3 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.
$ node scripts/pii-scan.mjs --diff origin/main
pii-scan: clean ✓
$ git status --short   (after the run: outputs regenerate in place)
 M course/2026fa/submissions/salonimathure20/runs/opt-countdown/opt-countdown-log.json
 M course/2026fa/submissions/salonimathure20/runs/opt-countdown/opt-countdown-report.md
```

The two modified files after the run differ only in the `run_at` timestamp. The run writes only into this student's `course/…/runs/` folder; no tracked repo file outside the namespace changes. (The clean clone used the same throwaway venv with `pyyaml` on `PATH`; without it, `verify` fails exactly as in §1.)

## 3. After the change (working copy with the branch)

| Command | Result |
|---|---|
| `npm run doctor` | exit 0. `environment: ✓ runnable` (recipe count still 33: the doctor dashboard counts top-level `recipes/`, not `recipes/cases/`) |
| `npm run verify` | exit 0. `conformance: 168 files (88 md · 36 py · 33 js · 7 json · 4 sh)` `✓ all conform`; `✓ manifest check passed (3 warnings)` |
| `node scripts/pii-scan.mjs` (working tree) | **exit 1**: one `[email]` finding in `package-lock.json` (the maintainer contact address inside npm's deprecation notice; not reproduced here so this report does not trip the same scan). This is npm's deprecation text for `glob@10`, present in upstream `HEAD:package-lock.json:606`; this branch does not touch `package-lock.json`. Upstream `main`'s Contrib Gate run 35913366020 (2026-09-23) fails at the same step |
| `node scripts/pii-scan.mjs --diff main` (full branch history) | exit 0. `pii-scan: clean ✓` |

## 4. Named failure cases, each exercised

| Failure case (CHANGE-BRIEF) | How exercised | Observed | Invented a value? |
|---|---|---|---|
| Company missing from the CSV | HubSpot in the worked run; `t-not-in-csv` in tests | `Blocked · sponsorship: no-company-row`; absent from `roles.json` | no |
| Company present, H-1B record blank | DraftKings; `t-blank-h1b` | `Blocked · sponsorship: no-h1b-record-joined`; `p` is undefined, never 0 | no |
| OPT end date already past | persona with `opt_end_date: 2026-09-30` (CLI); test 11 | `HALT at gate G1 (runway): opt-end-date-already-past. No role was scored.` exit=3, no `roles.json` | no |
| Posting that is gone | fake Klaviyo job ID `1000000003` | browser checker: **active** (wrong); Greenhouse API 404 → liveness 0 → `Skip · gated: liveness` | no (the API record decides) |
| SOC code with no BLS row | `t-unknown-soc` (`15-9999.00`); test 10 | `role_quality_context.reason = no-occupation-row`; decision unaffected (weight 0) | no |
| Liveness never checked | HubSpot, DraftKings; `t-no-liveness` | `liveness: liveness-unchecked` → blocked | no |
| Unlabeled value | test 12 (`fit.source: "gut-feeling"`) | exit 2, `fit.source must be one of record \| model-judgment \| your-input` | no |
| Missing Greenhouse API file | `--greenhouse-api <nonexistent>` | loud warning; every live role flagged single-source | no, but it is weaker evidence (see WORKED-RUN, break 2) |

## 5. `git diff --stat` against upstream: only namespaced paths

`git diff --stat origin/main...HEAD` from the clean clone shows 31 files, 2,929 insertions, all under:

- `scripts/contrib/2026fa/salonimathure20-opt-countdown/`
- `recipes/cases/2026fa/salonimathure20-opt-countdown{,.card}.md`
- `logs/runs/2026fa-salonimathure20-1.md`
- `course/2026fa/submissions/salonimathure20/`

There are no edits to `logs/RUN_LOG.md`, `package.json`, `package-lock.json`, any maintained script, or another student's folder. The maintained file patched is **none**.

## 6. What the gate requires a human to judge

- **G1:** that the persona's OPT end date and unemployment-day count are the person's real numbers (checked privately against the EAD card and SEVP portal, never committed).
- **G2:** for each blocked role, whether to assert a name alias (with a basis) or look the employer up manually (USCIS Employer Data Hub).
- **G4:** for each Apply or Consider row:
  - open the posting and confirm it is the job described;
  - confirm it is in the target occupation;
  - confirm the hiring-lag assumption is plausible;
  - record apply / network / drop with name and date in `logs/runs/2026fa-salonimathure20-1.md`.

  This is **not yet done**. In particular, Formlabs is an Apply at 0.317, only 0.017 over the threshold, on a model-judged fit.
