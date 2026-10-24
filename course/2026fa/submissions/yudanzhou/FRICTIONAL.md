# FRICTIONAL — honest log

## Executive summary

This is my running log of what I actually tried while building my Reallocation Engine recipe, what went wrong, and what I or the AI assistant did about it. Each entry says who did the work: **Me** (yudanzhou) or **AI** (Claude Code, used as a tutor and pair programmer).

---

## 2026-10-02 — Session 1: getting the engine running

| # | Attempt | Expected | What happened | Response | Who |
|---|---|---|---|---|---|
| 1 | Forked `nikbearbrown/the-reallocation-engine` on GitHub | Fork created | Worked | — | Me |
| 2 | Cloned the fork into a deep app folder | Clone succeeds | `fatal: ... Filename too long`. The Windows path limit was exceeded | Re-cloned into a short path, `C:\Users\zyud0\the-reallocation-engine` | AI ran it, I picked the folder |
| 3 | `npm install`, then `npm run doctor` | Environment OK | `environment: ✓ runnable`. 33 top-level recipes have no lifecycle frontmatter (matches "Facts that bite" #6) | None needed | AI ran it |
| 4 | `npm run verify` | Pass | Failed with `ModuleNotFoundError: No module named 'yaml'` | AI installed `pyyaml` with `python -m pip`. **Still failed**, because on my machine `python` and `python3` are two different Python installs. Reinstalled with `python3 -m pip install --user pyyaml` | AI |
| 5 | `npm run verify` again | Pass | Failed with 6× `E3 ... is out of sync with instructions/` | Cause: git on Windows converts line endings to CRLF (`core.autocrlf=true`), and the check compares files byte for byte. Set `git config core.autocrlf false` for this repo only and re-checked out. Then `✓ manifest check passed (3 warnings)` | AI diagnosed, I accepted |
| 6 | `npm install` changed `package-lock.json` | No tracked changes | `M package-lock.json` | Reverted with `git checkout -- package-lock.json` so it won't appear in my PR | AI |
| 7 | `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/yudanzhou/runs` | A report | `scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)`. Output saved in `runs/00-baseline-output.txt` | — | AI ran it |

**What I learned:** "it runs on the instructor's machine" ≠ "it runs on mine." Two of the three failures were Windows-specific (path length, line endings), not bugs in the code.

**Unresolved questions:** Is my program STEM-designated (CIP code on my I-20)? That decides how long my OPT window is.

## 2026-10-02 — Session 1 (continued): brief, prototype, tests

| # | Attempt | Expected | What happened | Response | Who |
|---|---|---|---|---|---|
| 8 | Checked my I-20 CIP code | Know whether I'm STEM | 14.0903 (Computer Software Engineering), which is on the DHS STEM list | Persona uses STEM-eligible = assumed; final answer is the DSO's | Me (looked it up), AI explained |
| 9 | Described my situation to the AI | — | AI counted the CSV: 27,874 funded, only 1,532 with H-1B approvals; blank approvals 28,812 vs. explicit 0 only 5 | I chose the "funded × sponsor × role family" direction | AI counted, I chose |
| 10 | Wrote my own prediction: "companies with no OPT record may still have hired OPT" | — | AI pointed out OPT needs no employer sponsorship; the data has **H-1B** records, not OPT | I reworded it to "no H-1B record ≠ won't hire OPT grads" and it went into CHANGE-BRIEF §6 before any code | Me, corrected with AI |
| 11 | Committed CHANGE-BRIEF before building | Timestamp predictions first | Commit `1589834` | — | Me (approved), AI ran git |
| 12 | First prototype run | Report written | `UnicodeEncodeError: 'charmap' codec can't encode character '✓'`. The Windows console can't print ✓ | AI added UTF-8 reconfigure in `triage.py main()`; re-ran OK | AI |
| 13 | Read the sample result | Mostly sensible | Deloitte Consulting scored **Apply** because the CSV calls it "Series C". Not the kind of "funded startup" I meant | Not fixed. Logged as the recipe's main weakness and the next improvement in WORKED-RUN | Noticed by AI; I agree it's wrong for me |
| 14 | Tried passing a profile to the scorer | Profile respected | A profile with `needs_sponsorship: true` but text "work authorized" → scorer says "does NOT require sponsorship" | Did not touch the shared scorer (outside my namespace). My prototype passes no profile; documented as an upstream bug | AI found and reproduced it |
| 15 | Clean-checkout test | Same results | All 11 tests pass. `doctor` now shows 33/33 recipes with frontmatter; the earlier 0/33 was **also** the CRLF problem | Output saved to `runs/01-clean-checkout-output.txt` | AI ran it |

| 16 | Opened PR #13 by pasting our own description | PR accepted as-is | Other students' PRs showed "7 tasks done". The repo has `.github/PULL_REQUEST_TEMPLATE.md` with a 7-box checklist ("an unchecked box is an auto-request-changes"), and our paste replaced it | Rewrote the PR description on top of the template. Checking each box honestly showed one I failed: DATA_CONTRACT says fictional personas live in `search/examples/`, but mine was in my contrib `fixtures/`. Moved it to `search/examples/is-ms-2027-funded-undecided/`, updated paths, re-ran sample + tests (same results), re-submitted the ZIP | I noticed the "7 tasks done"; AI found the template and the persona rule |

**What I learned:** a blank cell is not a zero. The single design decision that matters most in my prototype is refusing to turn "no record" into "no".

**Still unresolved:**
- My self-rated fit numbers (0.8 / 0.7 / 0.6 / 0.6) and the 60-day hiring lag are placeholders I need to think about.
- The time-saved estimate in DOMAIN-JUSTIFICATION is a rough guess I haven't timed.
- Should I report the scorer bug to the instructor as an issue?
