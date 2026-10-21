# Sources and assistance

## Executive summary

This page credits everything the work builds on, and says plainly what an AI assistant did and what the author decided, checked, changed or rejected. It exists so a reviewer can tell whose judgment stands behind each part, and so nothing the assistant produced is passed off as the author's own checking. Where the author has not yet done a check, this page says so.

## Repository and governing documents

- The Reallocation Engine repository (`nikbearbrown/the-reallocation-engine`), forked to `AravindKumar2504/the-reallocation-engine` and worked on from base commit `015843d`. Read first: `SNICKERDOODLE.md`, `DOMAIN.md`, `DATA_CONTRACT.md` (the Zero-Conditions section), `CONTRIBUTING.md`, `recipes/README.md`, `recipes/cases/README.md`, and `recipes/_shared.md` (the run-log shape).
- Style models for the recipe and card: `recipes/local-wage-adjustment.md` and `recipes/local-wage-adjustment.card.md`. The Summer 2026 case recipes in `recipes/cases/2026su/` were surveyed by a read-only assistant task, only to avoid duplicating one; all 14 are unbuilt drafts and none was reused. Three cover nearby ground and are cited in the recipe: `case-fullstack-swe-sponsor-triage.md` (a pre-OPT full-stack/backend sponsor triage, the closest), `case-backend-swe-opt-triage.md` and `case-opt-timeline-fit-company-targeting.md`; each is status DRAFT with 13 to 14 open typed TODOs and names only a `pantry/` placeholder that does not exist as its source. Later, independent read-only assistant tasks audited the finished branch: one before the author saw anything (`FRICTIONAL.md`, entry 10), three more on 2026-09-30 after the author asked for a full review against the assignment (entry 11), and a last one on a fresh clone of the final commit (entry 12). The last four ran as Claude Code subagents on Claude Opus; the model of the earlier task was not recorded. All of their reports are model output, and their claims were re-checked before any were acted on.
- The decision core, used unmodified and run as a command: `scripts/score/role-scorer.mjs`. Its input shape follows `data/examples/ch11-roles.json`.
- The name-matching rule is a port of `normalize_company_name` in `scripts/sec/entity-resolution.py`, checked against the Python original on all 30,569 names (0 differences; it can differ on exotic Unicode characters that do not occur in the data).
- Book chapters in `book/chapters/`: 7 (the four-tier vocabulary and "Unknown is not Avoid"), 10 (the timeline factor as a number between 0 and 1, computed from dates) and 11 (the scorer). The tier values 0.9 and 0.6 are chapter 11's worked-example values.
- The five personas in `search/examples/`: four existing fictional personas and one new fictional persona added for this work. Only two of the existing four are used: `aarav-patel` (to show the persona check refuses a file with no explicit `needs_sponsorship`) and `priya-nair` (a scenario run with values given on the command line). The new persona is the only file this work adds outside the four assigned locations; it sits in the directory the repository reserves for fictional personas, which the contrib-scope check allows.

## Data

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: the 80 Days to Stay table (Nik Bear Brown, Humanitarians AI), 30,369 companies. Its README and audit were read: `data/80-days-to-stay/data/README.md` and `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`.
- `data/sec/form-d/processed/sample/*.sample.json`: the shipped SEC Form D samples (200 records over four quarters). Only samples ship; full quarters are not committed.
- `data/bls/compact/soc_occupation_compact.csv`: the compact BLS OEWS and O*NET extract (OEWS 2024).

## Course documents

- The assignment page, read through the university's course site with the author signed in.
- The course's Frictional, GitHub posting and Relative Quartile documents were read by the assistant. **The course AI policy document and its video were not read by the assistant**, at the author's direction (the author said there was no need). The author says they read or watched the AI policy themselves. Because the assistant did not read it, neither the assistant's work nor the reviews of that work were checked against the policy's rules.

## Tools

Node and the repository's `js-yaml` dependency (the prototype and its tests); Python only in checks that compare the prototype with the repository's own Python name rule; the repository's own commands (`npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs`, `npm run score`, `npm run ats:liveness`); Playwright's Chromium and Node 20, each downloaded with the author's permission (Chromium so the liveness command could run once; Node 20, through `npx`, so the tests could be run on the repository's CI version). The request said the Chromium download was roughly 100 to 200 MB, and a later message of the assistant's reported only the 94.7 MiB part; the install in fact fetched three parts (Chrome for Testing 178.7 MiB, Chrome Headless Shell 94.7 MiB, FFmpeg 1 MiB), about 554 MB on disk in `~/Library/Caches/ms-playwright`, which the author can delete; Claude Code (model: Sonnet 5.5) as the assistant.

## What the assistant did and what the author did

