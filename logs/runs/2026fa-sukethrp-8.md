# 2026fa-sukethrp-8 — ml-tailor-or-ask on v0.2.1: round 2, with the student's fit calls

## Executive summary

The student ran version 0.2.1 on the same 21 discovered postings, adding a fit with their reason for three of them,
their own question for one, and a manual hold for another. Version 0.2.1 reads requirements honestly: a posting
whose requirements cannot be found holds, and every read line shows its heading. Three real postings now reach
"ask first":
- **Stripe's Machine Learning Engineer, Radar:** the sponsorship evidence is soft, so it asks whether Stripe
  sponsors ML engineers at this level;
- **Reddit's Machine Learning Engineer, Answers Relevance:** it carries the student's own question about the
  four-year minimum;
- **Pinterest's Master's University Grad MLE:** the student recorded a hold until the graduation window, cohort
  date and eligibility are checked.

The other 18 wait for the person's fit call. The report shows what changed for each posting since round 1.

## Run record

- **Date:** 2026-10-19, files written 23:59:32–23:59:53 EDT, so the run date was 2026-10-19. Run ids
  `2026-09-30-sample-b4455f55` and `2026-10-19-live-587a1a57`.
- **Run by:** the student, in their own terminal (`course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/v0.2.1-terminal-output.txt`).
- **Code:** commit `4f17ec2`, recipe v0.2.1 · rules v0.3.1 (the student's heading decision).
  `discover.py`, `timeline.py` and the discovery rules are unchanged since `cd0d40a`, so log 7's discovery stands.
- **Inputs:** queue `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-2/queue.json` (sha256 `587a1a57048b…`). It is the round-1 queue plus
  the student's words, transcribed verbatim:
  - fits: Stripe Radar 0.80, Reddit Answers Relevance 0.65, Pinterest Master's University Grad 0.60, each with its
    reason;
  - the student's question for Reddit;
  - a HOLD decision for Pinterest.
- **Command:** `tailor_or_ask.py --live --queue …/round-2/queue.json --out-dir …/round-2/judged --compare
  …/round-1/judged/run-log.json`.
- **Results:**
  - **sample:** 1 / 4 / 2 / 3;
  - **round 2:** ASK FIRST 3 · HOLD 18 (all 18 on the shortlist) · scored 3:
    - Stripe Radar: scorer Consider 0.2925;
    - Reddit Answers Relevance: scorer Apply 0.3315, ASK FIRST on its stated minimum, which Kavya misses by 13
      months counting every documented month and by 24 counting only full-time months;
    - Pinterest Master's: scorer Consider 0.2535, with the student's HOLD beside it;
  - **timeline:** 0.65 everywhere (22 weeks; expected start 2027-03-22);
  - **break pair:** exit 0 and exit 3;
  - **the student's break** (Stripe Radar fit 1.5): exit 2, no run folder, the original 0.8 unchanged.
- **Gates cleared by a person:** as in log 7, plus:
  - G8 fit for three postings, by the student;
  - G11 one decision (Pinterest, HOLD, by sukethrp);
  - rules 0.3.1 adopted by the student.
- **Decisions:** Pinterest Master's University Grad MLE 2027: HOLD by sukethrp on 2026-10-19. The reason is in the
  queue and the report.
- **Open issues:**
  - one Figma posting's text holds a company contact email address. The committed copy of round 2's report.md and
    run-log.json shows it as "[email removed]" (`…/round-2/judged/NOTE.md`); the unedited files are kept outside the
    repo. v0.2.1 does not strip addresses from posting lines;
  - no posting reaches TAILOR at a timeline factor of 0.65;
  - new-grad windows, cohort dates and the big five's careers sites remain manual checks.
