# TEST-REPORT — decgrad-swe1-sponsor-level prototype

## Executive summary

This report records how the prototype was tested and what happened. It ran on a fresh copy of the repository containing only this contribution. The repository's own health checks passed before and after the change. All 13 offline tests passed. The sample run produced the expected two outputs, and every deliberate attempt to break it was either refused with a clear error or caught by a test. Three things did not go cleanly, and they're reported rather than hidden. (1) The repository's privacy scanner already flags one false positive in a file this contribution doesn't touch. (2) The posting-liveness checker needed a browser install the setup steps don't mention. (3) One bug in my own code was invisible in the output, because the scorer quietly treats a missing value as "fine". The bug is fixed, and a guard now prevents that class of failure.

**Not yet done:** this was run from a fresh clone with the files copied in, not from the committed branch, because nothing has been committed yet (by instruction). It must be re-run from `contrib/2026fa-o7580-decgrad-swe1-sponsor-level` before the PR is opened (§7).

---

## 1. Toolchain baseline (before any change), upstream `015843d`

Full outputs: `baseline/doctor-before.txt`, `baseline/verify-before.txt`, `baseline/pii-before.txt`, `baseline/ats-scan-dryrun.txt`, `baseline/score-ch11.txt`.

| Command | Result |
|---|---|
| `npm install` | ok. **Modified tracked `package-lock.json`** (36 lines removed); restored with `git checkout package-lock.json`. `npm ci` does not modify it (verified in §3). |
| `npm run doctor` | exit 0; `environment: ✓ runnable`; `✓ no private/PII paths are tracked` |
| `npm run verify` | exit 0; `conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)`; `✓ manifest check passed (3 warnings)` |
| `npm run ats:scan -- --dry-run` | **first attempt failed**: `Error: portals.yml not found. Run onboarding first.` After `cp data/ats/portals.example.yml data/ats/portals.yml` (gitignored): exit 0, `Companies scanned: 1 · Total jobs found: 872 · New offers added: 63`. It is a "dry run", but it still makes live network calls to the Greenhouse API. |
| `npm run ats:liveness -- <url>` | **first attempt failed**: `browserType.launch: Executable doesn't exist … Please run … npx playwright install`. After `npx playwright install chromium`: works (§4). |
| `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/o7580/runs` | exit 0: `✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)`. The book's own example skips 40%, under the "healthy ≥ 50%" guide. Output moved to `runs/baseline-ch11/`. |
| `node scripts/pii-scan.mjs` | **exit 1 on the untouched upstream tree**: `[email] package-lock.json — <npm-package-author-address, redacted>`. That's an npm package author's address in the tracked lockfile, present at `015843d` before any change of mine. Not mine to fix (`package-lock.json`'s parent `package.json` is a protected path). The branch-history scan that CI runs on PRs is clean (§3). |

## 2. Toolchain after the change (working repo)

`baseline/doctor-after.txt`, `baseline/verify-after.txt`:

- `npm run doctor`: exit 0, unchanged summary. My recipe is in `recipes/cases/`, which doctor's recipe dashboard doesn't scan.
- `npm run verify`: exit 0; `conformance: 167 files (88 md · 36 py · 33 js · 6 json · 4 sh)`. +9 files = 3 js + 3 json + 3 md, all mine, all conforming.

## 3. Clean-checkout run

Transcript: `clean-checkout-run.txt`. Procedure: `git clone` upstream (`015843d`) into a scratch directory → copy **only** the untracked files of this contribution → delete `runs/` so every output is regenerated → `npm ci` → run everything below.

```
$ npm run doctor             → exit 0
$ npm run verify             → exit 0 · conformance: 167 files · ✓ all conform
$ node scripts/conformance.mjs scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/
conformance: 7 files (1 md · 3 json · 3 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.
$ node --test scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/test/triage.test.mjs
# tests 13
# pass 13
# fail 0
$ node scripts/pii-scan.mjs                       → exit 1 (only the pre-existing package-lock.json finding, §1)
$ node scripts/pii-scan.mjs --diff origin/main    → pii-scan: clean ✓   (exit 0; scratch-only commit, never pushed)
$ git diff --stat (tracked files)                 → empty: no maintained file changed
$ git diff --name-only origin/main...HEAD | grep -v <my four namespaces>   → (none)
$ git diff --stat origin/main...HEAD | tail -1    → 21 files changed, 3348 insertions(+)
```

`npm ci` left `package-lock.json` untouched (`git diff --stat` empty). Recommend `npm ci` over `npm install` for the PR.

**Final re-run (same procedure, after every document in this folder was written):** `npm ci` exit 0 · `npm run doctor` exit 0 · `npm run verify` 167 files ✓ · conformance over all 4 namespaces ✓ · tests 13/13 · triage `11 roles → scored 7 (Apply 4 · Consider 1 · Skip 2) · not scored 4`. The regenerated `triage-log.json` is **identical** to the committed one apart from `generated_at`, so the run is deterministic.

On the first attempt, `pii-scan --diff origin/main` returned **5 findings, all in my own reports**. I had quoted the upstream lockfile's false-positive email address. After redacting it: `pii-scan: clean ✓` (exit 0); `54 files changed, 8339 insertions(+)`; 0 paths outside my four namespaces. See `FRICTIONAL.md` row 10.

## 4. The real sample run

Command (the documented one, from the repo root):

```bash
node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs
```

Output (verbatim, final code; also `runs/sample/triage-stdout.txt`). An earlier run that day printed `composite 0.39` for Ginkgo, before the management-title fix described in `worked-run.md` §Reflection:

```
✓ triage: 11 roles → scored 7 (Apply 4 · Consider 1 · Skip 2) · not scored 4
  Apply       pathai-swe1-fullstack  composite 0.525
  Apply       klaviyo-swe2-recommendations  composite 0.465
  Apply       coherehealth-swe2  composite 0.495
  Apply       vestmark-swe  composite 0.525
  Not scored  formlabs-swe-ecommerce  [liveness-uncertain]
  Skip        ginkgo-swe2-autonomous-lab  composite 0.285
  Consider    databento-swe-typescript  composite 0.285
  Skip        lexington-embedded-swe  composite 0.195
  Not scored  pathai-deliberately-dead-url  [liveness-uncertain]
  Not scored  hubspot-not-in-csv  [no-company-match]
  Not scored  draftkings-no-sponsorship-record  [no-sponsorship-record, no-liveness-record]
  course/2026fa/submissions/o7580/runs/sample/triage-log.json  +  course/2026fa/submissions/o7580/runs/sample/triage-report.md  (scorer: course/2026fa/submissions/o7580/runs/sample/roles.json → role-scores.json/.md)
exit=0
```

The liveness input came from the real checker, run once on 2026-10-01 (`scenarios/boston-decgrad.liveness.log`, verbatim):

```
✅ active     https://www.pathai.com/careers/8696764002?gh_jid=8696764002
✅ active     https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003
✅ active     https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
✅ active     https://job-boards.greenhouse.io/vestmark/jobs/8009953
⚠️ uncertain  https://careers.formlabs.com/job/7506561/apply/?gh_jid=7506561
           content present but no visible apply control found
✅ active     https://job-boards.greenhouse.io/ginkgobioworks/jobs/5166911007
✅ active     https://job-boards.greenhouse.io/databento/jobs/8076835
✅ active     https://job-boards.greenhouse.io/lexingtonmedical/jobs/5419363008
⚠️ uncertain  https://job-boards.greenhouse.io/pathai/jobs/1000000001
           navigation error: page.goto: Timeout 15000ms exceeded.

Results: 7 active  0 expired  2 uncertain
```

## 5. Each named failure case, exercised

| # | Failure case (from CHANGE-BRIEF) | Exercised by | Observed |
|---|---|---|---|
| 1 | Company missing from CSV | sample `hubspot-not-in-csv`; fixture `missing-company` | `Not scored [no-company-match]`; no sponsorship value; not in `roles.json`. Independent check: `grep -ci "^hubspot" <csv>` → `0` |
| 2 | Company present, sponsorship blank | sample `draftkings-no-sponsorship-record`; fixture `blank-record` | `Not scored [no-sponsorship-record]`; test asserts `p` is `undefined`, not 0. Raw CSV row ends `Series D+,2024-12-03,,,,,` |
| 3 | Ambiguous name | fixture `Same State Twin` (two MA rows) and `Twin Labs` (MA vs TX) | `ambiguous-company-match`; the state tie-break resolves the MA/TX pair to `TWIN LABS INC` |
| 4 | Posting 404 / expired / not checked | sample `pathai-deliberately-dead-url`; fixtures `proven-expired`, `proven-uncertain`, `url-not-checked` | **Prediction partly wrong.** The real dead URL did not 404: it redirected to `https://www.pathai.com/careers` with HTTP 200 (`curl -L` → `200 … redirects=4`), and the checker reported `uncertain` (timeout). The prototype leaves it Not scored. The expired → `Skip, gated: liveness` path is exercised only by the fixture; no real expired posting was found in this run. |
| 5 | OPT date passed / start too late | `--as-of 2027-02-15 --days-used 42` (`runs/asof-2027-02-15/`); fixtures for each closure | All 7 scored roles → `Skip` with `unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)`. Fixtures cover `grad-window-excludes`, `experience-cap-excludes`, `start-before-work-authorization`. |
| — | Bad inputs | malformed JSON, missing CSV, `--out-dir data/examples`, `--days-used abc`, persona without `opt_start_date` | all exit 2 with a one-line reason; nothing written (test 12 asserts the out-dir is not created) |

Deliberate break attempts (mutating my own code, then the scorer's input): `break-tests.txt`, summarized in `worked-run.md` §Attestation.

## 6. What the gate requires a human to judge

The machine half (conformance, tests, exit codes) is above. These are the adequacy questions only a person can answer, and none has been answered yet:

- **G1:** is each matched CSV row the employer on the posting? (e.g. `VESTMARK INC, WAKEFIELD, MA` for a Boston-listed posting: the same company with a different office.)
- **G3:** open the two `uncertain` URLs in a browser. Is the Formlabs posting really open? (The Greenhouse API listed it on 2026-10-01.)
- **G4:** re-read each posting and confirm the typed fields: no grad window, no experience cap, no fixed start, and the Ginkgo no-sponsorship quote.
- **G5:** decide which of the 4 Apply and 1 Consider rows get tailoring time, and record it in `logs/runs/2026fa-o7580-1.md`.
- Whether the 29% skip rate (2 of 7 scored) reflects good pre-filtering or rules that are too lenient. See the worked run's reflection.

## 7. Still to do before the PR

- [ ] Commit on `contrib/2026fa-o7580-decgrad-swe1-sponsor-level` (not yet, by instruction).
- [ ] `git clone <fork> && git checkout <branch> && npm ci`, re-run §3 from the branch itself, and paste that output into the PR.
- [ ] `node scripts/pii-scan.mjs --diff origin/main` on the real branch.
