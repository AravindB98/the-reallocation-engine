# FRICTIONAL — Assignment 2: Mode Build (Aditya Raj, INFO 7375 Fall 2026)

## Executive summary

This is the honest process log for the second course assignment: building a focused, working
"mode" of a job-search evidence system that helps an experienced backend engineer decide which
specific job openings are worth applying to for a January 2027 start. It records what was
attempted, what was expected and by whom, what actually happened, which decisions were made, and
what remains uncertain. Read it to see how the work was done and who did which part, separate from
what was produced. So far the work is at the planning stage: the repository and requirements have
been inspected and a scope proposal is awaiting review. Nothing has been built yet.

## How to read this log

- Entries are dated, carry an identifier (`A2-<date>-E<nn>`), and are append-only. Earlier entries
  are never rewritten; corrections are added as new entries that point back.
- **Claude** = the AI coding agent (Claude Code, model `claude-opus-5-5`) acting in this repository
  on Aditya's instruction. **Aditya** = the student. Each entry says who acted.
- Aditya's expectations, checks, approvals, and learning are recorded only from Aditya's own
  words. Where Aditya has not yet supplied them they are marked **pending — Aditya to write**.
  Claude does not write them for Aditya.
- Claude's own predictions are labelled "Claude predicted".
- No résumé content, immigration details, or contact information appears here. Planning against
  the real profile is kept outside the tracked tree.
- Assignment 1's log (`../FRICTIONAL.md`) is preserved unchanged; this is a separate file.

---

## A2-2026-10-20-E01 — Session 1 start: request received, repo state checked, log initialized

*Contemporaneous. Clock reading at start of inspection: `date` → `Tue Oct 20 23:20:04 EDT 2026`.*

- **Aditya's request (privacy-safe excerpt):** "Begin with an audit and a concrete implementation
  plan. Do not implement the mode until I review the proposed scope." Also: start this log before
  substantive work; fetch (not pull) `origin` and `upstream`; do not touch PR #45, the graded
  commit, or the Assignment 1 ZIP; no commit or push yet.
- **Expectations / predictions:**
  - Aditya: none stated in this request beyond the scope above — **pending — Aditya to write** if
    Aditya had a prediction (e.g. about how much of Assignment 1 is reusable).
  - Claude predicted: most of Assignment 1's sponsorship/liveness logic is reusable; the new work
    is the role/experience, technical-relevance, and start-window checks, plus a real-posting sample.
- **What Claude executed (read-only except this file):**
  - `git rev-parse --show-toplevel` → repo root `/Users/adityaraj/Desktop/the-reallocation-engine`.
  - `git status --short --branch` → branch `contrib/2026fa-aditya-raj-sde-sponsor-live-jan2027`,
    clean, tracking `origin/…` with no divergence.
  - `git rev-parse HEAD` → `1a618e73742df2a61947878263697fcca81f4d1c` (= the graded commit).
  - `git remote -v` → `origin` = fork `aditya-raj-sde/the-reallocation-engine`; `upstream` =
    `nikbearbrown/the-reallocation-engine`.
  - `git fetch origin`, `git fetch --verbose upstream` → exit 0, "[up to date]"; `upstream/main` =
    `origin/main` = local `main` = `015843d` (2026-09-23). Graded commit is 22 commits ahead of
    `upstream/main` and not contained in it.
  - GitHub REST (`curl …/pulls/45`) → PR #45 **state: open, merged: false**, head SHA = graded commit.
  - Read `CONTRIBUTING.md`, `DATA_CONTRACT.md`, `DOMAIN.md`, `recipes/README.md`,
    `PROJECT_RULES.md`, `_MANIFEST.md`, `course/README.md`, `recipes/cases/README.md`,
    `scripts/contrib/README.md`, `.github/PULL_REQUEST_TEMPLATE.md`,
    `.github/workflows/contrib-gate.yml`, and the course `prerequisites/frictional.md` (fetched to
    stdout).
  - Recorded SHA-256 of Assignment 1's log before creating this one:
    `c7ae03e0aacf1e855f427baf41faa53a76aecec0…` (to verify it stays unchanged).
- **Location check (Claude):** `course/2026fa/submissions/aditya-raj-sde/assignment-2/` matches the
  contrib-gate allowlist pattern `^course/[^/]+/submissions/` and `git check-ignore` reports it is
  not ignored. `course/README.md` permits files only under one's own handle directory — satisfied.
