# Run log — 2026fa-aditya-raj-sde-1

## Executive summary

This is the run record for one student's course contribution, "Sponsor & Posting Reality Check for
January 2027 Engineering Roles". The contribution checks whether a company has a record of visa
sponsorship and whether a specific job posting is still open. Read this entry to see which runs
happened, against what data, and with what result. So far only the setup baseline has run. The
existing role scorer and the job-board scan worked. The repository check, the privacy scan, and the
posting-liveness check did not pass, for environment reasons recorded below. The prototype has not
been built.

## Entries

Field layout from `recipes/_shared.md` (Logging Rules). Per the assignment and `CONTRIBUTING.md`,
these entries live here and never in `logs/RUN_LOG.md`.

## 2026-10-03 — Toolchain baseline (setup, before any prototype code)

- **Recipe:** manual (setup baseline; the case recipe
  `recipes/cases/2026fa/aditya-raj-sde-sponsor-live-jan2027.md` does not exist yet)
- **Run by:** Claude (Claude Code) on Aditya Raj's instruction; branch
  `contrib/2026fa-aditya-raj-sde-sponsor-live-jan2027`, cut from `015843d`
- **Inputs:** `data/examples/ch11-roles.json`; `data/ats/portals.example.yml` (via
  `REALLOCATION_ENGINE_PORTALS`); header of
  `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`; one read-only GET of
  the public Greenhouse board for Databricks
- **Commands:** `npm install`; `npm run doctor`; `npm run verify`; `node scripts/pii-scan.mjs`;
  `npm run ats:scan -- --dry-run` (twice); `npm run score -- data/examples/ch11-roles.json --out-dir
  course/2026fa/submissions/aditya-raj-sde/runs`; Playwright dependency check
- **Outputs:** `course/2026fa/submissions/aditya-raj-sde/evidence/00`–`11`;
  `course/2026fa/submissions/aditya-raj-sde/runs/role-scores.{json,md}`
- **Result:** doctor exit 0. Scorer exit 0 (5 example roles → Apply 2 · Consider 1 · Skip 2, skip
  40%). Scan dry-run with the example config exit 0 (1 company, 886 jobs found, 61 listed, nothing
  written).
- **Open issues:**
  - `npm run verify` exit 1: the manifest check needs PyYAML, which local `python3` lacks
    (conformance itself passed).
  - `pii-scan` exit 1: one email address in `package-lock.json` that is already present at upstream
    HEAD.
  - `ats:scan --dry-run` exit 1 without `portals.yml` (resolved by the documented env-var option).
  - `npm install` modified `package-lock.json` (36 `libc` metadata deletions); unstaged, disposition
    pending.
  - Liveness baseline pending: Playwright Chromium not installed; candidate URL awaiting human
    review.
  - Commit identity pending: noreply address not verifiable with the stored token's scopes.
  - Observed data limitation: the sponsorship CSV has no SOC codes and no per-year sponsorship
    columns.

## 2026-10-03 — Setup corrections and liveness baseline

- **Recipe:** manual (setup corrections; the case recipe does not exist yet)
- **Run by:** Claude (Claude Code) on Aditya Raj's instruction
- **Inputs:** Databricks posting gh_jid 8635225002
  (`https://databricks.com/company/careers/open-positions/job?gh_jid=8635225002`); Greenhouse public
  record for the same id; an unchanged worktree of `upstream/main` (`015843d`); upstream CI check runs
  and job steps (GitHub public API)
- **Commands:** `git restore package-lock.json`; `python3 -m venv .venv` + `pip install pyyaml`;
  `PATH="$PWD/.venv/bin:$PATH" npm run verify`; `npx playwright install chromium`;
  `npm run ats:liveness -- <URL>`; `curl -L` redirect trace; an inline Playwright probe;
  `node scripts/pii-scan.mjs` on the upstream worktree; `node scripts/test/gate-behavior-harness.mjs`
- **Outputs:** `course/2026fa/submissions/aditya-raj-sde/evidence/14`–`22`, `evidence/INDEX.md`
- **Result:**
  - `npm run verify` exit 0 with the venv (3 warnings).
  - Liveness: gh_jid 8635225002 `active` at 17:48 EDT (301 → 301 → 200; final URL carries the id).
    A point-in-time observation, not sponsorship evidence.
  - Lockfile identical to HEAD.
- **Open issues:**
  - **Confirmed upstream blocker 1:** `pii-scan` working-tree step fails on unchanged upstream (glob
    deprecation email in `package-lock.json`). Upstream CI `doctor-and-pii` failed on `015843d`.
  - **Confirmed upstream blocker 2:** upstream CI `harness-regression` failed on `015843d`; 4 of 6
    harness scripts named in the workflow are absent.
  - Both need maintainer action.
  - `npm install` will rewrite the lockfile again on every run.
