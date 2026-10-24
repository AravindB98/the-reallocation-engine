# 2026fa-sukethrp-7 — ml-tailor-or-ask on v0.2.0: discovery, round 1 (history)

## Executive summary

The student ran version 0.2.0 on the fictional Kavya Raman's target list: Google, Amazon, Apple, Netflix and Meta,
plus seven companies whose job boards the engine can read.
- **The audit:** none of the five large employers has a readable board or an H-1B record in the file. They stay on
  the list for a manual check.
- **Discovery:** the mode read the seven boards and kept 21 machine-learning postings, with every dropped listing
  counted by reason.
- **The judge step:** all 21 waited only for the person's fit call.

Reading the report, Claude Code found that 8 of the 21 had no requirements read at all, yet showed "0 months
short". The student also asked for a review of two Pinterest postings. It found the lines under a bulleted "- Nice to
have:" read as required: six in one posting, five in the other, plus two under "- Preferred Qualifications:" in a
third. Both were fixed in version 0.2.1 (log 8).

## Run record

- **Date:** 2026-10-19, files written 18:25:42–18:26:27 EDT. Run ids `2026-09-30-sample-b4455f55` and
  `2026-10-19-live-cc1a5fd6`.
- **Run by:** the student, in their own terminal (`course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/v0.2.0-terminal-output.txt`).
- **Code:** commit `cd0d40a`, recipe v0.2.0 · rules v0.3.0 (adopted by the student, with their changes applied).
- **Inputs:**
  - targets `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/targets.json`: chosen by the student; legal names listed by Claude Code
    (model-judgment); time-to-start 22 weeks and the seven identity confirmations, both the student's words;
  - persona `search/examples/kavya-raman/` (fictional);
  - sponsorship file pinned.
- **Commands:** `discover.py --targets … --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-1`, then
  `tailor_or_ask.py --live --queue …/round-1/queue.json --out-dir …/round-1/judged`.
- **Results:**
  - **sample:** 1 / 4 / 2 / 3;
  - **discovery:** 12 companies, 7 boards read (Databricks 901 listings, Stripe 727, Airbnb 177, Pinterest 154,
    Figma 140, Reddit 151, Roblox 262), 21 postings kept. The raw listings are kept outside the repo; their SHA-256
    values are in `discovery-log.json`;
  - **judge:** HOLD 21, all on the shortlist (only fit unresolved), with the timeline computed at 0.65 (expected start
    2027-03-22);
  - **break pair:** exit 0 and exit 3;
  - **the student's break** (fit 1.5 on a copy of the discovered queue): exit 2, no run folder, the original queue
    has no fit.
- **Gates cleared by a person:** G0 (the target list and filters, chosen by the student) · G3 (seven identities
  confirmed by sukethrp, with what was checked) · G7 (22 weeks declared by the student) · rules 0.3.0 adopted by the
  student.
- **Decisions:** none recorded in this run.
- **Open issues:**
  - eight postings had no required section found and showed "0 months short";
  - Pinterest's bulleted "- Nice to have:" and "- Preferred Qualifications:" headings left 13 lines, across three
    postings, read as required.
  Both were fixed in v0.2.1.