- **Friction (Claude, minor):** a shell `echo =====` separator failed under zsh (`=` expansion);
  re-ran with quoted separators. No effect on findings.
- **Aditya attempted / checked / accepted:** **pending — Aditya to write.**
- **Next step:** read the résumé (locally, private), both assignment PDFs, and the Assignment 1
  artifacts; then append the audit entry.

## A2-2026-10-20-E02 — Session 1: read-only audit and scope proposal (Claude)

*Contemporaneous. Written at `date` → `Tue Oct 20 23:27:23 EDT 2026`, at the end of the audit.*

- **What Claude executed (all read-only; only this log was written):**
  - Read both assignment PDFs with `pdftotext` (Assignment 2: 7 pages, printed from Canvas
    2026-10-20 21:58; Assignment 1: 13 pages).
  - Fetched to stdout: course `prerequisites/ai-policy.md`, `github-submission.md`,
    `relative-quartile.md`; listed the course `assignments/` folder (no Markdown version of the
    Mode Build assignment exists there, so the PDF is the only source).
  - Read Aditya's résumé PDF locally. **Its contents are not recorded here or in any tracked
    file.** The private mapping stayed in the chat.
  - Read Assignment 1's recipe, card, `reality-check.mjs`, domain justification, worked-run header,
    submission manifest, run-log header, and evidence 19 and 43. Listed the maintained ATS, scorer,
    and fetch scripts, the fictional personas, and the `greenhouse-watch` skill.
  - Integrity check: Assignment 1 log SHA-256 still `c7ae03e0aacf1e85…` (unchanged); Assignment 1
    ZIP SHA-256 `bd9c3e0275e259de…`, its archive comment = graded commit `1a618e7`. `git status`
    shows only this new untracked folder; HEAD still `1a618e7`.
- **Recorded Assignment 1 results vs. this session:** every Assignment 1 number cited in the audit
  (18 tests, 9-posting sample with 1 real posting, 2/9 skips) comes from Assignment 1's committed
  evidence. **Nothing from Assignment 1 was re-run in this session.**
- **Friction / conflicts found (Claude's reading; none resolved yet — each needs Aditya's
  decision):**
  1. **Due date.** The PDF says "Due Wednesday by 23:59" and was printed Tuesday 2026-10-20. That
     most likely means 2026-10-21, about 24 hours away. Not confirmed.
  2. **Branch name.** The PDF says `mode/<yourname>-<domain>`; `CONTRIBUTING.md` says
     `contrib/<term>-<handle>-<component>`.
  3. **Paths.** The PDF says the mode file goes under `recipes/` and write-ups under
     `assignments/submissions/<yourname>/`. The repo contract says `recipes/cases/2026fa/` and
     `course/2026fa/submissions/<handle>/`. CI only warns on paths outside the namespaces, and
     top-level `recipes/` needs maintainer promotion.
  4. **Run log.** The PDF says to append to `logs/RUN_LOG.md` "or include it in your submission".
     CI hard-fails student edits to that file. → `logs/runs/2026fa-aditya-raj-sde-2.md`.
  5. **Grading map.** The Assignment 2 rubric is 80 points (Mode Design 24, Domain Justification
     20, Worked Run 16, Presentation 20) plus 20 for quartile. It has no Frictional or GitHub-posting
     line. The course AI policy says every graded assignment is 60 + 10 Frictional + 10 GitHub +
     20 quartile. The quartile bands also differ (PDF 8–15 / 4–7 / 0–3; course page 10–15 / 5–9 /
     0–4).
  6. **One open PR.** PR #45 is still **open**. A new Assignment 2 PR needs either #45 closed in
     the same action, or Assignment 2 pushed onto #45's branch, which would change the graded PR.
  7. **Lifecycle cap.** Assignment 1 capped status at RUNNABLE-SAMPLE. Assignment 2 states no cap.
  8. **Real postings in tracked files.** `private/README.md` says real scraped postings are never
     committed. The assignment needs real output shown. → Policy decision needed on excerpts.
  9. **Mislabel.** The PDF calls `npm run score` the "BLS/O*NET role-quality scorer". It is the
     composite combiner, and its `role_quality` weight is 0.0 (`DOMAIN.md` item 3).
  10. **Persona.** No existing fictional persona is an experienced backend engineer with pending
      OPT and a January 2027 start. → A new persona under `search/examples/` is proposed.
