# 2026fa-sukethrp-4 — ml-tailor-or-ask run (live)

## Executive summary

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

## Run record

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

## Addendum, 2026-10-19 13:43–13:44 EDT: re-runs by the student, with their output captured

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

## Correction, 2026-10-20 (append-only; the entries above are unchanged)

Two lines above went stale once later evidence existed:
- The **Command** line says it was "rebuilt from the run folder; to be confirmed". That round-2-personal output was
  never saved. The student's round-3 re-run of the same queue, with its command and output pasted verbatim, is in
  `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-3-panel/terminal-output.txt`.
- The **Outputs** line names `postings/` in the run folder. The posting texts were moved outside the repository
  (they are third-party text). Each run log keeps the API URL and the SHA-256 of what was read.
