# Submission note -- ghost-job-radar (Mode Build)

## Executive summary

This note lists what is in the submission, how far the mode got, and every place where I did not follow the assignment text exactly, with the reason. The mode is for an international master's student on an F-1 visa who is looking for data analyst jobs. It checks whether a posting is still open and whether the hiring timeline fits the student's work-authorization window, and only then looks at the company's sponsorship history. It ran once on a real public posting and is rated sample-run level: one company, one day, with one result carried between steps by hand.

## Contents

| Item | Location |
|---|---|
| Mode file (recipe) | `recipes/cases/2026fa/dmehta1310-case-f1-data-analyst-soc-15-2051-ghost-job-radar.md` |
| Mode card | `recipes/cases/2026fa/dmehta1310-case-f1-data-analyst-soc-15-2051-ghost-job-radar.card.md` |
| Domain justification | `assignments/submissions/dmehta1310/DOMAIN-JUSTIFICATION.md` |
| Worked run with attestation | `assignments/submissions/dmehta1310/WORKED-RUN-MODE-BUILD.md` |
| RUN_LOG entry | `assignments/submissions/dmehta1310/RUN_LOG-ENTRY.md` |
| Raw evidence (dated 2026-10-19) | `assignments/submissions/dmehta1310/evidence/2026-10-19/` |
| Scripts and tests | `scripts/contrib/2026fa/dmehta1310-ghost-job-radar/` |
| Per-run log | `logs/runs/2026fa-dmehta1310-2.md` |

## Pull request and lifecycle stage

- Pull request: https://github.com/nikbearbrown/the-reallocation-engine/pull/57. It supersedes PR #1 (https://github.com/nikbearbrown/the-reallocation-engine/pull/1), which is closed with a link to this one.
- Branch: `mode/dmehta1310-data-analyst`
- Lifecycle stage: RUNNABLE-SAMPLE. There is no logged clearance of both gates by a named human on a real posting, so it is not RUNNABLE-LIVE.

## Deviations from the assignment text

1. **RUN_LOG entry.** It is included in this folder and as a per-run log in `logs/runs/`; it was not appended to `logs/RUN_LOG.md`. The repository's CI rejects student PRs that edit that file.
2. **Mode file location and name.** It is under `recipes/cases/2026fa/` (inside `recipes/`) with a handle-prefixed name, because the contribution rules place student recipes there until a maintainer promotes them.
3. **Scripts.** They live under `scripts/contrib/2026fa/dmehta1310-ghost-job-radar/`, the namespace the contribution rules require.
4. **`ats:scan` command form.** It was run as `node scripts/ats/scan.mjs --dry-run` from an empty scratch directory with a public portals file, not as `npm run ats:scan -- --dry-run`, because the default reads private files.
5. **Submission folder.** `assignments/submissions/` is outside the folders CI checks, so CI flags it for maintainer review; it is a warning, not a failure. The contribution rules name `course/<term>/submissions/<handle>/` for this material.
6. **Fictional dates.** The program end date (2027-05-15) and hiring lag (6 weeks) in the run are fictional.
7. **Moved evidence.** The evidence folder was moved here from `course/2026fa/submissions/dmehta1310/evidence/` after the run, so some command lines pasted in the worked run still show the old path. They are left unedited because they record the commands as run.
8. **Superseded PR.** PR #1 is closed in favor of this PR, as the contribution rules require when a new PR is opened.
9. **Earlier submission files.** Files from the earlier assignment stay under `course/2026fa/submissions/dmehta1310/` (they are already part of PR #1's history).

## Known CI issue not caused by this work

`scripts/pii-scan.mjs` exits 1 on an email address in the upstream `package-lock.json`. The diff-based scan against the upstream base branch is clean.
