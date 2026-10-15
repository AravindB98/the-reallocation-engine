# FRICTIONAL — honest log

## Executive summary

This logs what I actually tried, what Claude (the AI agent) actually did, where
the two diverged, and what's still unresolved — written as the honesty rule
requires: distinguishing my work from the AI's, not blending them into one
voice. The last section before Traceability is a revision written on
2026-10-14, after grading, in my own words.

## What I tried and what happened

I started by pasting the full assignment brief to Claude and asking what it
was and how to do it. Claude read it back to me in its own structured summary
before anything was built — I used that to confirm I understood the shape of
the deliverable correctly (recipe + card + prototype + tests + writeups + PR).

I had not yet forked the repo at that point. Claude asked directly whether I
had, and when I said no (I'd only cloned the main repo), it told me I needed a
real fork — not a copy — because the assignment requires pushing to my own
namespace and opening a PR from it, not pushing to the instructor's repo
directly. I forked it myself via github.com and renamed the local folder; I
confirmed the rename to Claude mid-task, which it picked up and re-verified
(checked `git remote -v` itself rather than taking my word for it).

I made the actual domain decision: MS Software Engineering student, SWE/AI/
DevOps roles, H-1B focus. When asked to narrow it further, I picked the
"sponsorship + funding filter" angle over "OPT countdown" or "cognitive-fit"
when given the choice — I wanted the recipe to use the engine's central
data join rather than a narrower slice. I also picked the placeholder OPT
date (2027-03-15) and the slug name.

## What I checked, changed, or learned in response

I didn't write any of the Python or Markdown myself in this session — Claude
did the file-level work (reading the CSV/scorer/recipe-style files, writing
`build_roles.py`, the fixture, the test, the recipe, the card, and the
reports). What I did do: approved the plan before any `recipes/`/`data/`
edits happened (the repo's own `CLAUDE.md` requires plan-mode for that, and
Claude followed it without being told to), asked what two shell commands did
before approving them rather than blindly accepting, and asked where the
`TEST-REPORT.md` would actually live when I lost track of it mid-session.

**Unresolved question I still have:** whether the 45-day hiring-lag assumption
in the timeline gate is realistic for H-1B-sponsoring tech employers
specifically, versus a generic number. I haven't independently verified this
against any outside source yet — it's disclosed as an assumption in the
recipe and prototype output, not presented as researched.

## Explicit human/AI contributions

- **Mine:** the domain, the recipe angle choice, the OPT-date placeholder and
  slug, approving the fork/branch setup, reading and confirming the plan
  before implementation, catching that I needed to ask what a bash command did
  before running it.
- **Claude's:** all repo exploration (recipe style conventions, data shapes,
  the scorer's actual gate-default behavior), all file authorship
  (`build_roles.py`, the test, the fixture, the recipe + card, run.sh,
  README, TEST-REPORT, worked run, this file), running every command and
  reporting real output, and surfacing the Skip-rate finding in the worked run
  unprompted — I didn't notice that discrepancy myself; Claude's own
  `TEST-REPORT.md` draft flagged it before I read the scored output closely
  enough to have caught it myself.
- **What I accepted as-is:** the recipe/card structure (I don't have a basis
  to second-guess SNICKERDOODLE-style recipe conventions I'd never seen
  before this assignment), the keyword list for SWE/AI/DevOps titles.
- **What I'd want to revisit before calling this VERIFIED (not just
  RUNNABLE-SAMPLE):** the liveness-placeholder behavior named in the worked
  run's "next improvement" — I agree with the proposed fix but haven't
  implemented or tested it myself.

## 2026-10-14 — Revision after grading

**My reaction to the TA's comments.** I agree with them. I should have made the
recipe specific to my situation, and I should not have put RUNNABLE-SAMPLE
while TODOs were still open; it should have been DRAFT. The liveness number
should not have been invented, and the postings should have been checked for
liveness. I also should have written my own views in this file.

**What I expected vs. what happened.** Before the check ran, I thought all five
postings would be live. Four came back active and one, Datadog, came back
uncertain. When it came back uncertain, I thought it was because that when checker checked for the posting the content was present but no visible apply control found

**What I checked by hand.** I checked every link manually. The checker marked
the Datadog posting uncertain because it did not find an apply button, but
instead of the button the page had an "Apply for this job" form, so I noticed
the posting was still live. I recorded that as my own gate decision
(`liveness/gate-decisions.csv`, with a screenshot), and the posting is scored
with its liveness labeled as my judgment, not as the checker's record.

**What I accepted or rejected.** I accepted all of the fixes: re-marking the
recipe DRAFT, the new liveness gate that holds unchecked roles out of the
scorer, the held-out files, and checking real postings instead of leaving
everything unscored. I gave the time numbers in the domain justification myself
(5 minutes per posting, 40–50 postings a day), and I made the gate decision on
the Datadog posting myself. Claude Code wrote the code and
document changes, picked the five postings from public job boards, and ran the
checker and the prototype.

**What I learned.** Not to invent numbers. If there are TODOs open, the recipe
is a draft, not RUNNABLE-SAMPLE. And I should write my own views in this file.

## Traceability

- This session's conversation is the record of the back-and-forth described
  above.
- `course/2026fa/submissions/iyashsaraf/CHANGE-BRIEF.md` — predictions written
  before the build, with a dated Revisions section added after the real run
  (not edited into the original text).
- `logs/runs/2026fa-iyashsaraf-1.md` — the run-log entry for the real sample
  run.
- `course/2026fa/submissions/iyashsaraf/TEST-REPORT.md` and `WORKED-RUN.md` —
  every command run and its real output.
- `logs/runs/2026fa-iyashsaraf-2.md` — the 2026-10-14 re-run, and
  `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/liveness-check.txt`
  — the unedited liveness-checker output it used.
- `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/gate-decisions.csv`
  and `liveness/datadog-R21399-2026-10-14.png` — my gate decision on the
  Datadog posting and the screenshot I took when I opened it.
