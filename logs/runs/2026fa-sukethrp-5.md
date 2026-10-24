# 2026fa-sukethrp-5 — ml-tailor-or-ask runs on v0.1.1 (history)

## Executive summary

The student re-ran the mode on version 0.1.1, which labels a company matched by name only as a name match. The new
fictional applicant, Kavya Raman, has prior full-time production machine-learning work. The runs gave:
- the sample: the same spread as before;
- the live run, on two real postings: both on hold, because the student left timing unset with a reason;
- the engine's scorer saying "apply" for a posting nobody checked, while the guard refused it;
- the student's own break attempt, stopping as they predicted.

Reading these reports turned up four problems, fixed in version 0.1.2 (log 6). These runs are kept as history.

## Run record

- **Date:** 2026-10-19, files written 15:31:44–15:32:17 EDT. Run ids `2026-09-30-sample-b4455f55` (sample) and
  `2026-10-19-live-9728208d` (live).
- **Run by:** the student, in their own terminal. The paste is in `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/v0.1.1-terminal-output.txt`, with the shell
  prompt shown as `$`.
- **Code:** commit `3a6ccf5`, recipe v0.1.1 · rules v0.2.0 (declared by the student).
- **Inputs:**
  - sample queue (chosen by Claude Code, model-judgment);
  - live queue `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live-v0.1.1/queue.json` (sha256 `9728208d8c86…`, chosen by the student, holding the student's
    identity decisions and their fit and timeline words);
  - personas `search/examples/priya-nair/` (sample) and `search/examples/kavya-raman/` (live), both fictional;
  - sponsorship file sha256 `eccdee2addf472b1…` (pinned).
- **Results:**
  - **sample:** TAILOR 1 · ASK FIRST 4 · MOVE ON 2 · HOLD 3 · scored 4;
  - **live:** HOLD 2 (Goodfire: timeline unset; Orenda: identity candidate and timeline unset) · scored 0;
  - **break pair:** the engine scorer gives Apply 1 and exit 0; the guard REFUSED with exit 3;
  - **the student's break** (fit 1.5, designed and predicted by the student): STOP at the input gate, exit 2, no
    run folder, the original queue unchanged (`git diff --exit-code` exit 0).
- **Gates cleared by a person:** G3, G7 and G8 by the student (identity decisions from Checkpoint 3; fit 0.55 and
  0.75; timeline unset with reasons).
- **Decisions:** none recorded in this run.
- **Open issues, all fixed in v0.1.2:**
  - the table did not show "no H-1B record";
  - a gap ASK FIRST dropped the sponsorship question;
  - "1 months";
  - "cannot verify" described one persona's CV in every report.
