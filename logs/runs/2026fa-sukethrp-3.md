# 2026fa-sukethrp-3 — ml-tailor-or-ask run (sample)

## Executive summary

The student ran the mode on its sample list: ten made-up job postings at real companies, checked against the real
public sponsorship file for a fictional applicant. It suggested:
- tailoring an application for 1 posting;
- asking a specific question first at 4;
- moving on from 2;
- holding 3 that could not be checked.

All four kinds of outcome appear, so every branch of the mode ran. No decision was needed: the postings are
illustrative.

## Run record

- **Date / run id:** 2026-10-19 (log generated 2026-10-19T11:56:08+00:00) · `2026-09-30-sample-b4455f55`
- **Run by:** the student, in their own terminal. The paste is in
  `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample/terminal-output.txt`, with the shell prompt
  shown as `$`.
- **Recipe:** `recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md` v0.1.0 · rules v0.2.0 (declared by the student,
  sha256 `40f3e6bcac5d…`)
- **Mode:** sample · **as_of:** 2026-09-30, the date of the synthetic page snapshots
- **Inputs:**
  - queue `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/sample-queue.json` (sha256 `b4455f556987…`),
    chosen by Claude Code, so its values are model-judgment;
  - persona `search/examples/priya-nair/profile.yml` (fictional);
  - sponsorship file sha256 `eccdee2addf472b1…` (pinned: yes).
- **Command:** `python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample`
- **Outputs:** `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample/` holds report.md, run-log.json,
  roles.json, role-scores.json and role-scores.md.
- **Result:** evaluated 10 · TAILOR 1 · ASK FIRST 4 · MOVE ON 2 · HOLD 3 · scored 4 · move-on rate 20%
- **Gates:** G1 input pass · G2 source pin pass · G9 guard pass (4 roles) · G10 scorer contract pass. G11 human
  decision not used: illustrative postings.
- **Open issues:**
  - The sample's "Meta" matches row 16612, META CO (Portola Valley, CA), not Meta Platforms. This is shown in the
    report, and it is the reason identity is typed proposal 7.
  - The persona's résumé file omits a job its CV lists.
