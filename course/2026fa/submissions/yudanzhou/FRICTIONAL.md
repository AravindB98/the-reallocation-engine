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