- **What Claude proposed (not executed):** a mode "Experienced Java Backend Opening Triage for a
  January 2027 Start" that reuses Assignment 1's exported sponsorship, vacancy, and liveness
  functions. It adds three checks (experience and degree compatibility, stack evidence, start
  window), evaluated on a rule-selected sample of about 12 real Greenhouse postings plus separate
  synthetic fixtures, with an isolated git worktree. Full plan in the chat reply for this entry.
- **Claude predicted:** at least a few real postings will state no start timing (→ "unknown"), and
  title seniority will disagree with the stated years for at least one posting. Not yet tested.
- **Aditya's expectations, decisions on items 1–10, and review of the scope:** **pending — Aditya
  to write.**
- **Next step:** Aditya reviews the scope and answers the open questions. No implementation,
  branch, worktree, commit, or push until then.

## A2-2026-10-20-E03 — Aditya's scope decisions and prediction (recorded before any evaluation)

*Contemporaneous. Recorded at `date` → `Tue Oct 20 23:54:53 EDT 2026`, before any branch, fetch,
or code. Source: Aditya's chat reply to E02. Paraphrased except where quoted.*

- **Decisions (Aditya):**
  1. Deadline: 2026-10-21 23:59 Eastern. Presentation date unconfirmed; prepare the five-minute
     demonstration anyway; no date is to be invented.
  2. PR: work on a separate contribution branch, preserving Assignment 1's commit, ZIP, and
     evidence. Prepare a replacement PR description that separates inherited Assignment 1 work
     from Assignment 2 additions. **Do not publish it or close PR #45 yet**; present the exact
     publication plan for review when ready.
  3. Branch and paths: follow the repository contribution contract (not the PDF's `mode/…`,
     `recipes/`, `assignments/` paths). Document the PDF-to-actual mapping and the discrepancy. Run
     log in `logs/runs/` and in the submission; never edit `logs/RUN_LOG.md`.
  4. Lifecycle target: RUNNABLE-SAMPLE. Also run on real public postings, separating live
     collection from replay of captured observations. A real-posting run alone does not establish
     RUNNABLE-LIVE. Never clear a human gate for Aditya or promote status for presentation value.
  5. Excerpts: minimal relevant excerpts from public employer postings may be committed, with
     employer, title, job id, URL, capture time, derived state, and the rule that produced it;
     missing data and failures recorded; no full pages, recruiter details, cookies, or private data;
     quoted evidence kept apart from interpretation.
  6. Public persona: new, explicitly fictional; 4.5 years full-time backend experience plus a
     separately recorded six-month applied-AI co-op; invented employers and dates; fictional target
     start 2027-02-01 supplied by configuration. Public title along the lines of "Experienced Java
     Backend Opening Triage for an Early-2027 Start". Aditya's real profile and requested start date
     stay private; no approval or legal eligibility is assumed.
  7. Co-op: excluded from the full-time total by default; both amounts visible. Apply explicit
     posting wording that accepts internships/co-ops/equivalent experience, with the excerpt.
     Unclear wording that would change the result → human review.
  8. Ranges and "ASAP": above the top of an ordinary "N–M years" range → flag a possible level
     mismatch for review, not a rejection, unless an explicit eligibility restriction exists. An
     explicit unmet requirement is a documented mismatch, not a claim the employer could never make
     an exception. "ASAP" is unresolved timing. A definite date conflict only when explicit employer
     requirements and supplied dates support it. Date compatibility stays separate from
     authorization and hiring duration.
  9. Sample: target 12 unique postings across three official employer career boards (one ATS
     technology is fine). Experienced Java/backend focus incl. relevant platform or applied-AI
     backend; internship-only roles excluded. Record the selection rule, search terms, scope,
     collection order, stopping rule, and duplicate handling **before examining outcomes**. Record
     inaccessible pages and exclusions; report the real count if under 12. Synthetic fixtures stay
     separate.
- **Aditya's prediction (verbatim, a hypothesis to test, not a finding):**
  > "Opening-specific sponsorship and start-date evidence will remain unresolved for some
  > apparently relevant Java backend roles. Experience and technical relevance alone will therefore
  > be insufficient to justify a confident recommendation."
