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

## A2-2026-10-21-E06 — Live collection and liveness observations (Claude)

*Contemporaneous. `date` → `Wed Oct 21 00:04:09 EDT 2026`.*

- **Executed:**
  - `collect.mjs` (live; evidence `02-live-collection.txt`, 00:01:47–00:01:55 EDT). Ran on the
    first attempt: 17 employers probed in protocol order; 14 returned 404 at the guessed slug;
    **Databricks (rank 12), Pinterest (15), Stripe (17)** verified by board name and qualified.
    12 postings selected (4 per board). Raw responses are in gitignored `private/a2/`; tracked:
    `real-sample/probe-log.json`, `real-sample/selection.json` (no posting text).
  - Cohort tallies (from `selection.json`): Databricks 900 jobs → 29 unique cohort (2 duplicates);
    Pinterest 158 → 7; Stripe 731 → 13. Most exclusions are "title not in scope".
  - `npm run ats:liveness` on the 12 URLs (evidence `03`, 00:02:07–00:02:38): **8 active,
    4 expired** (all Pinterest, "insufficient content — likely nav/footer only"), exit 1.
  - A supplementary read-only browser probe written by Claude (`page-probe.mjs`, evidence `04`):
    all 4 Pinterest URLs returned **HTTP 403** with document title "Just a moment..." (272
    characters). That is a bot-challenge interstitial, not a closed posting. The Databricks and
    Stripe pages resolved to the specific posting, with the title in the body.
- **Friction / finding:** the maintained liveness checker reports a blocked page as "expired". By
  Assignment 1's rules, which skip on `expired`, all 4 Pinterest postings would have been
  **skipped**, even though the employer's own API listed them 30 seconds earlier. This was not
  engineered; it is the first thing the real sample showed. → The mode needs a feed-vs-page
  disagreement rule that sends the case to a person, never to an automatic skip.
- **Discipline note:** Claude is writing the experience, stack, and start-window rules (v0.1)
  **before reading any of the 12 posting texts**. Misclassifications found afterwards will be
  logged as versioned corrections, not silently tuned away.
- **Aditya:** **pending** — interpretation of the Pinterest 403 case is a human liveness-review
  decision.

## A2-2026-10-21-E07 — Rules v0.1 on real text, and Claude's audit of the results

*Contemporaneous. `date` → `Wed Oct 21 00:12:26 EDT 2026`.*

- **Executed:** rules v0.1 were committed (`77d31aa`, 00:09:46) before any real posting text was
  read; extract + run on full private text + replay on committed excerpts + compare (evidence
  `05-real-run-v0.1.txt`). v0.1: 5 human-requirement-review, 4 human-liveness-review, 1
  human-eligibility-review, 1 skip, 1 seek-evidence. Full-text run and replay run: **0
  differences**. Committed excerpts are 14,655 of 60,498 characters (about 24%).
