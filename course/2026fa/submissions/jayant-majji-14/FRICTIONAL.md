# FRICTIONAL — swe-h1b-15-1252

## Executive summary
**What:** an honest log of what I tried, what broke, what I checked, and who (me or the AI) did what.
**Why:** the grade rewards an accurate account of the work, including the parts the AI did.
**Found:** 12 frictions; 4 of them were real problems in my own output that I only caught by checking.
**Did not do:** resolve the open questions at the end.

## Who did what (summary)
I worked through this with Claude (Anthropic) in one chat over two days.
- **Claude:** proposed the recipe design, tier rule, and timeline rule. Wrote the first drafts of `run.py`, `test_run.py`, the fixtures, README, recipe, card, CHANGE-BRIEF, domain justification, TEST-REPORT, worked run, and a first draft of this log. Gave me each command to run.
- **Me:** ran every command and reported the real output; forked, cloned, and committed; chose Software Engineer / SOC 15-1252 as my situation; found the live postings myself; judged the fit values and kept the 10–15 minute lookup estimate after thinking about my own job search; reviewed each draft before saving it; edited this file.
- **What I accepted without changes:** CHANGE-BRIEF, the tier thresholds (10 approvals), the 60-day hiring lag, and the domain-justification estimate. These are assumptions I agreed with, not things I independently validated.

## Log

| # | Tried | Expected | Happened | Response | Learned | Who | Trace |
|---|---|---|---|---|---|---|---|
| 1 | `npm run verify` on a fresh fork | clean pass | passed, but W2 warns `private/` and `data/ats/` are **not** gitignored | used only fictional personas; never touched those dirs | the assignment text and the repo can disagree; check the repo | me (ran), AI (spotted) | TEST-REPORT §1 |
| 2 | `npm install` | no file changes | `package-lock.json` modified | `git checkout -- package-lock.json` (twice) | install can dirty tracked files; check `git status` after | AI flagged, I restored | TEST-REPORT §5 |
| 3 | Scorer on the example data | a healthy run | skip rate 40%, below the repo's own 50% rule | noted, not fixed (not my file) | the example doesn't meet its own guideline | AI noticed | `runs/role-scores.md` |
| 4 | Read the scorer config | a funding term | **no funding term**; a missing `source` defaults to `record` | prototype always sets `source`; funding is report-only | a default label can silently overclaim | AI read the code | recipe "Facts that bite" |
| 5 | Find sponsorship by SOC in the CSV | a SOC column | none; only free-text titles | "software" title match as a labeled proxy | my core claim can't be verified directly | AI | recipe "cannot verify" |
| 6 | Find live postings at Abacus / 1upHealth | open SWE roles | none open | turned them into a network-target route | "no posting" is a networking lead, not a dead end | **me** (searched), AI (design) | commit 4832e93 |
| 7 | `ats:liveness` | a result | first run passed the literal text `<url>`; then the browser was missing | real URLs; `npx playwright install chromium` | read commands before pasting | me | `rea-notes/liveness-1.txt` |
| 8 | Liveness on Workday | "uncertain" (not a claimed ATS) | "active" | listed under "cannot verify" | a confident answer outside claimed scope isn't proof | AI | WORKED-RUN |
| 9 | First outputs | clean files | my home path `/Users/…` inside `run.json` | repo-relative paths (`rel()`) | PII includes paths, not just names | AI spotted, I applied | before 4832e93 |
| 10 | pii-scan | 0 findings | 1 finding in `package-lock.json` | proved it pre-existing on `origin/main` (d08afdd, line 606) instead of editing | prove "not mine" with git, don't hide it | AI (commands), me (ran) | TEST-REPORT §6 |
| 11 | Break test: past OPT date | exit 2 | printed `exit: 0` | re-ran without the pipe: exit 2 | `$?` after a pipe is the last command's code | AI caught it | TEST-REPORT §4 |
| 12 | Hand cross-check vs CSV | values match | matched, but showed 6sense's titles are 1 SWE + 1 non-SWE, and the scorer audit said `sponsorship [record]` for a p my rule produced | relabeled sponsorship `your-input`; added a test | my own output overclaimed; looking closely found it | AI saw it, I made the edits | commit c5ec21d |

Smaller frictions: `RUN_LOG.md` points to an entry template in `recipes/_shared.md` that doesn't exist (I mirrored the maintainer entries); doctor doesn't scan `recipes/cases/`, so my `todos_open` count isn't machine-checked; I saved `DOMAIN-JUSTIFICATION.md` outside my namespace and moved it before committing.

## What I rejected or changed from the AI
- Nothing in the code was rejected outright. The changes during the session came from checking the output (rows 9, 12), not from disagreeing with a draft.

## Unresolved questions
- Is 10 approvals a sensible "Proven" bar for software roles, given the CSV only lists *top* titles?
- Should a sponsorship tier ever be labeled `record`? The repo's own `ch11-roles.json` does it.
- How reliable is `ats:liveness` on Workday boards?
- Would a brand-name alias table be maintainable, or does it just move the guessing to a hand-edited file?