- **Aditya's scope decision (paraphrase):** experience requirements, backend responsibilities, and
  explicit start constraints should change the workflow, while company sponsorship history stays
  separate from evidence about the individual opening.
- **What this entry does not claim:** Aditya's reply is a scope decision, not independent
  technical verification. Aditya has not run tests, inspected source rows, or cleared gates in
  Assignment 2. **Aditya's reflections on results: pending — Aditya to write.**
- **Claude's own predictions, recorded at the same time (before evaluation):**
  - C1: of the 12 real postings, at most 2 will state an explicit start date or season; most will
    end with start timing "unknown".
  - C2: at least one real posting will have a required minimum of years at or above 5, so the
    4.5-year persona gets a documented mismatch.
  - C3: at least half the real postings will be silent on sponsorship, or will only ask an
    application-style question.
  - C4: the Assignment 1 tool and this mode will disagree on the next step for at least one real
    posting, because of the experience or start-window checks.
- **Next step:** create the isolated worktree and branch, move this log into it, and record
  baselines.

## A2-2026-10-21-E04 — Worktree, baselines, fictional persona, and pre-registered sample protocol (Claude)

*Contemporaneous. `date` → `Tue Oct 20 23:59:53 EDT 2026`.*

- **Executed (Claude):**
  - `git worktree add /Users/adityaraj/Desktop/the-reallocation-engine-a2 -b
    contrib/2026fa-aditya-raj-sde-java-backend-early2027 1a618e7`. The Assignment 1 checkout is
    still on its branch at `1a618e7` and clean. This log was **moved** (not copied) from that
    checkout into the worktree.
  - `npm ci` → exit 0 (evidence `00-setup-worktree.txt`). Commit identity is a GitHub noreply
    address.
  - Baseline at `1a618e7` (evidence `01-baseline.txt`): Assignment 1 tests 18/18; `npm run
    verify` exit 0 (using the main checkout's `.venv` for PyYAML); `npm run doctor` exit 0;
    `pii-scan` **exit 1** on the same upstream `package-lock.json` line Assignment 1 documented
    (its "Confirmed blocker 1"). This is inherited, not new.
  - Wrote the fictional persona `search/examples/tariq-lindqvist/` (profile, résumé JSON, gaps):
    invented employers and dates; 24 + 30 = 54 months full-time; a 6-month co-op with an explicit
    `employment_type`; availability 2027-02-01. `git check-ignore` confirms the files are
    trackable.
  - Wrote `SAMPLE-PROTOCOL.md` **before any board fetch**.
- **Routine choices Claude made (open to Aditya's veto):**
  - Board order follows the sponsorship CSV ranked by approvals, with one slug guess per employer
    and a board-name identity check. This is reproducible and does not depend on posting wording.
    It does skew toward heavy sponsors, which is the population where history and the opening are
    easiest to confuse.
  - Java mention is part of the cohort rule. This biases the stack check and is disclosed there.
  - A board needs at least 4 cohort postings to qualify, so each board contributes equally.
  - Newest-first order.
  - The persona's master's degree ends 2027-01 and the B.Tech is in electronics, deliberately
    exercising "CS or related".
- **Aditya:** has not reviewed the persona or the protocol yet → **pending — Aditya to check**
  (optional; collection proceeds under the pre-registered rule).
- **Next step:** commit locally (no push) so the protocol's timestamp precedes collection; then
  probe boards.

## A2-2026-10-21-E05 — Correction: an evidence file reproduced a scanner-flagged address (Claude)

*Contemporaneous. `date` → `Wed Oct 21 00:00:22 EDT 2026`.*

- **What happened:** the first local commit (`5a40b7f`) included `evidence/01-baseline.txt`, which
  pasted the PII scanner's output verbatim, including the npm-author address it finds in
  `package-lock.json`. Running `node scripts/pii-scan.mjs` after the commit flagged that evidence
  file as a new finding. Assignment 1 had already hit this and redacted it (A1 evidence 06).
  Claude repeated the mistake.
- **Why it matters:** `pii-scan --diff` reads `git log -p base..HEAD`, so every commit's added
  lines count. A later fix commit would not clear the finding.
- **Response:** the commit had never been pushed. Claude redacted the address in the evidence file
  (same wording as A1) and **amended that single unpushed commit**. No fetch had happened at that
  point, so the protocol still precedes collection. From now on, evidence captures pass scanner
  output through redaction before they are saved.
