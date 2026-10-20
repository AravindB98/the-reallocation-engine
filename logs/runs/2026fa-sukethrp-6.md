# 2026fa-sukethrp-6 — ml-tailor-or-ask runs on v0.1.2 (history)

## Executive summary

The student re-ran the same commands on version 0.1.2, which fixed the four problems found in log 5. The results
were the same. Goodfire's verified-vs-inferred table now says plainly that the file has no H-1B record for it. The
student then asked for a mode that finds postings itself at the companies they care about, which became version
0.2.0 (log 7). These runs are kept as history.

## Run record

- **Date:** 2026-10-19, files written about 15:45 EDT. Run ids `2026-09-30-sample-b4455f55` and
  `2026-10-19-live-06f619e3`.
- **Run by:** the student, in their own terminal (`course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/v0.1.2-terminal-output.txt`).
- **Code:** commit `5a0634c`, recipe v0.1.2 · rules v0.2.0 (declared by the student).
- **Inputs:** as in log 5, with the live queue copied to `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live-v0.1.2/queue.json` (sha256 `06f619e35023…`; only
  its note changed).
- **Results:**
  - **sample:** 1 / 4 / 2 / 3, scored 4;
  - **live:** HOLD 2;
  - **break pair:** exit 0 and exit 3;
  - **the student's break:** exit 2, no run folder, the original queue unchanged.
- **Gates cleared by a person:** as in log 5.
- **Decisions:** none recorded.
- **Open issues:** the live run never reaches a suggestion while timing is unset, and the mode only judges postings
  someone typed in. Both are addressed in v0.2.0.
