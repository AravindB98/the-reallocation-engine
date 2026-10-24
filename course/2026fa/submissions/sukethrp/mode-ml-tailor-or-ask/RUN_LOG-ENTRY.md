# Run-log entries for this submission

## Executive summary

These are copies of the six run-log entries this Mode Build submission adds to the repo's run log, one per logged run (3 and 4 on v0.1.0, 5 on v0.1.1, 6 on v0.1.2, 7 on v0.2.0, 8 on v0.2.1, the final version). They are kept in `logs/runs/`, as CONTRIBUTING.md requires; `logs/RUN_LOG.md` itself is never edited. The brief asks for a RUN_LOG entry "in the submission", and these are it.

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

### Correction, 2026-10-20 (append-only; the entries above are unchanged)

Two lines above went stale once later evidence existed:
- The **Command** line says it was "rebuilt from the run folder; to be confirmed". That round-2-personal output was
  never saved. The student's round-3 re-run of the same queue, with its command and output pasted verbatim, is in
  `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-3-panel/terminal-output.txt`.
- The **Outputs** line names `postings/` in the run folder. The posting texts were moved outside the repository
  (they are third-party text). Each run log keeps the API URL and the SHA-256 of what was read.

---

## 2026fa-sukethrp-5 — ml-tailor-or-ask runs on v0.1.1 (history)

### Executive summary

The student re-ran the mode on version 0.1.1, which labels a company matched by name only as a name match. The new
fictional applicant, Kavya Raman, has prior full-time production machine-learning work. The runs gave:
- the sample: the same spread as before;
- the live run, on two real postings: both on hold, because the student left timing unset with a reason;
- the engine's scorer saying "apply" for a posting nobody checked, while the guard refused it;
- the student's own break attempt, stopping as they predicted.

Reading these reports turned up four problems, fixed in version 0.1.2 (log 6). These runs are kept as history.

### Run record

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

---

## 2026fa-sukethrp-6 — ml-tailor-or-ask runs on v0.1.2 (history)

### Executive summary

The student re-ran the same commands on version 0.1.2, which fixed the four problems found in log 5. The results
were the same. Goodfire's verified-vs-inferred table now says plainly that the file has no H-1B record for it. The
student then asked for a mode that finds postings itself at the companies they care about, which became version
0.2.0 (log 7). These runs are kept as history.

### Run record

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

---

## 2026fa-sukethrp-7 — ml-tailor-or-ask on v0.2.0: discovery, round 1 (history)

### Executive summary

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

### Run record

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

---

## 2026fa-sukethrp-8 — ml-tailor-or-ask on v0.2.1: round 2, with the student's fit calls

### Executive summary

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

### Run record

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

