# Run-log entries for this submission

## Executive summary

These are copies of the two run-log entries this Mode Build submission adds to the repo's run log. They are kept in `logs/runs/`, as CONTRIBUTING.md requires; `logs/RUN_LOG.md` itself is never edited. The brief asks for a RUN_LOG entry "in the submission", and these are it.

---

## 2026fa-sukethrp-3 — ml-tailor-or-ask run (sample)

### Executive summary

The student ran the mode on its sample list: ten made-up job postings at real companies, checked against the real
public sponsorship file for a fictional applicant. It suggested:
- tailoring an application for 1 posting;
- asking a specific question first at 4;
- moving on from 2;
- holding 3 that could not be checked.

All four kinds of outcome appear, so every branch of the mode ran. No decision was needed: the postings are
illustrative.

### Run record

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

---

## 2026fa-sukethrp-4 — ml-tailor-or-ask run (live)

### Executive summary

The student ran the mode live on two real, public ML engineer postings, Goodfire and Orenda, for a fictional
applicant, and made every gate call themselves.
- **Both postings were open:** an apply control was detected on each page.
- **Both stayed on hold, with nothing scored:**
  - the student confirmed Goodfire's company row from its legal terms and an SEC filing, but kept Orenda's row as an
    unconfirmed candidate;
  - they left fit and timeline unset because the facts needed to justify them are missing;
  - both companies have no H-1B history in the file, which means unknown, not "does not sponsor".

Naming either company does not imply confirmed sponsorship. An earlier automated attempt on the same queue failed to
launch its browser, and the mode held both postings instead of calling them closed.

### Run record

- **Date / run id:** 2026-10-19 (log generated 2026-10-19T11:22:06+00:00) · `2026-10-19-live-bd58ecec`
- **Run by:** the student, in their own terminal, into a new folder. Their first attempt stopped because
  `round-1/` already held a run. The terminal output of this run has not been pasted yet.
- **Recipe:** `recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md` v0.1.0 · rules v0.2.0 (declared by the student,
  sha256 `40f3e6bcac5d…`)
- **Mode:** live · **as_of:** 2026-10-19
- **Inputs:**
  - queue `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/queue.json` (sha256 `bd58ececd483…`),
    with postings chosen by the student;
  - persona `search/examples/priya-nair/profile.yml` (fictional);
  - sponsorship file sha256 `eccdee2addf472b1…` (pinned: yes).
- **Command:** `python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/queue.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-2-personal` (rebuilt from the run folder; to be confirmed against the student's pasted terminal output)
- **Outputs:** `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-2-personal/` holds report.md,
  run-log.json and `postings/`. The posting texts' sha256 values are `44ac3e2a8a4f…` (Goodfire, posting updated
  2026-06-09) and `f269d74b04f9…` (Orenda, posting updated 2026-10-14).
- **Result:** evaluated 2 · HOLD 2 · scored 0
- **Checks:**
  - liveness: `check-liveness.mjs` exit 0, both active; first hops HTTP 200 with no redirect;
  - requirements: Goodfire "5+ years" is 52 months short of the documented 8 months; Orenda "3+ years" is 28 months
    short and "2+ years" is 16 months short;
  - work conditions: one listed for each posting.
- **Gates cleared or held by a person** (sukethrp, 2026-10-19, in the queue):
  - G3 Goodfire: identity **confirmed**, row 11308 GOODFIRE AI INC. Sources: Goodfire's legal terms and an SEC Form D
    filing. The file's website stays unverified.
  - G3 Orenda: row 19228 ORENDA INC kept as a **candidate**, not cleared: the dataset lists orenda.io, which leads to
    a domain-for-sale page, while the employer uses orendapower.com.
  - G7 timeline, both: left **unset** ("Neither posting supplies an expected hiring duration or start date…").
  - G8 fit, both: left **unset** (the structured résumé omits a job listed in the persona's separate CV).
  - G11 decisions: Goodfire **HOLD**, Orenda **HOLD**, each with a written reason.
- **By hand:** the student displayed row 11308 from the CSV. GOODFIRE AI INC, San Francisco, CA, with all five H-1B
  fields blank.
- **Earlier automated attempt** (`round-1/`, log 2026-10-19T11:17:25+00:00, same queue):
  - its note says it was an automated session, not a personal run;
  - the Playwright browser launch was denied, so `check-liveness.mjs` exited 1;
  - both postings were held on liveness, never called closed;
  - before publishing, its captured error lines had the home folder replaced with `~`; see `round-1/NOTE.md`.
- **Open issues:**
  - reconcile the persona's résumé file with its CV;
  - confirm Orenda's identity;
  - obtain hiring-duration or start-date facts before stating a timeline;
  - paste the terminal output of this run.

### Addendum, 2026-10-19 13:43–13:44 EDT: re-runs by the student, with their output captured

Added afterwards; the entry above is unchanged. The student re-ran these in their own terminal and pasted the output
(prompt shown as `$`):
- `npm run score -- data/examples/ch11-roles.json --out-dir …/runs/anchor` gave Apply 2 · Consider 1 · Skip 2. This
  replaces the automated session's in-memory Checkpoint 2 reading.
- `npm run ats:liveness -- https://job-boards.greenhouse.io/goodfire/jobs/5019847008` gave 1 active.
- Break attempt: `npm run score` on `BROKEN-missing-liveness.json` gave Apply 1 (composite 0.4208, with the missing
  liveness gate labelled `record` in the scorer's trace); `guard.py` on the same file gave REFUSED.
- The same live queue, into `…/runs/live/round-3-panel/` (log 17:44:17 UTC): liveness exit 0, HOLD 2, scored 0, with
  posting-text hashes identical to round-2-personal.

The output of the round-2-personal run itself was never saved. Round 3 captures the same queue and result.