- **Claude's audit of v0.1 against the full text (first time Claude read the postings):**
  - **Wrong:** Stripe postings put the requirement in a heading line ("Must have three (3) years of
    experience in each of the following:"). v0.1 does not evaluate headings and does not parse
    "three (3)". Three Stripe postings were misread as "experience unstated" or "section unclear".
  - **Wrong:** "Must also have …" was not recognized as a required heading.
  - **Wrong:** Databricks lists "5+ years in Java…" and "3+ years distributed systems" as separate
    requirements that both apply. v0.1 called them "requirements disagree" (review) instead of a
    documented mismatch on the 5+ requirement.
  - **Arguable:** "Ideal Engineer should have" was read as *preferred*. The heading mixes
    preference and obligation wording, so "ambiguous" is more honest.
  - **Wrong:** "distributed ML systems" missed the distributed-systems pattern, and the stack
    message was misleading ("appears only in required lines").
  - **Correct as designed:** Pinterest feed-vs-page disagreement went to review; GovOps "active
    TS/SCI" went to eligibility review.
- **Observed, not engineered:** none of the 12 captured postings contains sponsorship or
  work-authorization wording, and none states a start date. (The Greenhouse `content` field does
  not include application-form questions; that limitation is recorded.)
- **Preserved failed attempt:** `runs/real-replay-v0.1/` stays as-is. The v0.1 excerpt input was
  overwritten by the v0.2 extract, then regenerated from commit `77d31aa` into
  `real-sample/observations-v0.1-extraction.json`. Its SHA-256 `67ba0ec3…` equals the
  `input_sha256` the v0.1 run recorded.

## A2-2026-10-21-E08 — Rules v0.2 (corrections from the E07 audit) on the real sample

*Contemporaneous. `date` → `Wed Oct 21 00:12:26 EDT 2026`.*

- **Changed (Claude), each traced to an E07 finding:**
  - Headings that state years or degrees are evaluated as requirement lines.
  - "N (n)" numerals are parsed.
  - "must (also) have" / "should have" headings count as required.
  - A heading with both preference and obligation cues is "ambiguous" and goes to review.
  - Required minimums are conjunctive: failing any one is a documented mismatch. The
    "requirements disagree" state was removed.
  - Distributed-systems pattern allows one word between ("distributed ML systems").
  - New stack state "java-without-backend-infrastructure-terms".
  - Relevant headings are always kept in the excerpts.
- **Result (evidence `06-real-run-v0.2.txt`):** 5 skip-application (all G4 documented experience
  mismatches: 5+, 5+, 5, 6, 10+ years required vs 4.5 full-time), 4 human-liveness-review
  (Pinterest), 1 human-eligibility-review (GovOps clearance), 1 human-requirement-review (ambiguous
  "Ideal…should have" heading), 1 seek-vacancy-sponsorship-evidence (Stripe "Software Engineer",
  meets its 3-year minimum). Full-text run vs replay: **0 differences**.
- **Residual defect found and not yet fixed:** "plus" in "…degree, plus three (3) years" is read as
  a preference cue, which made one heading "ambiguous". It does not change any v0.2 decision.
  Scheduled for v0.3 together with anything the synthetic tests reveal.
- **Risk Claude flags:** v0.2 was corrected using the same 12 postings it is now evaluated on, so
  its accuracy on unseen postings is not established. See the next entries for any held-out check.
- **Decision point for Aditya (pending):** on 3 real postings (Databricks 8864368002 and
  8806934002, Stripe 8230952) the co-op is exactly what separates 4.5 from 5.0 years, and none of
  them mentions co-ops. Under Aditya's rule (co-op excluded unless the wording accepts it) all 3 are
  documented mismatches. Claude kept the rule as decided. **Does Aditya treat "silent about co-ops"
  as "unclear wording" (→ review) or as "no acceptance" (→ mismatch, the current behavior)?**
- **Claude's predictions (E03) vs this run, Claude's own scoring:** C1 held (0 of 12 state a start
  date). C2 held (several required minimums ≥ 5). C3 held (12 of 12 silent). C4 not yet tested.
- **Aditya's prediction (E03):** the run's hypothesis tally reports 3 openings that cleared or were
  unknown on experience with core stack evidence, and all 3 still have unresolved opening-level
  sponsorship and start timing. **Interpretation: pending — Aditya to write.**

## A2-2026-10-21-E09 — Synthetic fixtures, offline tests, rules v0.3, and the Assignment 1 comparison (Claude)

*Contemporaneous. `date` → `Wed Oct 21 00:15:49 EDT 2026`.*

- **Synthetic fixtures:** 29 invented cases (S01–S30; S12 was never used, so it was folded into
  S03's "timing unstated") in `fixtures/synthetic-cases.json`, built by
  `fixtures/build-synthetic.mjs`, all on example.com. S01 borrows a real employer's CSV row
  **only** to test "strong history, refusing posting"; the posting text is invented, following
  Assignment 1's convention.
- **First run of the fixtures at v0.2:** 28 of 29 matched their expectations. **S27 failed:** "plus
  three (3) years" was read as a preference cue. This is the E08 residual defect, and it shows the
  fixture catches it. Fixed in **rules v0.3.0** (`(?:is |a )plus`).
- **Tests (evidence `08-tests-v0.3.txt`):** `node --test …/triage.test.mjs` → **45/45 pass**.
  The Assignment 1 suite still passes 18/18 (its code is unchanged). Tests cover:
  - every synthetic expectation;
  - a refusal despite a strong record;
  - no later gate clearing an earlier stop;
  - co-op months never silently added;
  - titles never deciding;
  - preference vs. requirement;
  - date-only start window;
  - feed-vs-page disagreement vs. Assignment 1's page-only rule;
  - JavaScript ≠ Java and negation;
  - excerpt losslessness;
  - the real-sample regression lock;
  - JSON/Markdown agreement;
  - the G1 exits;
  - output-path guard;
  - the static no-network check.
- **Real sample at v0.3 (evidence `07`):** decisions identical to v0.2. Full-text run vs replay:
  0 differences. `fixtures/real-sample-expected-v0.3.json` locks these decisions. **It is a
  regression lock audited by Claude, not human-verified ground truth.**
- **Assignment 1 tool on the same 12 real observations (evidence `09`):** Assignment 1 gives
  8 seek-evidence, 4 skip. **11 of 12 next steps change** under this mode:
  - 6 by G4 experience (5 skips, 1 review);
  - 4 by the G2 feed-vs-page rule (Assignment 1's *skip* → *review*);
  - 1 by G3 clearance wording.
  - Unchanged: Stripe "Software Engineer".
  - Claude's prediction C4 held. The Assignment 1 run used placeholder fit and timeline inputs
    (labelled in `a1-input.json`), which its decisions do not use.
- **Aditya:** **pending** — the Assignment 1 vs. Assignment 2 table is the main evidence for the
  TA's "situation too general" point; Aditya's reading of it is not recorded yet.

## A2-2026-10-21-E10 — Deliberate break: predictions recorded BEFORE running (Claude)

*Contemporaneous. `date` → `Wed Oct 21 00:16:25 EDT 2026`. Written before `break-test.mjs` was
executed for the first time.*

- **Mutants (fixtures/BROKEN-*.json, applied only inside a temporary worktree):**
  1. `stack-overrides-experience`: core stack evidence waves an experience stop through.
  2. `no-preference-distinction`: preferred headings are treated as required.
  3. `feed-ignored`: the employer-feed observation is dropped (Assignment 1's page-only liveness).
- **Claude predicts:**
  - Mutant 1 is caught by S02, S11, S29, the precedence test, and the real-sample lock. On the real
    sample it turns most of the 5 experience skips into `seek-vacancy-sponsorship-evidence`.
  - Mutant 2 is caught by S04 and the preference test. On the real sample it changes **nothing**:
    no real posting's only years statement sits under a plain "preferred" heading. That would show
    the protection matters on synthetic cases but was not exercised by this real sample.
  - Mutant 3 is caught by S19 and the feed-vs-page test. On the real sample all 4 Pinterest postings
    flip from review to skip.
- **Aditya's prediction:** not collected before this run. **Pending — Aditya may predict and re-run
  the harness for the demonstration** (the harness is repeatable).

## A2-2026-10-21-E11 — Break results, a harness artifact, and its correction (Claude)

*Contemporaneous. `date` → `Wed Oct 21 00:17:20 EDT 2026`.*

- **Run 1 (evidence `10-break-test.txt`):** all 3 mutants caught. **But** the test "outputs cannot
  land on tracked files outside the allowed run folders" failed for **every** mutant. Root cause:
  the harness created its worktrees inside the system temp directory, which the output guard
  deliberately allows. That failure was a harness artifact, not mutant detection. Run 1 is kept
  as-is.
- **Fix:** worktrees now go under gitignored `private/a2-break/`.
- **Run 2 (evidence `10b-break-test-run2.txt`), plus a control (unmutated HEAD in the same
  location: 45/45 pass):**

  | Mutant | Suite on mutant | Real-sample decisions changed |
  |---|---|---|
  | feed-ignored | 42/45 (S19, feed-vs-page test, real lock) | 4/12: all Pinterest review → **skip** |
  | no-preference-distinction | 43/45 (S04, preference test) | **0/12** |
  | stack-overrides-experience | 33/45 (12 failing) | 5/12: every experience skip → seek-evidence |

- **Claude's E10 predictions vs observed:** all three held. That includes the prediction that the
  preference mutant changes nothing on the real sample. The required-vs-preferred protection
  therefore matters on synthetic cases but was **not exercised** by this real sample. This is
  stated in the worked run.
- **Meaning (Claude's reading; Aditya's pending):** two protective checks visibly change real
  outcomes. Without the feed observation, 4 postings the employer was still listing would have
  been dropped. Without the G4 stop, a strong keyword match would have sent 5 openings with
  stated 5–10-year minimums to "seek sponsorship evidence", spending effort on roles whose stated
  bar the candidate does not meet.
