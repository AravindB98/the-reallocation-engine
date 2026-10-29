# Setup exercise: the search's personal layer (AravindB98)

## Executive summary

This folder records how one student's personal job-search files (an attested resume record, a profile of constraints, and a list of gaps) were built for the course's setup exercise. Read it to find where those files are and why they are not in this public repository: they hold real personal data, which this project never commits. What was found: three numbers on the student's own resume did not survive a check against the projects they describe, and were corrected in the private record.

The three real files (`search/resume.json`, `search/profile.yml`, `search/gaps.md`) and `search/private-notes.md` exist in my local clone under `search/` and are **not in this fork**: `/search/*` is gitignored at the root, `resume.json` is blocked by `scripts/doctor.mjs`, and DATA_CONTRACT.md (Zero-Conditions) calls a committed real resume a zero-condition offense. The repo's own `docs/tutorials/00-personal-layer.md` Step 0 says the same. They were submitted to Canvas as a file upload instead.

What this fork carries for the exercise:

| Path | What it is |
|---|---|
| `logs/runs/2026fa-AravindB98-1.md` | the run-log entry: what was built, the three attestation errors, the top gap, the killed row, the corrected profile field, the Step 4 verification answers |
| `search/examples/cyrus-a-vane/` | a fictional persona with the same three-file shape (F-1, December 2026 program end, OPT not filed, CIP code unconfirmed, AI-startup target, sponsorship as a gate). Proposed in the Week 3 mode file; added here |
| `course/2026fa/submissions/AravindB98/setup-exercise/AI-USE-DISCLOSURE.md` | the AI-use disclosure |

Nothing in the three real files is reproduced here. The Canvas upload also holds the agent's first drafts of all three files, so each correction is a diff, and the output of the check script I ran on my own laptop (`git check-ignore`, JSON and YAML validation, `node scripts/doctor.mjs`, `git status`).