| Work | The assistant (Claude Code) | The author (Aravind Sundaravadivelu) |
|---|---|---|
| Reading the assignment, repository, documents and data | read them, ran the repository's commands, probed the data and the scorer, and reported what it found (including two scorer defects) | signed in so the assignment page could be read; told the assistant not to read the AI policy; approved forking and cloning |
| Choosing the recipe | proposed a design and two alternatives, with reasons | chose "pre-OPT backend sponsor tiers" among three options |
| Attribution | asked first, as the author's notes require | chose no co-author trailer or PR footer, so AI use is disclosed here, in the README, and in `FRICTIONAL.md` |
| Downloads | asked before downloading | approved the Chromium and Node 20 downloads |
| Predictions, recipe, card, code, tests, run, reports | wrote all of them, ran all of the commands, and recorded the results | read the sample run's `report.md` on 2026-10-03; **has not yet reviewed the code, the parameters or the other documents line by line** |
| Parameters (thresholds, windows, the title rule) | proposed them, each with a sentence of reasoning | **not yet confirmed** |
| Time-saved estimate in the domain justification | measured how long the program takes (about a third of a second) and wrote the paragraph | gave the guess of about 5 minutes to check one company by hand (not timed); the figure of 15 companies a week is the assistant's assumption |
| The author's entries in FRICTIONAL.md | drafted them at the author's request, in the author's voice, from what the author did and said in the session; put nothing in them that the record does not show | asked for them to be drafted; the text is a draft for the author to correct |
| Checking | ran the tests (on Node 26 and Node 20), a deliberate-break harness, comparisons of its name rule and title reader against the Python originals, and a check of report values against raw rows; labelled 80 titles; had three rounds of independent read-only review made (`FRICTIONAL.md`, entries 10, 11 and 12) and fixed what they found | **none yet** |
| Corrections | found and fixed its own errors (the Form D overlap figure, a gap in its own tests, wrong expected numbers in tests, and the defects the reviews confirmed, including a local path in the history, which it scrubbed before anything was pushed) | not applicable yet |
| Decisions the author has made | | on 2026-10-03: read the report, signed the adequacy line in the run log (sample path only), kept the RUNNABLE-SAMPLE claim, and told the assistant to push and open the pull request |
| Still only the author can do | | upload to the course site; present in class; state what was understood |

The author's cells say "not yet" or "none yet" where that was still true when this page was last edited; the author changes them as they do each check.

Nothing in this work was copied from another student's submission. No real personal data was used: the persona, its dates and its contact details are invented, and the repository's own personal-data scan is run and pasted in the test report.

## Version 0.2.0 (Mode Build, 2026-10-19 and 2026-10-20)

Everything above describes version 0.1.0 and stays as written. Version 0.2.0 added the live step and corrected the lifecycle claim.

- **The assignment and the grader's comments.** The Mode Build assignment page, read through the university's course site with the author signed in, and the grader's comments on the Recipe Design submission (85 of 100). They led to three changes: the status follows the lifecycle table literally (DRAFT while any TODO is open), the attestation rows under the author's name are only checks the author ran, and the reflection comes from the author's own picks.
- **Engine tools, used unmodified:** the job-board providers in `scripts/ats/providers/` (Greenhouse, Lever and Ashby, and their shared `_http.mjs`), the scanner `scripts/ats/scan.mjs`, and the liveness checker `scripts/ats/check-liveness.mjs` with Playwright's Chromium (already installed for version 0.1.0).
- **Outside sources, read live on 2026-10-20:** the public job boards of the 59 shortlisted companies through those providers; the public posting APIs `boards-api.greenhouse.io` and `api.lever.co`, for the posting text that the screen quotes; and the posting pages themselves, opened by the checker and by the author. Only public postings were read; no account was used.
- **The work split.** Claude Code (Opus 5.5) proposed the design, the rules and the wording of every question, built the live step, ran every command not listed under the author, and wrote the documents. The author:
  - chose to build on this mode;
  - decided the parameters marked as the author's in the recipe, on 2026-10-19, picking the option the assistant had marked as recommended for each of the seven;
  - read the 8 chosen postings in browser tabs the assistant opened, and decided gate H1 on all 8 and gate H2 on the 7 that passed H1, on 2026-10-20;
  - decided the rule for conditional export-control clauses;
  - ran two liveness checks, one of them a deliberate break attempt;
  - picked the points of the reflection;
  - ran the offline tests three times, ran a deliberate break attempt on the mode's own code (the sample run without the acceptance flag: refused, exit 3) and a cross-check of Stripe's counts against the company table, and read the live report.
  All of it is in `mode-build/author-decisions.md`, with the times, and every multiple-choice pick is kept word for word in `mode-build/author-picks.json`.
- **AI use, in one line:** following the engine's own rule (AI executes, a person decides), Claude Code (Opus 5.5) did the execution: it proposed the design and the options, wrote the code and the documents, and ran every command not listed under the author's name. The judgment is the author's: choosing the mode, deciding the parameters and rules marked as the author's, reading every chosen posting and deciding both human gates wherever they applied, reading the live report, and running the checks and break attempts recorded under the author's name.
- **Not read by the assistant:** the course AI policy, as for version 0.1.0.
