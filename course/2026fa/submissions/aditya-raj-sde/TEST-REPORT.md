# TEST-REPORT — Sponsor & Posting Reality Check

## Executive summary

This is the record of every check run for this assignment: the exact command, who ran it, its
input, its exit code, where its full output is saved, and what the result does and does not
establish. Read it to confirm that the claims elsewhere in the submission rest on real output, not
descriptions. It covers setup only; the prototype has not been built or tested yet.

Setup happened in two passes. In the first pass, three checks did not pass:

- the repository's structure check needed a Python library missing on this computer;
- the privacy scan flagged an email address;
- the posting-liveness check had no browser to run with.

In the second pass, after the student's decisions:

- the Python library was installed in an isolated, project-local environment, and the structure
  check passed;
- the browser was installed, and the liveness check reported the chosen Databricks posting as
  **active** at 17:48 EDT on 2026-10-03 (a point-in-time observation, not an endorsement and not
  evidence of visa sponsorship).

The privacy-scan finding was traced to a line that ships with the upstream project itself, and the
same failure was reproduced on an untouched upstream copy and confirmed in the upstream project's own
CI history. A second upstream CI job fails because four of its test scripts are missing from the
project. These are **two confirmed blockers to a green CI run that only the maintainer can resolve**. Both passes are kept below so the first failures
stay visible.

## Conventions

- **Ran by:** `Claude` = command executed by the AI agent; `Aditya` = check performed by the student.
- Every command's full output is saved under `evidence/`. Each file records the command, its start
  and end times, the raw output (stdout and stderr together), and `[exit=N]`.
- "Establishes" states only what the output shows. Anything beyond that is labeled as inference.
- Paths are relative to the repository root unless noted.

## Pass 1 — setup and baseline (2026-10-03, 17:01–17:09 EDT)

*Rows as written at the time. "Pending" statements in this table are resolved in Pass 2.*

| # | Ran by | Command | Exit | Evidence | Establishes |
|---|---|---|---|---|---|
| 00 | Claude | `git remote add upstream …` · `git fetch upstream` · `git rev-parse main upstream/main origin/main` · `git switch -c contrib/2026fa-aditya-raj-sde-sponsor-live-jan2027` · `git status --short --branch` | 0 (all) | `evidence/00-remote-branch.txt` | Fork, upstream, and local `main` were identical (`015843d`) when the branch was cut; tree clean. |
| 01 | Claude | GitHub REST `GET /user`, `GET /user/emails`, `HEAD /user` scopes (token from the existing git credential helper; never printed) | attempt 1: invalid (see note) · attempt 2: `/user` 200, `/user/emails` 404 · attempt 3: 200 | `evidence/01-noreply-identity.txt` | Account login `aditya-raj-sde`, id `181499137`. The token's scopes are `gist, repo, workflow`; without `user`/`user:email`, the emails endpoint returns 404. **The exact noreply address was NOT verified.** `user.email` unchanged; pending Aditya. Attempt 1 was invalid because `timeout` is not installed on this Mac; kept with a correction note. |
| 02 | Claude | `npm install` | 0 | `evidence/02-npm-install.txt` (one email in npm's deprecation text redacted, marked inline) | 55 packages installed. npm reports 3 high-severity vulnerabilities (not addressed; out of scope). **Unexpected change outside the namespace:** `package-lock.json` modified; see 02b. Playwright Chromium was **not** installed by this step. |
| 02b | Claude | `git diff --stat package-lock.json` + line classification | 0 | `evidence/02b-package-lock-diff.txt` | 36 deletions, all `"libc"` metadata fields (12 fields); 0 other changed lines. **Not staged.** Disposition pending Aditya. |
| 03 | Claude | `head -1 <sponsorship CSV> \| tr ',' '\n' \| nl` + line count + grep for `soc\|year\|fiscal\|fy` | 0 | `evidence/03-sponsor-csv-columns.txt` | 20 columns; 30,369 lines after the header (a line count, which may differ from the record count if fields contain newlines). The grep's 2 hits are `year_incorporated` and `company_age_years`, both company-age fields. **No SOC column and no per-year sponsorship column** (observed limitation). No data rows were copied (the file has a `phone` column). |
| 04 | Claude | `npm run doctor` | 0 | `evidence/04-doctor-baseline.txt` | Environment runnable; no private/PII paths tracked. |
| 05 | Claude | `npm run verify` | **1** | `evidence/05-verify-baseline.txt` | Conformance passed (158 files). **The manifest check failed:** `ModuleNotFoundError: No module named 'yaml'`. Local `python3` lacks PyYAML; CI installs it (`pip install pyyaml`). This is an environment gap, not a repo defect. Fix pending Aditya's approval. |
| 06 | Claude | `node scripts/pii-scan.mjs` | **1** | `evidence/06-pii-scan-baseline.txt` | One finding: an email address in `package-lock.json` (glob's deprecation text). **Pre-existing:** the line is present in `HEAD:package-lock.json` (verified in 07b) and was not introduced by this branch. The submission folder produced no findings. |
| 07 | Claude | `npm run ats:scan -- --dry-run` | **1** | `evidence/07-ats-scan-dry-run.txt` | `Error: portals.yml not found`. The scanner needs a config file that does not exist on a fresh clone. |
| 07b | Claude | `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml npm run ats:scan -- --dry-run` (no-copy alternative from `docs/tutorials/01-first-scan.md`) | 0 | `evidence/07b-ats-scan-dry-run-example-config.txt` | 1 company (Databricks, Greenhouse): 886 jobs found, 393 filtered by title, 422 by location, 10 duplicates, 61 listed. Dry run; `git status` shows no new files. Also shows the origin of the 06 finding. |
| 08 | Claude | `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/aditya-raj-sde/runs` | 0 | `evidence/08-score-ch11-example.txt`, `runs/role-scores.{json,md}` | The existing scorer runs: 5 example roles → Apply 2 · Consider 1 · Skip 2 (skip 40%). The tracked `data/examples/role-scores.*` was not modified (09). |
| 09 | Claude | `git status --short` + `ls runs/` | 0 | `evidence/09-git-status-after-baseline.txt` | Changes after the baseline: `package-lock.json` (02b) and the new `course/2026fa/` folder only. |
| 10 | Claude | `GET https://boards-api.greenhouse.io/v1/boards/databricks/jobs`, filtered to US non-senior "engineer" titles | 0 (HTTP 200) | `evidence/10-liveness-candidate-url.txt` | 886 jobs on the board, 11 matches; first 8 listed. Candidate for the liveness baseline: see below. **Board listing ≠ liveness;** the listing is what the API returned at 17:05 EDT. |
| 11 | Claude | `npx playwright --version`; `chromium.executablePath()` existence; Playwright cache listing | 0 | `evidence/11-liveness-dependency-check.txt` | Playwright 1.62.1 is installed, but its Chromium build is **missing** (`exists=false`). `npm run ats:liveness` cannot run yet. **The liveness baseline is pending.** |
| 12 | Claude | `npm -v`; `node scripts/conformance.mjs <submission folder> logs/runs/2026fa-aditya-raj-sde-1.md`; `node scripts/pii-scan.mjs`; `git status --short --untracked-files=all`; `git diff --stat` | 0, 0, **1**, 0, 0 | `evidence/12-post-setup-checks.txt` (address redacted) | npm 10.9.2. The 7 conformance-checked files (6 md, 1 json) conform; `.txt` evidence is not a conformance type. **The PII scan found a new finding that Claude created:** evidence 06 had saved the scanner's own printout of the address. All changes are in the namespace except `package-lock.json`. |
| 13 | Claude | `node scripts/pii-scan.mjs` after redacting 06 and 12 | **1** (first capture's exit blank due to a zsh/bash slip; re-run recorded `[exit=1]`) | `evidence/13-pii-scan-after-redaction.txt` | Only the pre-existing `package-lock.json` finding remains; the submission folder and run log are clean. `grep` confirms no raw address in the namespace. |

### Liveness candidate, as proposed at 17:05 EDT (resolved in Pass 2)

- **Candidate URL for Aditya's review:**
  `https://databricks.com/company/careers/open-positions/job?gh_jid=8635225002`
  (Databricks, "Software Engineer, Web Products", Mountain View, CA; Greenhouse `updated_at`
  2026-09-21). **Host:** `databricks.com`. The listing came from `boards-api.greenhouse.io`. Databricks
  has 1 matching row in the sponsorship CSV (company-name prefix match; not yet checked by hand).
- **Blocked by:** Playwright Chromium is not installed. Unblocking would need
  `npx playwright install chromium` (a browser download), which was not run.
- **Observation, not a finding:** the board lists two separate jobs (`8635225002`, `8560779002`) with
  the identical title "Software Engineer, Web Products". Why is unknown.

## Pass 2 — corrections after Aditya's decisions (2026-10-03, 17:46–17:54 EDT)

| # | Ran by | Command | Exit | Evidence | Establishes |
|---|---|---|---|---|---|
| 14 | Claude | `git config --local user.email <noreply>`; `git config --show-origin --get user.email` | 0 (the final `grep -c` exits 1 by design: global address is not noreply) | `evidence/14-commit-identity.txt` | Address supplied by Aditya (GitHub settings screenshot); its id prefix `181499137` matches authenticated `GET /user` (01). Set in `.git/config` only; global unchanged. |
| 15 | Claude | provenance check; sanitized `git diff package-lock.json`; `git restore package-lock.json` | 0 | `evidence/15-package-lock-restore.txt` | The diff equals 02b (36 `libc` deletions), and the tree was clean before `npm install` (00), so the change came only from the install. Diff saved; file restored; `identical-to-HEAD`. CORRECTION appended: the 12 `@` matches are diff hunk headers, not addresses. |
| 16 | Claude | `/usr/local/bin/python3 -m venv .venv`; `.venv/bin/python -m pip install pyyaml` | 0 | `evidence/16-python-venv-pyyaml.txt` | PyYAML 6.0.3 is installed in the gitignored `.venv/` only. `python3` on `PATH="$PWD/.venv/bin:$PATH"` resolves to the venv; the system `python3` still lacks yaml (unchanged). Side observation: pip picked an **arm64** wheel, so this "x86" Python is a universal binary running arm64. |
| 17 | Claude | `PATH="$PWD/.venv/bin:$PATH" npm run verify` + control without the PATH change | **0** with venv · 1 control | `evidence/17-verify-with-venv.txt` | Corrects 05. Conformance 158 files ok; manifest check passed with 3 warnings. The W2 warnings ("private/ and data/ats/ not gitignored") were checked: `git check-ignore` shows `/private/*` and `/data/ats/*` ignore them, and only scaffolding files are tracked. The warning comes from how the check reads `.gitignore`, not from a real exposure. |
| 18 | Claude | `npx playwright install chromium` | 0 | `evidence/18-playwright-chromium-install.txt` | Corrects 11. Chrome for Testing 151.0.7922.34 (Playwright chromium v1234) + headless shell + ffmpeg downloaded from `cdn.playwright.dev` into the user-level cache; `exists=true`; repo tree unchanged. |
| 19 | Claude | `npm run ats:liveness -- '<URL>'`; `curl -L` redirect trace; read-only Playwright probe (inline); Greenhouse `GET /jobs/8635225002` | 0 · 0 · 0 · 0 | `evidence/19-liveness-baseline-8635225002.txt` | See "Liveness baseline result" below. |
| 20 | Claude | `git worktree add --detach <scratch> upstream/main`; that revision's `node scripts/pii-scan.mjs`; `git worktree remove` | scanner **1** | `evidence/20-pii-upstream-revision.txt` | On an unchanged upstream checkout (`015843d`, 0 modified files), upstream's own scanner reports the same single finding: `package-lock.json` line 606, glob's deprecation text. The finding pre-dates this branch. |
| 21 | Claude | GitHub REST: workflow runs ×2 (API error both times), then `GET /commits/015843d/check-runs`, then `GET /actions/jobs/{id}` for the failed jobs | API errors, then HTTP 200 | `evidence/21-pii-upstream-ci-runs.txt` | **Upstream's real CI on `015843d`** (completed 2026-09-23): `doctor-and-pii` = **failure**, at step 6 "PII scan (working tree)", with step 7 (diff scan) skipped; `harness-regression` = **failure** at step 5; `conformance` and `verify` = success; `contrib-scope` = skipped (push event). *Row first written at about 17:52 while the request was still pending; updated at 17:54 when it returned.* |
| 22 | Claude | `node scripts/test/gate-behavior-harness.mjs` (CI's step 5) + existence check of every harness the job calls | **1** (MODULE_NOT_FOUND) | `evidence/22-harness-regression-upstream.txt` | At upstream `015843d`, 4 of the 6 harness scripts named in `contrib-gate.yml` are **absent**: `scripts/test/gate-behavior-harness.mjs`, `scripts/test/fuzz-invariants.mjs`, `scripts/gates/gate-behavior-harness.mjs`, `scripts/score/scorer-harness.mjs`. The job cannot pass for any branch based on this revision. |

## Pass 3 — commit checks (2026-10-03, from 17:55 EDT)

| # | Ran by | Command | Exit | Evidence | Establishes |
|---|---|---|---|---|---|
| 23 | Claude | `git add -- <submission folder> logs/runs/2026fa-aditya-raj-sde-1.md`; pattern scan of `git diff --cached` added lines (emails, phone shapes, secret shapes, institutional domain, home paths, private-path mentions); sizes | 0 | `evidence/23-pre-commit-sensitive-inspection.txt` | 33 staged files, all in the namespace; 1,782 insertions; largest file 19.5 KB. Emails: only the allowlisted noreply address (3×, in 14). Phone, secret, institutional-domain, and private-path matches: 0. **8 local home-directory paths** in raw tool output (16, 18, 20, 22) show the macOS username and folder layout. Low sensitivity, left unaltered, flagged to Aditya. |

## Initial problems → resulting state

| Problem (Pass 1) | Cause (as established) | Action | Resulting state |
|---|---|---|---|
| `npm run verify` exit 1 (05) | local `python3` lacks PyYAML; CI installs it | isolated `.venv` + PyYAML (16) | exit 0 with `PATH="$PWD/.venv/bin:$PATH"` (17) |
| `ats:scan --dry-run` exit 1 (07) | no `portals.yml` on a fresh clone | documented env-var option, no file created (07b) | exit 0, nothing written |
| Liveness could not run (11) | Playwright Chromium not downloaded by `npm install` | `npx playwright install chromium` (18) | ran; gh_jid 8635225002 **active** (19) |
| `package-lock.json` modified (02b) | `npm install` dropped `libc` metadata | evidence saved, `git restore` (15) | identical to HEAD; recurs on every `npm install` (`npm ci` would not rewrite it; not tested) |
| Noreply address unverified (01) | token lacks `user:email` scope | Aditya supplied it (14) | set in `.git/config` |
| Claude's evidence leaked an address into the folder (12) | saved scanner output prints the address | redaction with marker (13) | folder clean |
| `pii-scan` exit 1 (06, 13) | pre-existing upstream lockfile line (20) | none possible inside the namespace | **open: confirmed blocker** (below) |

### Reproducible local setup (for the clean-checkout run later)

```bash
npm install
git restore package-lock.json            # npm install rewrites libc metadata; keep it out of the PR
/usr/local/bin/python3 -m venv .venv && .venv/bin/python -m pip install pyyaml   # 6.0.3 used here
npx playwright install chromium          # only needed for the live liveness check, not the offline tests
PATH="$PWD/.venv/bin:$PATH" npm run verify
```

## Liveness baseline result (evidence 19)

- **Target:** Databricks job **gh_jid 8635225002**,
  `https://databricks.com/company/careers/open-positions/job?gh_jid=8635225002`. The board also
  lists **8560779002** with the identical title, so the job is identified by id and URL, not by title.
- **Observed at:** 17:48:07 EDT (repo command), 17:48:12 (curl), 17:48:29 (browser probe), and 17:48:33
  (Greenhouse record), all on 2026-10-03.
- **Repo command result:** `✅ active`, `Results: 1 active 0 expired 0 uncertain`, exit 0.
- **Redirects (identical in curl and in the browser's main-frame chain):**
  1. `https://databricks.com/company/careers/open-positions/job?gh_jid=8635225002` → 301
  2. `https://www.databricks.com/company/careers/open-positions/job?gh_jid=8635225002` → 301
  3. `https://www.databricks.com/company/careers/integration-data-engineering-and-applications/software-engineer-web-products-8635225002?gh_jid=8635225002` → 200

  The final URL after a 3-second wait was unchanged; page title "Software Engineer, Web Products -
  Databricks".
- **Cross-check:** the Greenhouse record for 8635225002 → HTTP 200, same title, Mountain View, CA,
  `updated_at` 2026-09-21T13:22:12-04:00.
- **Limitations:**
  - This is a point-in-time observation.
  - "Active" is the repo classifier's judgment from the page's status, URL, text, and apply
    controls. It does not show that the role is being filled, that it fits a January 2027 start,
    or that Databricks would sponsor this vacancy.
  - The page body text does not contain the job id; the id is tied to the page only through the
    final URL and the Greenhouse record.
  - The browser probe is ad-hoc code (shown in full in the evidence file), not a maintained script.
  - curl cannot see JavaScript redirects; the browser chain covers main-frame navigations only.

## Confirmed blocker 1 — upstream PII-scan finding

- **What CI runs:** `.github/workflows/contrib-gate.yml`, job `doctor-and-pii`: `npm install`,
  then `node scripts/doctor.mjs`, then **`node scripts/pii-scan.mjs` (working tree)**, then, on pull
  requests only, `node scripts/pii-scan.mjs --diff origin/<base>`.
- **Established locally:** the working-tree command exits 1 on the unchanged upstream revision (20)
  and on this branch (13). The sole finding is `package-lock.json` line 606 (glob@10.5.0's npm
  deprecation text, which contains a maintainer email address).
- **Contribution-scoped scan:** `--diff` mode scans only lines **added** in `<base>..HEAD`. This
  branch restores `package-lock.json` (15), so the line is not in the diff, and the diff scan is not
  expected to flag it. Measured after the commit: see Pass 3.
- **Observed in upstream's real CI (21):** on `015843d`, the step "PII scan (working tree)"
  failed after `npm install` and Doctor succeeded, so the Linux runner's `npm install` kept the line.
  That run was a push to `main`, so the diff step was skipped by its `if:` condition, not because of
  the failure.
- **Inferred, not observed:** on a pull request, the working-tree step runs before the diff step,
  and GitHub Actions skips later steps after a failure by default. The `doctor-and-pii` job on this PR
  is therefore expected to be red even if the contribution itself is clean. This applies to PRs whose
  head still contains that lockfile line under this workflow version. Not observed on an actual PR.
- **Not done:** no change to the scanner, the workflow, `package.json`, or `package-lock.json`.
- **Maintainer-resolution path:** the maintainer needs to decide one of the following. Each is a
  maintainer change outside the student namespace.
  1. Update `glob` (via `package.json`, CI-protected) and regenerate the lockfile so the deprecation
     text disappears.
  2. Make an explicit, reviewed scanner policy decision for npm registry metadata in
     `package-lock.json`.

  Until then, the student's PR body should cite evidence 06/13/20 and report the failure as
  pre-existing.

## Confirmed blocker 2 — upstream `harness-regression` job

- **Observed (21, 22):** upstream CI's `harness-regression` job failed on `015843d` at its first
  harness step. 4 of the 6 scripts the job calls do not exist at that revision, and running the first
  one locally gives `MODULE_NOT_FOUND`.
- **Consequence (inference):** any PR based on `015843d` will show this job red, whatever it
  contains.
- **Not done:** student harnesses belong to other students' namespaces; nothing was created or
  copied to fill the gap.
- **Maintainer-resolution path:** restore the four harnesses at the paths the workflow names, or
  update `contrib-gate.yml` (CI-protected) to the paths that exist. The PR body should cite
  evidence 21 and 22.

## Prototype tests

*Pending: the prototype has not been built.*

## Failure cases exercised

*Pending.*

## Clean-checkout verification

*Pending.*

## Scope check (`git diff --stat`)

*Pending.*

## What the gate requires a human to judge

*Pending.*
